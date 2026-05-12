import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'test.token';

jest.unstable_mockModule('../Database/LinkWithDatabase.js', () => ({
    createUser: jest.fn(), getUserByUsername: jest.fn(), deleteUser: jest.fn(),
    updateUsername: jest.fn(), updateUserLanguage: jest.fn(), getUserVehicule: jest.fn(),
    setUserHasVehicule: jest.fn(), updateUserHasVehicule: jest.fn(), deleteUserHasVehicule: jest.fn(),
    searchVehicles: jest.fn(), getAllVehicles: jest.fn(), updateFavoritePlace: jest.fn(), deleteFavoritePlace: jest.fn()
}));

const dbLinks = await import('../Database/LinkWithDatabase.js');
const { default: authRoutes } = await import('../routes/auth.js');

const app = express();
app.use(express.json());
app.use('/api', authRoutes);

describe('Tests complets Auth & Profil Utilisateur', () => {
    const token = jwt.sign({ userId: 1, role: 'user' }, process.env.JWT_SECRET);

    afterEach(() => { jest.clearAllMocks(); });

    describe('Authentification (Signup / Login)', () => {
        it('Doit refuser une inscription si des champs manquent (400)', async () => {
            const res = await request(app).post('/api/signup').send({ username: 'Seul' });
            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('Username and password are required');
        });

        it('Doit inscrire un utilisateur (201)', async () => {
            dbLinks.createUser.mockResolvedValue(10);
            jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed_pw');
            const res = await request(app).post('/api/signup').send({ username: 'Nouveau', password: 'mdp' });
            expect(res.statusCode).toBe(201);
        });

        it('Doit refuser une connexion si champs manquent (400)', async () => {
            const res = await request(app).post('/api/login').send({ password: '123' });
            expect(res.statusCode).toBe(400);
        });

        it('Doit connecter l\'utilisateur et renvoyer un token (200)', async () => {
            dbLinks.getUserByUsername.mockResolvedValue({ id: 1, username: 'Niels', password: 'hash', role: 'user', language: 'fr' });
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
            const res = await request(app).post('/api/login').send({ username: 'Niels', password: '123' });
            expect(res.statusCode).toBe(200);
            expect(res.body.token).toBeDefined();
        });
    });

    describe('Vérification du Token (Middleware)', () => {
        it('Doit refuser l\'accès sans token (403)', async () => {
            const res = await request(app).get('/api/verify');
            expect(res.statusCode).toBe(403);
        });

        it('Doit autoriser l\'accès avec un bon token (200)', async () => {
            const res = await request(app).get('/api/verify').set('Authorization', `Bearer ${token}`);
            expect(res.statusCode).toBe(200);
            expect(res.body.valid).toBe(true);
        });
    });

    describe('Gestion des Véhicules de l\'utilisateur', () => {
        it('Doit refuser l\'ajout d\'un véhicule si données manquantes (400)', async () => {
            const res = await request(app).put('/api/user/car').set('Authorization', `Bearer ${token}`).send({ carId: 5 }); // Manque tireType
            expect(res.statusCode).toBe(400);
        });

        it('Doit ajouter un véhicule (200)', async () => {
            dbLinks.setUserHasVehicule.mockResolvedValue();
            const res = await request(app).put('/api/user/car').set('Authorization', `Bearer ${token}`)
                .send({ carId: 5, tireType: 'winter', battery_health: 90 });
            expect(res.statusCode).toBe(200);
        });

        it('Doit refuser la modification d\'un véhicule si données manquantes (400)', async () => {
            const res = await request(app).put('/api/updateVehicule/5').set('Authorization', `Bearer ${token}`).send({ carId: 6 });
            expect(res.statusCode).toBe(400);
        });
    });

    describe('Gestion du profil', () => {
        it('Doit refuser la modification du pseudo si vide (400)', async () => {
            const res = await request(app).put('/api/user/username').set('Authorization', `Bearer ${token}`).send({});
            expect(res.statusCode).toBe(400);
        });

        it('Doit modifier le pseudo (200)', async () => {
            dbLinks.updateUsername.mockResolvedValue();
            const res = await request(app).put('/api/user/username').set('Authorization', `Bearer ${token}`).send({ newUsername: 'Niels2' });
            expect(res.statusCode).toBe(200);
        });
    });
});