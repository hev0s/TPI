import express from 'express';
import jwt from 'jsonwebtoken';
import {
    getAllVehicles,
    createVehiculeAdmin,
    updateVehiculeAdmin,
    deleteVehiculeAdmin,
    getBaseVehicleData
} from '../Database/LinkWithDatabase.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware strict pour vérifier que l'utilisateur est Admin
const verifyAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(403).json({ error: 'Aucun token fourni' });

    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Token invalide' });

        // Vérification du rôle
        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: 'Accès refusé. Droits administrateur requis.' });
        }

        req.userId = decoded.userId;
        next();
    });
};

// Route de vérification d'accès à la page
router.get('/verify', verifyAdmin, (req, res) => {
    res.status(200).json({ valid: true, message: "Accès Admin autorisé" });
});

// Récupérer un véhicule spécifique (pour le formulaire d'édition)
router.get('/vehicules/:id', verifyAdmin, async (req, res) => {
    try {
        const data = await getBaseVehicleData(req.params.id);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: 'Erreur lors de la récupération' });
    }
});

// Créer un véhicule
router.post('/vehicules', verifyAdmin, async (req, res) => {
    const { brand, model, battery_capacity, base_consumption, air_drag } = req.body;
    try {
        await createVehiculeAdmin(brand, model, battery_capacity, base_consumption, air_drag);
        res.status(201).json({ success: true, message: "Véhicule créé" });
    } catch (err) {
        res.status(500).json({ error: 'Erreur lors de la création' });
    }
});

// Modifier un véhicule
router.put('/vehicules/:id', verifyAdmin, async (req, res) => {
    const { brand, model, battery_capacity, base_consumption, air_drag } = req.body;
    try {
        await updateVehiculeAdmin(req.params.id, brand, model, battery_capacity, base_consumption, air_drag);
        res.status(200).json({ success: true, message: "Véhicule mis à jour" });
    } catch (err) {
        res.status(500).json({ error: 'Erreur lors de la modification' });
    }
});

// Supprimer un véhicule
router.delete('/vehicules/:id', verifyAdmin, async (req, res) => {
    try {
        await deleteVehiculeAdmin(req.params.id);
        res.status(200).json({ success: true, message: "Véhicule supprimé" });
    } catch (err) {
        res.status(500).json({ error: 'Erreur lors de la suppression' });
    }
});

export default router;