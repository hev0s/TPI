import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';

import {
    createUser,
    getUserByUsername,
    deleteUser,
    updateUsername,
    updateUserLanguage,
    getUserVehicule,
    setUserHasVehicule,
    updateUserHasVehicule,
    deleteUserHasVehicule,
    updateFavoritePlace,
    deleteFavoritePlace,
    searchVehicles,
    getAllVehicles
} from "../Database/LinkWithDatabase.js";

const router = express.Router();
const SALT_ROUNDS = 10;

const JWT_SECRET = process.env.JWT_SECRET;

// Configuration pour limiter les tentatives de connexion
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // Fenêtre de 15 minutes
    max: 10, // Limite chaque IP à 10 requêtes par fenêtre
    message: { error: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.' },
    standardHeaders: true, // Retourne les infos de limite dans les headers `RateLimit-*`
    legacyHeaders: false, // Désactive les headers `X-RateLimit-*`
});

router.use(express.json());

// --- ROUTE SIGNUP (Inscription) ---
router.post("/signup", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        const userId = await createUser(username, hashedPassword);
        res.status(201).json({ success: true, userId: userId });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Username already exists' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

// --- ROUTE LOGIN (Connexion) ---
router.post("/login", loginLimiter, async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const user = await getUserByUsername(username);

        if (!user) {
            return res.status(401).json({ error: 'Identifiants incorrects' });
        }

        const match = await bcrypt.compare(password, user.password);

        if (match) {
            const token = jwt.sign(
                { userId: user.id, role: user.role || 'user' },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            // La réponse inclut le rôle
            res.status(200).json({ success: true, token: token, message: 'Connecté !', language: user.language, role: user.role });
        } else {
            res.status(401).json({ error: 'Identifiants incorrects' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// --- MIDDLEWARE (vérification avec token) ---
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(403).json({ error: 'Aucun token fourni' });
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Token invalide ou expiré' });
        }

        req.userId = decoded.userId;
        next();
    });
};

router.get("/verify", verifyToken, (req, res) => {
    res.status(200).json({ valid: true, message: "Accès autorisé" });
});

// --- MODIFIER LE NOM D'UTILISATEUR ---
router.put("/user/username", verifyToken, async (req, res) => {
    const { newUsername } = req.body;
    if (!newUsername) return res.status(400).json({ error: 'Nouveau pseudo requis' });

    try {
        await updateUsername(req.userId, newUsername);
        res.status(200).json({ success: true, message: 'Nom mis à jour avec succès' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Ce nom d\'utilisateur est déjà pris' });
        }
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// --- SUPPRIMER LE COMPTE ---
router.delete("/user", verifyToken, async (req, res) => {
    try {
        await deleteUser(req.userId);
        res.status(200).json({ success: true, message: 'Compte supprimé' });
    } catch (err) {
        res.status(500).json({ error: 'Erreur lors de la suppression du compte' });
    }
});

// --- RECEVOIR LES VEHICULES DE L'UTILISATEUR ---
router.get("/vehicules", verifyToken, async (req, res) => {
    try {
        const vehicules = await getUserVehicule(req.userId);
        res.status(200).json(vehicules);
    } catch (err) {
        res.status(500).json({ error: 'Erreur lors de la récupération des véhicules' });
    }
});

// --- RECEVOIR TOUS LES VEHICULES (Catalogue) ---
router.get("/vehicules/all", verifyToken, async (req, res) => {
    try {
        const vehicules = await getAllVehicles();
        res.status(200).json(vehicules);
    } catch (err) {
        res.status(500).json({ error: 'Erreur lors de la récupération du catalogue' });
    }
});

// --- RECHERCHER UN VÉHICULE (AUTOCOMPLÉTION) ---
router.get("/vehicules/search", verifyToken, async (req, res) => {
    const query = req.query.q;
    if (!query || query.length < 3) {
        return res.json([]);
    }

    try {
        const results = await searchVehicles(query);
        res.status(200).json(results);
    } catch (err) {
        res.status(500).json({ error: 'Erreur lors de la recherche' });
    }
});

// --- ENREGISTRER UN NOUVEAU VÉHICULE ---
router.put("/user/car", verifyToken, async (req, res) => {
    const { carId, tireType, battery_health } = req.body;

    // On utilise battery_health si fourni, sinon 100 par défaut
    const finalBatteryHealth = battery_health !== undefined ? battery_health : 100;

    if (!carId || !tireType) {
        return res.status(400).json({ error: 'Données manquantes' });
    }

    try {
        await setUserHasVehicule(req.userId, carId, battery_health, tireType);
        res.status(200).json({ success: true, message: 'Véhicule enregistré' });
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur lors de la sauvegarde' });
    }
});

// --- MODIFIER UN VEHICULE EXISTANT ---
router.put("/updateVehicule/:id", verifyToken, async (req, res) => {
    const entryId = req.params.id; // id de l'ancien véhicule
    const { carId, battery_health, tireType } = req.body; // carId est le nouveau véhicule

    if (!carId || battery_health === undefined || !tireType) {
        return res.status(400).json({ error: 'Données manquantes' });
    }

    try {
        // On passe l'ID du véhicule, la batterie et le type de pneu à la fonction de mise à jour
        await updateUserHasVehicule(req.userId, entryId, carId, battery_health, tireType);
        res.status(200).json({ success: true, message: "Véhicule modifié" });
    } catch (err) {
        console.error("Erreur lors de la modification du véhicule :", err);
        res.status(500).json({ error: 'Erreur lors de la modification du véhicule' });
    }
});

// --- SUPPRIMER UN VEHICULE ---
router.delete("/user/vehicule/:id", verifyToken, async (req, res) => {
    const vehiculeId = req.params.id;

    try {
        await deleteUserHasVehicule(req.userId, vehiculeId);
        res.status(200).json({ success: true, message: "Véhicule supprimé" });
    } catch (err) {
        res.status(500).json({ error: 'Erreur lors de la suppression du véhicule' });
    }
});

// --- MODIFIER LA LANGUE ---
router.put("/user/language", verifyToken, async (req, res) => {
    const { language } = req.body;
    if (!language) return res.status(400).json({ error: 'Langue requise' });

    try {
        await updateUserLanguage(req.userId, language);
        res.status(200).json({ success: true, message: 'Langue mise à jour avec succès' });
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

export default router;