import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'test.token';

jest.unstable_mockModule('../Database/LinkWithDatabase.js', () => ({
    getAllVehicles: jest.fn(), createVehiculeAdmin: jest.fn(),
    updateVehiculeAdmin: jest.fn(), deleteVehiculeAdmin: jest.fn(), getBaseVehicleData: jest.fn()
}));

const dbLinks = await import('../Database/LinkWithDatabase.js');
const { default: adminRoutes } = await import('../routes/admin.js');

const app = express();
app.use(express.json());
app.use('/api/admin', adminRoutes);

describe('Tests Administration & Sécurité', () => {
    const adminToken = jwt.sign({ userId: 1, role: 'admin' }, process.env.JWT_SECRET);
    const userToken = jwt.sign({ userId: 2, role: 'user' }, process.env.JWT_SECRET);

    describe('Sécurité Admin', () => {
        it('Bloque les accès non autorisés (sans token ou mauvais rôle)', async () => {
            const noToken = await request(app).get('/api/admin/verify');
            expect(noToken.statusCode).toBe(403);

            const badRole = await request(app).get('/api/admin/verify').set('Authorization', `Bearer ${userToken}`);
            expect(badRole.statusCode).toBe(403);
            expect(badRole.body.error).toBe('Accès refusé. Droits administrateur requis.');
        });

        it('Autorise l\'accès avec token admin', async () => {
            const res = await request(app).get('/api/admin/verify').set('Authorization', `Bearer ${adminToken}`);
            expect(res.statusCode).toBe(200);
        });
    });

    describe('Gestion du Catalogue Global', () => {
        it('Ajoute un nouveau véhicule global', async () => {
            dbLinks.createVehiculeAdmin.mockResolvedValue(10);
            const res = await request(app).post('/api/admin/vehicules').set('Authorization', `Bearer ${adminToken}`)
                .send({ brand: 'Renault', model: 'Zoe' });
            expect(res.statusCode).toBe(201);
        });

        it('Met à jour un véhicule existant', async () => {
            dbLinks.updateVehiculeAdmin.mockResolvedValue();
            const res = await request(app).put('/api/admin/vehicules/10').set('Authorization', `Bearer ${adminToken}`)
                .send({ brand: 'Renault', model: 'Zoe 2' });
            expect(res.statusCode).toBe(200);
        });

        it('Supprime un véhicule du catalogue', async () => {
            dbLinks.deleteVehiculeAdmin.mockResolvedValue();
            const res = await request(app).delete('/api/admin/vehicules/10').set('Authorization', `Bearer ${adminToken}`);
            expect(res.statusCode).toBe(200);
        });
    });
});