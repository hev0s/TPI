// routes/calculs.js
import express from 'express';
import jwt from 'jsonwebtoken';
import {getUserVehicleData, getBaseVehicleData} from "../Database/LinkWithDatabase.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware pour vérifier l'utilisateur
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(403).json({ error: 'Aucun token fourni' });

    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Token invalide' });
        req.userId = decoded.userId;
        next();
    });
};

// 1. CONSTANTES PHYSIQUES
const RHO_AIR = 1.225;
const GRAVITE = 9.81;
const CRR_ETE = 0.010;
const CRR_HIVERS = 0.012;
const CRR_ALL_SEASON = 0.011;
const C_ALPHA = 150000; // Rigidité de dérive globale estimée des pneus (N/rad)

router.post('/simulate', verifyToken, async (req, res) => {
    try {
        const { carId, routeSegments, routeType, allowStops, coordinates } = req.body;

        // --- LISSAGE DE LA VITESSE ---
        for (let i = 0; i < routeSegments.length; i++) {
            let current = routeSegments[i].speed;

            // Anomalie : Vitesse en dessous de 10km/h ou au-dessus de 150km/h
            if (current < 10 || current > 150) {
                let prev = i > 0 ? routeSegments[i - 1].speed : null;
                let next = i < routeSegments.length - 1 ? routeSegments[i + 1].speed : null;

                if (prev !== null && next !== null && Math.abs(prev - next) < 10) {
                    routeSegments[i].speed = prev; // Vitesses similaires autour, on garde cette vitesse
                } else {
                    routeSegments[i].speed = 50; // Vitesse différente, valeur sécurisée par défaut (ex: Village)
                }
            }
        }

        // --- RÉCUPÉRATION ET LISSAGE DES DÉNIVELÉS (API ORS) ---
        let elevations = [];
        if (coordinates && coordinates.length > 0) {
            try {
                // Échantillonnage pour éviter de surcharger l'API ORS (> 2000 points souvent refusés)
                const sampledCoords = coordinates.filter((_, i) => i % Math.ceil(coordinates.length / 500) === 0);

                const orsRes = await fetch('https://api.openrouteservice.org/elevation/line', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': process.env.ORS_API_KEY
                    },
                    body: JSON.stringify({
                        format_in: "polyline",
                        geometry: sampledCoords
                    })
                });

                if (orsRes.ok) {
                    const orsData = await orsRes.json();
                    if (orsData && orsData.geometry) {
                        elevations = orsData.geometry; // [lon, lat, altitude]

                        // Lissage des anomalies altimétriques
                        for(let i = 1; i < elevations.length - 1; i++) {
                            const prevAlt = elevations[i-1][2];
                            const currAlt = elevations[i][2];
                            const nextAlt = elevations[i+1][2];

                            // Si pic soudain de plus de 200m
                            if (Math.abs(currAlt - prevAlt) > 200 && Math.abs(currAlt - nextAlt) > 200) {
                                elevations[i][2] = (prevAlt + nextAlt) / 2;
                            }
                        }

                        // Mapping rudimentaire des pentes lissées sur les segments
                        const ptsPerSegment = Math.max(1, Math.floor(elevations.length / routeSegments.length));
                        for (let i = 0; i < routeSegments.length; i++) {
                            const startIdx = Math.min(i * ptsPerSegment, elevations.length - 1);
                            const endIdx = Math.min((i + 1) * ptsPerSegment, elevations.length - 1);

                            if (startIdx < endIdx) {
                                const startAlt = elevations[startIdx][2];
                                const endAlt = elevations[endIdx][2];
                                const dist = routeSegments[i].distance;

                                let slope = dist > 0 ? ((endAlt - startAlt) / dist) * 100 : 0;

                                // Lissage extrême (pas plus de 15% ou -15% sur une vraie route goudronnée)
                                if (slope > 15) slope = 15;
                                if (slope < -15) slope = -15;

                                routeSegments[i].slope = slope;
                            } else {
                                routeSegments[i].slope = 0;
                            }
                        }
                    }
                }
            } catch (e) {
                console.error("Erreur ORS Elevation :", e);
            }
        }

        // --- CALCUL DES COURBURES (VIRAGES) ---
        // On associe une courbure moyenne (rad/m) à chaque segment en analysant le changement de cap
        if (coordinates && coordinates.length > 1) {
            const ptsPerSegment = Math.max(1, Math.floor(coordinates.length / routeSegments.length));

            for (let i = 0; i < routeSegments.length; i++) {
                const startIdx = Math.min(i * ptsPerSegment, coordinates.length - 1);
                const endIdx = Math.min((i + 1) * ptsPerSegment, coordinates.length - 1);

                let totalAngle = 0;
                let lastHeading = null;

                for (let j = startIdx; j < endIdx; j++) {
                    const p1 = coordinates[j];
                    const p2 = coordinates[j + 1];
                    if (!p1 || !p2) break; // Sécurité

                    // Calcul du cap (heading) entre deux points GPS
                    const phi1 = p1[1] * Math.PI / 180;
                    const phi2 = p2[1] * Math.PI / 180;
                    const deltaLambda = (p2[0] - p1[0]) * Math.PI / 180;

                    const y = Math.sin(deltaLambda) * Math.cos(phi2);
                    const x = Math.cos(phi1) * Math.sin(phi2) -
                        Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
                    const heading = Math.atan2(y, x);

                    // Si on a un cap précédent, on calcule la différence d'angle
                    if (lastHeading !== null) {
                        let diff = heading - lastHeading;
                        // Normalisation entre -PI et PI pour prendre le virage le plus court
                        while (diff > Math.PI) diff -= 2 * Math.PI;
                        while (diff < -Math.PI) diff += 2 * Math.PI;
                        totalAngle += Math.abs(diff);
                    }
                    lastHeading = heading;
                }

                // Courbure (rad/m) = Angle total tourné / distance du segment
                const dist = routeSegments[i].distance;
                routeSegments[i].courbure = dist > 0 ? (totalAngle / dist) : 0;
            }
        }

        // Récupérer les données du véhicule depuis la BDD
        let carData = await getUserVehicleData(req.userId, carId);

        // Si l'utilisateur n'a pas ce véhicule enregistré, on va chercher les données de base
        if (!carData) {
            const baseData = await getBaseVehicleData(carId);
            if (!baseData) return res.status(404).json({ error: 'Véhicule introuvable' });

            // On lui attribue des valeurs par défaut pour la simulation
            carData = {
                ...baseData,
                battery_health: 100,
                tyre: 'summer'
            };
        }

        // Définir le coefficient de pneu
        let crr = CRR_ETE;
        if (carData.tyre === 'winter') crr = CRR_HIVERS;
        else if (carData.tyre === 'all_season') crr = CRR_ALL_SEASON;

        // Variables du véhicule
        const cx = carData.air_drag || 0.23; // Par défaut si null en base
        const surfaceFrontale = 2.2; // Surface frontale négligée en base, on met une moyenne
        const masse = 1800; // Masse moyenne, à ajouter en BDD idéalement
        const rendementTraction = 0.85;
        const rendementRegen = 0.65;
        const puissanceAcc = 0; // Négligé pour le moment

        let totalEnergyKwh = 0;

        // On simule chaque segment du trajet
        for (const segment of routeSegments) {
            const v = (segment.speed || 80) / 3.6; // km/h -> m/s
            const penteEnPourcentage = segment.slope || 0;
            const distance_m = segment.distance;

            // Calcul de l'angle de la pente en radians
            const alpha = Math.atan(penteEnPourcentage / 100);

            /* ====================================================================
               1. RÉSISTANCE AÉRODYNAMIQUE (F_aero)
               Force opposée par l'air au déplacement du véhicule.
               Formule : 1/2 * Rho * S * Cx * v^2
               - Rho (RHO_AIR) : Densité de l'air (~1.225 kg/m3)
               - S (surfaceFrontale) : Surface du véhicule face à la route (m2)
               - Cx : Coefficient de pénétration dans l'air (aérodynamisme)
               - v^2 : Vitesse au carré. C'est pourquoi la consommation explose à haute vitesse.
               ==================================================================== */
            const F_aero = 0.5 * RHO_AIR * surfaceFrontale * cx * Math.pow(v, 2);

            /* ====================================================================
               2. RÉSISTANCE AU ROULEMENT (F_roulement)
               Force liée à la déformation des pneus sous le poids du véhicule.
               Formule : Crr * m * g * cos(alpha)
               - Crr : Coefficient de résistance au roulement (dépend de la gomme)
               - m (masse) * g (GRAVITE) : Poids du véhicule en Newtons
               - cos(alpha) : Réduit très légèrement la force sur les fortes pentes.
               ==================================================================== */
            const F_roulement = crr * masse * GRAVITE * Math.cos(alpha);

            /* ====================================================================
               3. FORCE DE LA PENTE / GRAVITÉ (F_pente)
               Force qui tire le véhicule vers le bas en montée, ou le pousse en descente.
               Formule : m * g * sin(alpha)
               - sin(alpha) : Positif en montée (résistance), négatif en descente
                 (ce qui donnera une force totale négative et permettra la régénération).
               ==================================================================== */
            const F_pente = masse * GRAVITE * Math.sin(alpha);

            /* ====================================================================
               4. RÉSISTANCE AU VIRAGE (F_virage)
               Friction supplémentaire causée par l'angle de dérive des pneus pour
               contrer la force centrifuge dans une courbe.
               Formules : F_centrifuge = m * accélération_latérale
                          F_virage = (F_centrifuge^2) / C_alpha
               - courbure : Radian par mètre tourné (calculé au préalable)
               - C_alpha : Rigidité de dérive des pneus (N/rad)
               ==================================================================== */
            const courbure = segment.courbure || 0;
            let acc_lat = Math.pow(v, 2) * courbure; // Accélération latérale (v^2 * courbure)

            // Sécurité physique : on limite l'accélération latérale à 1G (9.81 m/s²).
            // Au-delà, un véhicule de tourisme normal dérape totalement.
            if (acc_lat > GRAVITE) acc_lat = GRAVITE;

            const F_centrifuge = masse * acc_lat;
            const F_virage = Math.pow(F_centrifuge, 2) / C_ALPHA;

            /* ====================================================================
               BILAN DES FORCES ET PUISSANCE MÉCANIQUE
               On additionne toutes les résistances.
               La Puissance mécanique (Watts) = Force totale (N) * Vitesse (m/s)
               ==================================================================== */
            const F_tot = F_aero + F_roulement + F_pente + F_virage;
            const P_meca = F_tot * v;

            /* ====================================================================
               CONVERSION ÉLECTRIQUE
               Le moteur et l'inverter ont des pertes énergétiques (rendement < 1).
               - Si F_tot > 0 : Le moteur doit forcer. Il consomme plus d'électricité
                 qu'il ne produit de force mécanique (division par le rendement).
               - Si F_tot < 0 : Le véhicule ralentit (descente). Le moteur génère de
                 l'électricité mais avec des pertes (multiplication par le rendement).
               ==================================================================== */
            let P_elec = 0;
            if (F_tot > 0) {
                P_elec = (P_meca / rendementTraction) + puissanceAcc;
            } else {
                P_elec = (P_meca * rendementRegen) + puissanceAcc;
            }

            /* ====================================================================
               CONSOMMATION DU SEGMENT (ÉNERGIE)
               L'énergie = Puissance * Temps.
               On calcule le temps passé sur le segment (Distance / Vitesse),
               puis on divise par 3'600'000 pour passer des Joules aux kiloWattheures (kWh).
               ==================================================================== */
            const time_s = distance_m / v;
            const E_conso_segment = (P_elec * time_s) / 3600000;

            totalEnergyKwh += E_conso_segment;
        }

        // Calcul SoC Final
        const capaciteBatterieUtile = carData.battery_capacity || 75.0;
        const socInitial = carData.battery_health || 100;
        const deltaSoC = (totalEnergyKwh / capaciteBatterieUtile) * 100;
        let socFinal = socInitial - deltaSoC;

        let needsChargingStop = false;
        let stopsNeeded = 0;

        // Stratégie d'arrêt : on vérifie si l'énergie requise dépasse l'énergie disponible
        if (deltaSoC > socInitial) {
            needsChargingStop = true;
            if (allowStops) {
                // Énergie initialement disponible
                const energyAvailable = capaciteBatterieUtile * (socInitial / 100);
                // Énergie manquante pour le trajet
                const energyMissing = totalEnergyKwh - energyAvailable;
                // Calcul du nombre de recharges complètes nécessaires
                stopsNeeded = Math.ceil(energyMissing / capaciteBatterieUtile);
                // Nouveau SoC final en supposant qu'à chaque arrêt on recharge à 100% de la capacité utile
                const totalEnergyWithCharges = energyAvailable + (stopsNeeded * capaciteBatterieUtile);
                const remainingEnergy = totalEnergyWithCharges - totalEnergyKwh;
                socFinal = (remainingEnergy / capaciteBatterieUtile) * 100;
            } else {
                // Arrêts interdits : la batterie se videra avant l'arrivée
                stopsNeeded = 0;
                socFinal = 0;
            }
        } else if (allowStops && socFinal < 10) {
            // Si on n'a pas strictement "besoin" de charger pour arriver, mais que le SoC final est très bas et que les arrêts sont autorisés
            needsChargingStop = true;
            stopsNeeded = 1;
            socFinal = socFinal + 100; // On suppose une recharge
        }

        socFinal = Math.max(0, Math.min(100, socFinal)); // Borner le résultat

        // Création du message dynamique
        let finalMessage = "Trajet faisable sans arrêt.";
        if (needsChargingStop) {
            if (!allowStops) {
                finalMessage = "Il n'est pas possible de rejoindre la destination sans arrêt.";
            } else {
                finalMessage = `Attention : Ce trajet nécessite ${stopsNeeded} arrêt(s) pour recharger.`;
            }
        }

        res.status(200).json({
            energieConsommee_kWh: totalEnergyKwh,
            socFinal: socFinal,
            needsChargingStop: needsChargingStop,
            stopsNeeded: stopsNeeded,
            message: finalMessage
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors du calcul de consommation' });
    }
});

export default router;