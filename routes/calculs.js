import express from 'express';
import jwt from 'jsonwebtoken';

import {getUserVehicleData} from "../Database/LinkWithDatabase.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

export default router;

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

const RHO_AIR = 1.225;
const GRAVITE = 9.81;
const CRR_ETE = 0.01;
const CRR_HIVERS = 0.23;


/**
 * 1. CONSTANTES PHYSIQUES
 * ----------------------------------------------------------------------------
 * @const {number} RHO_AIR - Masse volumique de l'air à 15°C (en kg/m^3)
 * const RHO_AIR = 1.225;
 *
 * @const {number} GRAVITE - Accélération de la pesanteur (en m/s^2)
 * const GRAVITE = 9.81;
 *
 * 2. VARIABLES TYPES DU VÉHICULE
 * ----------------------------------------------------------------------------
 * @var {number} cx - Coefficient de traînée aérodynamique (ex: 0.23 pour Tesla Model 3) (2Fx)/((1/2)*RHO_AIR*Vitesse^2)
 * Fx Force de trainée (soufflerie) ==> A chercher (à intégrer en BDD)
 * @var {number} surfaceFrontale - Surface frontale "S" ou "A" (en m^2, ex: 2.2) --> Négligé pour le moment
 * @var {number} crr - Coefficient de résistance au roulement (ex: 0.01 pour pneus été) --> A modifier en BDD (pneu été/hivers, puis constante attribuée)
 * @var {number} masse - Masse totale du véhicule en charge (en kg)
 * @var {number} rendementTraction - Efficacité Batterie -> Roues (ex: 0.85) --> Soit faire une moyenne soit inégrer en BDD pour chaque véhicules
 * @var {number} rendementRegen - Efficacité Roues -> Batterie au freinage (ex: 0.65) --> Soit faire une moyenne soit inégrer en BDD pour chaque véhicules
 * @var {number} puissanceAcc - Puissance des accessoires: chauffage, écrans (en Watts) --> On va négliger cette partie pour le moment
 */

/**
 * 3. CALCUL DES FORCES DE RÉSISTANCE (en Newtons)
 * ----------------------------------------------------------------------------
 * Note : La vitesse (v) doit être en mètres par seconde (m/s).
 * Conversion : v_ms = v_kmh / 3.6
 *
 * A. Force Aérodynamique (Traînée)
 * F_aero = 0.5 * RHO_AIR * surfaceFrontale * cx * Math.pow(v, 2)
 *
 * B. Angle de la pente (en radians)
 * alpha = Math.atan(penteEnPourcentage / 100)
 *
 * C. Force de Roulement (Frottement des pneus)
 * F_roulement = crr * masse * GRAVITE * Math.cos(alpha)
 *
 * D. Force de Gravité (Liée à la pente)
 * F_pente = masse * GRAVITE * Math.sin(alpha)
 *
 * E. Force Totale (hors accélération)
 * F_tot = F_aero + F_roulement + F_pente
 */

/**
 * 4. CALCUL DES PUISSANCES (en Watts)
 * ----------------------------------------------------------------------------
 * A. Puissance Mécanique requise aux roues
 * P_meca = F_tot * v
 *
 * B. Puissance Électrique tirée (ou injectée) dans la batterie
 *
 * if (F_tot > 0) {
 *     // Phase de traction (Le moteur consomme)
 *     P_elec = (P_meca / rendementTraction) + puissanceAcc
 * } else {
 *     // Phase de régénération (Descente : le moteur recharge la batterie)
 *     // F_tot et P_meca sont négatifs ici.
 *     P_elec = (P_meca * rendementRegen) + puissanceAcc
 * }
 */

/**
 * 5. CALCUL DE LA CONSOMMATION FINALE (en kWh/100km)
 * ----------------------------------------------------------------------------
 * Pour obtenir des kWh/100km à partir de Watts et de m/s :
 * On convertit les Watts en kW ( / 1000)
 * On calcule l'énergie pour 100 km ( (P_elec / v) * 100 000 mètres )
 *
 * C_100km = (P_elec / (v * 10)) / 1000
 *
 * // Ou de manière plus explicite si on utilise la vitesse en km/h :
 * // C_100km = ( (P_elec / 1000) / v_kmh ) * 100
 */

/**
 * ============================================================================
 * CALCUL DE L'ÉTAT DE CHARGE (SoC - State of Charge)
 * ============================================================================
 *
 * 6. VARIABLES DE LA BATTERIE ET DU TRAJET
 * ----------------------------------------------------------------------------
 * @var {number} capaciteBatterieUtile - Capacité nette de la batterie (en kWh, ex: 75.0)
 * @var {number} socInitial - État de charge au départ (en %, de 0 à 100)
 * @var {number} distanceTrajet - Distance totale parcourue (en km)
 */

/**
 * 7. CALCUL DE L'ÉNERGIE CONSOMMÉE (en kWh)
 * ----------------------------------------------------------------------------
 * L'énergie totale extraite de la batterie sur l'ensemble du trajet.
 *
 * E_conso = C_100km * (distanceTrajet / 100)
 *
 * // Si calcul pas-à-pas (par seconde) :
 * // E_conso = somme( (P_elec / 1000) * (temps_ecoule_en_secondes / 3600) )
 */

/**
 * 8. CALCUL DE LA VARIATION DU SOC (en %)
 * ----------------------------------------------------------------------------
 * Représente le pourcentage de batterie utilisé pendant le trajet.
 * Si le véhicule a plus régénéré qu'il n'a consommé (ex: grande descente),
 * cette valeur sera négative.
 *
 * deltaSoC = (E_conso / capaciteBatterieUtile) * 100
 */

/**
 * 9. CALCUL DU SOC FINAL (en %)
 * ----------------------------------------------------------------------------
 * L'état de charge à l'arrivée. Le résultat doit idéalement être borné
 * entre 0 et 100 pour respecter les limites physiques de la batterie.
 *
 * socFinal = socInitial - deltaSoC
 *
 * // Borner le résultat :
 * // socFinal = Math.max(0, Math.min(100, socFinal))
 */
