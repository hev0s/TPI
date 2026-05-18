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
app.set('trust proxy', 1);
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

    describe('Authentification et Rate Limiter', () => {
        it('Doit connecter l\'utilisateur (200)', async () => {
            dbLinks.getUserByUsername.mockResolvedValue({ id: 1, username: 'Niels', password: 'hash' });
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
            const res = await request(app).post('/api/login').send({ username: 'Niels', password: '123' });
            expect(res.statusCode).toBe(200);
        });

        // Test du rate-limiter (anti brute-force)
        it('Doit bloquer l\'utilisateur après 10 tentatives échouées (Erreur 429)', async () => {
            dbLinks.getUserByUsername.mockResolvedValue({ id: 1, username: 'Niels', password: 'hash' });
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(false); // Mauvais mot de passe

            // On lance 10 mauvaises requêtes (la limite)
            for (let i = 0; i < 10; i++) {
                await request(app).post('/api/login').send({ username: 'Niels', password: 'bad' });
            }

            // La 11ème requête doit être bloquée par le Rate Limiter
            const resBlocked = await request(app).post('/api/login').send({ username: 'Niels', password: 'bad' });
            expect(resBlocked.statusCode).toBe(429);
            expect(resBlocked.text).toContain('Trop de tentatives');
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

    describe('Test de l\'autocomplétion', () => {
        // Test de la recherche / autocomplétion
        it('Doit rechercher des véhicules dans le catalogue (GET /vehicules/search)', async () => {
            dbLinks.searchVehicles.mockResolvedValue([{ id: 1, brand: 'Tesla', model: 'Model 3' }]);
            const res = await request(app).get('/api/vehicules/search?q=Tes').set('Authorization', `Bearer ${token}`);
            expect(res.statusCode).toBe(200);
            expect(res.body[0].brand).toBe('Tesla');
            expect(dbLinks.searchVehicles).toHaveBeenCalledWith('Tes');
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
        // Test de suppression de véhicule
        it('Doit supprimer un véhicule du garage (DELETE /user/vehicule/:id)', async () => {
            dbLinks.deleteUserHasVehicule.mockResolvedValue();
            const res = await request(app).delete('/api/user/vehicule/5').set('Authorization', `Bearer ${token}`);
            expect(res.statusCode).toBe(200);
            expect(dbLinks.deleteUserHasVehicule).toHaveBeenCalledWith(1, "5");
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

        it('Doit supprimer le compte utilisateur (DELETE /user)', async () => {
            dbLinks.deleteUser.mockResolvedValue();
            const res = await request(app).delete('/api/user').set('Authorization', `Bearer ${token}`);
            expect(res.statusCode).toBe(200);
            expect(dbLinks.deleteUser).toHaveBeenCalledWith(1);
        });
    });
});