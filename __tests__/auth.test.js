import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'test.token';

jest.unstable_mockModule('../Database/LinkWithDatabase.js', () => ({
    createUser: jest.fn(),
    getUserByUsername: jest.fn(),
    deleteUser: jest.fn(),
    updateUsername: jest.fn(),
    updateUserLanguage: jest.fn(),
    getUserVehicule: jest.fn(),
    setUserHasVehicule: jest.fn(),
    updateUserHasVehicule: jest.fn(),
    deleteUserHasVehicule: jest.fn(),
    searchVehicles: jest.fn(),
    getAllVehicles: jest.fn(),
    updateFavoritePlace: jest.fn(),
    deleteFavoritePlace: jest.fn()
}));

const dbLinks = await import('../Database/LinkWithDatabase.js');
const { default: authRoutes } = await import('../routes/auth.js');

const app = express();
app.use(express.json());
app.use('/api', authRoutes);

describe('Tests complets Auth & Profil Utilisateur', () => {
    const token = jwt.sign({ userId: 1, role: 'user' }, process.env.JWT_SECRET);

    afterEach(() => { jest.clearAllMocks(); });

    describe('Authentification', () => {
        it('Login réussi', async () => {
            dbLinks.getUserByUsername.mockResolvedValue({ id: 1, username: 'Niels', password: 'hash' });
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

            const res = await request(app).post('/api/login').send({ username: 'Niels', password: '123' });
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.token).toBeDefined();
        });

        it('Login échoué (mauvais identifiants)', async () => {
            dbLinks.getUserByUsername.mockResolvedValue({ id: 1, username: 'Niels', password: 'hash' });
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

            const res = await request(app).post('/api/login').send({ username: 'Niels', password: 'bad' });
            expect(res.statusCode).toBe(401);
            expect(res.body.error).toBe('Identifiants incorrects');
        });

        it('Inscription avec succès', async () => {
            dbLinks.createUser.mockResolvedValue(10);
            jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed_pw');

            const res = await request(app).post('/api/signup').send({ username: 'Nouveau', password: 'mdp' });
            expect(res.statusCode).toBe(201);
            expect(res.body.userId).toBe(10);
        });

        it('Inscription échouée (Pseudo déjà pris)', async () => {
            const err = new Error();
            err.code = 'ER_DUP_ENTRY';
            dbLinks.createUser.mockRejectedValue(err);

            const res = await request(app).post('/api/signup').send({ username: 'Nouveau', password: 'mdp' });
            expect(res.statusCode).toBe(409);
        });
    });

    describe('Gestion des Véhicules de l\'utilisateur', () => {
        it('Doit lister le catalogue et la recherche', async () => {
            dbLinks.getAllVehicles.mockResolvedValue([{ id: 1, brand: 'Tesla' }]);
            const resAll = await request(app).get('/api/vehicules/all').set('Authorization', `Bearer ${token}`);
            expect(resAll.statusCode).toBe(200);

            dbLinks.searchVehicles.mockResolvedValue([{ id: 1, brand: 'Tesla' }]);
            const resSearch = await request(app).get('/api/vehicules/search?q=Tes').set('Authorization', `Bearer ${token}`);
            expect(resSearch.statusCode).toBe(200);
        });

        it('Ajout, modification et suppression de véhicule au profil', async () => {
            dbLinks.setUserHasVehicule.mockResolvedValue();
            const add = await request(app).put('/api/user/car').set('Authorization', `Bearer ${token}`)
                .send({ carId: 5, tireType: 'winter', battery_health: 90 });
            expect(add.statusCode).toBe(200);

            dbLinks.updateUserHasVehicule.mockResolvedValue();
            const upd = await request(app).put('/api/updateVehicule/5').set('Authorization', `Bearer ${token}`)
                .send({ carId: 6, battery_health: 80, tireType: 'summer' });
            expect(upd.statusCode).toBe(200);

            dbLinks.deleteUserHasVehicule.mockResolvedValue();
            const del = await request(app).delete('/api/user/vehicule/5').set('Authorization', `Bearer ${token}`);
            expect(del.statusCode).toBe(200);
        });
    });

    describe('Gestion du profil', () => {
        it('Doit changer le pseudo et la langue', async () => {
            dbLinks.updateUsername.mockResolvedValue();
            const p = await request(app).put('/api/user/username').set('Authorization', `Bearer ${token}`).send({ newUsername: 'Niels2' });
            expect(p.statusCode).toBe(200);

            dbLinks.updateUserLanguage.mockResolvedValue();
            const l = await request(app).put('/api/user/language').set('Authorization', `Bearer ${token}`).send({ language: 'en' });
            expect(l.statusCode).toBe(200);
        });

        it('Doit supprimer le compte', async () => {
            dbLinks.deleteUser.mockResolvedValue();
            const d = await request(app).delete('/api/user').set('Authorization', `Bearer ${token}`);
            expect(d.statusCode).toBe(200);
        });
    });
});