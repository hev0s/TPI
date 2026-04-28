import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createUser, getUserByUsername, deleteUser, updateUsername,updateUserLanguage, setUserHasVehicule, updateUserHasVehicule, deleteUserHasVehicule } from "../Database/LinkWithDatabase.js";

const router = express.Router();
const SALT_ROUNDS = 10;

const JWT_SECRET = process.env.JWT_SECRET;

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
router.post("/login", async (req, res) => {
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
                { userId: user.id },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            // Ajout de la langue dans la réponse
            res.status(200).json({ success: true, token: token, message: 'Connecté !', language: user.language });
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