import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'test.token';

jest.unstable_mockModule('../Database/LinkWithDatabase.js', () => ({
    getFavoritePlaces: jest.fn(), setFavoritePlace: jest.fn(),
    deleteFavoritePlace: jest.fn(), updateFavoritePlace: jest.fn()
}));

const dbLinks = await import('../Database/LinkWithDatabase.js');
const { default: navigationRoutes } = await import('../routes/navigation.js');

const app = express();
app.use(express.json());
app.use('/api/navigation', navigationRoutes);
global.fetch = jest.fn();

describe('Tests complets Navigation & Adresses', () => {
    const token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET);
    afterEach(() => { jest.clearAllMocks(); });

    describe('Lieux Favoris', () => {
        it('Cycle de vie complet: Ajout, Modification, Suppression', async () => {
            dbLinks.setFavoritePlace.mockResolvedValue(1);
            const add = await request(app).post('/api/navigation/favorites').set('Authorization', `Bearer ${token}`)
                .send({ placeName: 'Test', address: 'Rue 1', latitude: 46, longitude: 6 });
            expect(add.statusCode).toBe(201);

            dbLinks.updateFavoritePlace.mockResolvedValue();
            const upd = await request(app).put('/api/navigation/favorites/1').set('Authorization', `Bearer ${token}`)
                .send({ placeName: 'Test2', address: 'Rue 2', latitude: 47, longitude: 7 });
            expect(upd.statusCode).toBe(200);

            dbLinks.deleteFavoritePlace.mockResolvedValue();
            const del = await request(app).delete('/api/navigation/favorites/1').set('Authorization', `Bearer ${token}`);
            expect(del.statusCode).toBe(200);
        });
    });

    describe('Géocodage & Autocomplétion', () => {
        it('Doit géocoder via les favoris s\'il trouve une correspondance', async () => {
            dbLinks.getFavoritePlaces.mockResolvedValue([{ label: 'Maison', latitude: 1, longitude: 2, address: 'Rue A' }]);
            const res = await request(app).post('/api/navigation/geocode').set('Authorization', `Bearer ${token}`).send({ address: 'Maison' });
            expect(res.body.lat).toBe(1);
            expect(global.fetch).not.toHaveBeenCalled(); // API externe non appelée
        });

        it('Doit géocoder via l\'API Nominatim si non favori', async () => {
            dbLinks.getFavoritePlaces.mockResolvedValue([]);
            global.fetch.mockResolvedValue({ ok: true, json: async () => [{ lat: '10', lon: '20' }] });

            const res = await request(app).post('/api/navigation/geocode').set('Authorization', `Bearer ${token}`).send({ address: 'Paris' });
            expect(res.body.lat).toBe('10');
            expect(global.fetch).toHaveBeenCalled();
        });

        it('Doit renvoyer les suggestions mixtes (Favoris + Photon API)', async () => {
            dbLinks.getFavoritePlaces.mockResolvedValue([{ label: 'Gare', address: 'Rue de la Gare, CH' }]);
            global.fetch.mockResolvedValue({
                ok: true, json: async () => ({ features: [{ properties: { name: 'Gare CFF', city: 'Lausanne', country: 'CH' } }] })
            });

            const res = await request(app).post('/api/navigation/autocomplete').set('Authorization', `Bearer ${token}`).send({ text: 'Gar' });
            expect(res.statusCode).toBe(200);
            expect(res.body).toContain('⭐ Gare (Rue de la Gare - CH)');
            expect(res.body).toContain('Gare CFF, Lausanne, CH');
        });
    });
});