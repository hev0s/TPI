import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'test.token';

jest.unstable_mockModule('../Database/LinkWithDatabase.js', () => ({
    getUserVehicleData: jest.fn(), getBaseVehicleData: jest.fn()
}));

const dbLinks = await import('../Database/LinkWithDatabase.js');
const { default: calculsRoutes } = await import('../routes/calculs.js');

const app = express();
app.use(express.json());
app.use('/api/calculs', calculsRoutes);

global.fetch = jest.fn();

describe('Tests complets - Simulateur Physique & Consommation', () => {
    const token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET);
    const mockCar = { weight: 1500, battery_capacity: 50, air_drag: 0.23, battery_health: 100, tyre: 'summer' };
    const basePayload = {
        carId: 1,
        routeSegments: [{ distance: 10000, speed: 120, slope: 5, courbure: 0 }],
        allowStops: true,
        coordinates: [[6,46], [6.1,46.1]]
    };

    beforeEach(() => {
        jest.clearAllMocks();
        dbLinks.getUserVehicleData.mockResolvedValue(mockCar);

        // Rend le terminal propre en cachant les console.error attendus pendant ces tests
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    it('Compare la consommation des modes Eco, Normal et Sport', async () => {
        // Mock global pour que tous les fetchs (ORS et Overpass) réussissent
        global.fetch.mockResolvedValue({ ok: true, json: async () => ({ elements: [], geometry: [] }) });

        const rNormal = await request(app).post('/api/calculs/simulate').set('Authorization', `Bearer ${token}`).send({ ...basePayload, routeType: 'normal' });
        const rEco = await request(app).post('/api/calculs/simulate').set('Authorization', `Bearer ${token}`).send({ ...basePayload, routeType: 'eco' });
        const rSport = await request(app).post('/api/calculs/simulate').set('Authorization', `Bearer ${token}`).send({ ...basePayload, routeType: 'sport' });

        expect(rSport.body.energieConsommee_kWh).toBeGreaterThan(rNormal.body.energieConsommee_kWh);
        expect(rNormal.body.energieConsommee_kWh).toBeGreaterThan(rEco.body.energieConsommee_kWh);
    });

    it('Détecte une batterie insuffisante et propose (ou refuse) des arrêts', async () => {
        global.fetch.mockResolvedValue({ ok: true, json: async () => ({ elements: [], geometry: [] }) });
        const segmentsArray = Array(10).fill({ distance: 100000, speed: 100, slope: 0, courbure: 0 });
        const payload = { carId: 1, routeSegments: segmentsArray, allowStops: false, coordinates: [[6,46], [7,47]] };

        const resNoStops = await request(app).post('/api/calculs/simulate').set('Authorization', `Bearer ${token}`).send(payload);
        expect(resNoStops.body.needsChargingStop).toBe(true);

        payload.allowStops = true;
        const resStops = await request(app).post('/api/calculs/simulate').set('Authorization', `Bearer ${token}`).send(payload);
        expect(resStops.body.stopsNeeded).toBeGreaterThan(0);
    });

    it('Annule la pente et l\'aérodynamisme si un Tunnel est détecté par Overpass', async () => {
        // 1. Premier fetch (ORS) : réussi
        global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ geometry: [] }) });
        // 2. Deuxième fetch (Overpass) : renvoie un tunnel
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                elements: [{ tags: { tunnel: "yes" }, center: { lat: 46.05, lon: 6.05 } }]
            })
        });

        const res = await request(app).post('/api/calculs/simulate').set('Authorization', `Bearer ${token}`).send(basePayload);

        expect(res.statusCode).toBe(200);
        expect(res.body.energieConsommee_kWh).toBeDefined();
    });

    it('Gère correctement l\'erreur 429 de l\'API Overpass', async () => {
        // 1. Premier fetch (ORS) : Laisse passer
        global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ geometry: [] }) });
        // 2. Deuxième fetch (Overpass) : Bloque (429)
        global.fetch.mockResolvedValueOnce({ ok: false, status: 429 });

        const res = await request(app).post('/api/calculs/simulate').set('Authorization', `Bearer ${token}`).send(basePayload);
        expect(res.statusCode).toBe(429);
        expect(res.body.error).toContain('Overpass');
    });

    it('Gère correctement l\'erreur 429 de l\'API ORS (Elevation)', async () => {
        // 1. Premier fetch (ORS) : Bloque tout de suite (429)
        global.fetch.mockResolvedValueOnce({ ok: false, status: 429 });

        const res = await request(app).post('/api/calculs/simulate').set('Authorization', `Bearer ${token}`).send(basePayload);
        expect(res.statusCode).toBe(429);
        expect(res.body.error).toContain('ORS');
    });

    it('Utilise les données de base (Catalogue) si l\'utilisateur n\'a pas la voiture dans son garage', async () => {
        global.fetch.mockResolvedValue({ ok: true, json: async () => ({ elements: [], geometry: [] }) });
        dbLinks.getUserVehicleData.mockResolvedValue(null);
        dbLinks.getBaseVehicleData.mockResolvedValue({ weight: 1600, battery_capacity: 60, air_drag: 0.25 });

        const res = await request(app).post('/api/calculs/simulate').set('Authorization', `Bearer ${token}`).send(basePayload);
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('energieConsommee_kWh');
    });
});