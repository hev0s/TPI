// routes/calculs.js
import express from 'express';
import jwt from 'jsonwebtoken';

import {getUserVehicleData} from "../Database/LinkWithDatabase.js";

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

router.post('/simulate', verifyToken, async (req, res) => {
    try {
        const { carId, routeSegments, routeType, allowStops } = req.body;

        // Récupérer les données du véhicule depuis la BDD
        const carData = await getUserVehicleData(req.userId, carId);
        if (!carData) return res.status(404).json({ error: 'Véhicule introuvable' });

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

            // Calcul des forces
            const alpha = Math.atan(penteEnPourcentage / 100);
            const F_aero = 0.5 * RHO_AIR * surfaceFrontale * cx * Math.pow(v, 2);
            const F_roulement = crr * masse * GRAVITE * Math.cos(alpha);
            const F_pente = masse * GRAVITE * Math.sin(alpha);

            const F_tot = F_aero + F_roulement + F_pente;
            const P_meca = F_tot * v;

            // Puissance électrique
            let P_elec = 0;
            if (F_tot > 0) {
                P_elec = (P_meca / rendementTraction) + puissanceAcc;
            } else {
                P_elec = (P_meca * rendementRegen) + puissanceAcc;
            }

            // Énergie consommée sur le segment en kWh
            const time_s = distance_m / v;
            const E_conso_segment = (P_elec * time_s) / 3600000; // Joules -> kWh
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
        } else if (allowStops && socFinal < 10) {
            // Si on n'a pas strictement "besoin" de charger pour arriver,
            // mais que le SoC final est très bas et que les arrêts sont autorisés
            needsChargingStop = true;
            stopsNeeded = 1;
            socFinal = socFinal + 100; // On suppose une recharge
        }

        socFinal = Math.max(0, Math.min(100, socFinal)); // Borner le résultat

        res.status(200).json({
            energieConsommee_kWh: totalEnergyKwh,
            socFinal: socFinal,
            needsChargingStop: needsChargingStop,
            stopsNeeded: stopsNeeded,
            message: needsChargingStop
                ? `Attention : Ce trajet nécessite ${stopsNeeded} arrêt(s) pour recharger.`
                : "Trajet faisable sans arrêt."
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors du calcul de consommation' });
    }
});

export default router;