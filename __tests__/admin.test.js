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

    describe('Création et Modification (Validation des données)', () => {
        it('Doit refuser la création si Marque ou Modèle manquent (400)', async () => {
            const res = await request(app).post('/api/admin/vehicules')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ brand: 'Tesla' }); // model manquant

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('Marque et modèle obligatoires');
        });

        it('Doit refuser la création si les valeurs techniques sont négatives (400)', async () => {
            const res = await request(app).post('/api/admin/vehicules')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ brand: 'Renault', model: 'Zoe', battery_capacity: -50, base_consumption: 15, air_drag: 0.25 });

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('Les valeurs numériques ne peuvent pas être négatives.');
        });

        it('Doit créer un véhicule valide (201)', async () => {
            dbLinks.createVehiculeAdmin.mockResolvedValue(10);
            const res = await request(app).post('/api/admin/vehicules')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ brand: 'Renault', model: 'Zoe', battery_capacity: 50, base_consumption: 15, air_drag: 0.25 });

            expect(res.statusCode).toBe(201);
        });

        it('Doit refuser la modification si les valeurs techniques sont négatives (400)', async () => {
            const res = await request(app).put('/api/admin/vehicules/10')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ brand: 'Renault', model: 'Zoe', battery_capacity: 50, base_consumption: -10, air_drag: 0.25 });

            expect(res.statusCode).toBe(400);
        });
    });

    describe('Lecture et Suppression', () => {
        it('Récupère un véhicule spécifique pour édition', async () => {
            dbLinks.getBaseVehicleData.mockResolvedValue({ brand: 'Renault', model: 'Zoe' });
            const res = await request(app).get('/api/admin/vehicules/1').set('Authorization', `Bearer ${adminToken}`);
            expect(res.statusCode).toBe(200);
            expect(res.body.brand).toBe('Renault');
        });

        it('Supprime un véhicule du catalogue', async () => {
            dbLinks.deleteVehiculeAdmin.mockResolvedValue();
            const res = await request(app).delete('/api/admin/vehicules/10').set('Authorization', `Bearer ${adminToken}`);
            expect(res.statusCode).toBe(200);
        });
    });
});