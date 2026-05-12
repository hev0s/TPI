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

    beforeEach(() => {
        dbLinks.getUserVehicleData.mockResolvedValue(mockCar);
        global.fetch.mockResolvedValue({ ok: true, json: async () => ({ elements: [], geometry: [[6,46,400], [6.1,46.1,450]] }) });
    });

    it('Compare la consommation des modes Eco, Normal et Sport', async () => {
        const payload = { carId: 1, routeSegments: [{ distance: 10000, speed: 120, slope: 0, courbure: 0 }], allowStops: true, coordinates: [[6,46], [6.1,46.1]] };

        const rNormal = await request(app).post('/api/calculs/simulate').set('Authorization', `Bearer ${token}`).send({ ...payload, routeType: 'normal' });
        const rEco = await request(app).post('/api/calculs/simulate').set('Authorization', `Bearer ${token}`).send({ ...payload, routeType: 'eco' });
        const rSport = await request(app).post('/api/calculs/simulate').set('Authorization', `Bearer ${token}`).send({ ...payload, routeType: 'sport' });

        expect(rSport.body.energieConsommee_kWh).toBeGreaterThan(rNormal.body.energieConsommee_kWh);
        expect(rNormal.body.energieConsommee_kWh).toBeGreaterThan(rEco.body.energieConsommee_kWh);
    });

    it('Détecte une batterie insuffisante et propose (ou refuse) des arrêts', async () => {
        // CORRECTION : On divise le trajet extrême de 1000km en 10 segments de 100km pour simuler le vrai comportement du GPS
        const segmentsArray = Array(10).fill({ distance: 100000, speed: 100, slope: 0, courbure: 0 });
        const payload = { carId: 1, routeSegments: segmentsArray, allowStops: false, coordinates: [[6,46], [7,47]] };

        // Sans arrêts autorisés
        const resNoStops = await request(app).post('/api/calculs/simulate').set('Authorization', `Bearer ${token}`).send(payload);
        expect(resNoStops.body.needsChargingStop).toBe(true);
        expect(resNoStops.body.message).toContain("pas possible");

        // Avec arrêts autorisés
        payload.allowStops = true;
        const resStops = await request(app).post('/api/calculs/simulate').set('Authorization', `Bearer ${token}`).send(payload);

        expect(resStops.body.stopsNeeded).toBeGreaterThan(0);
        expect(resStops.body.chargingTime_s).toBeGreaterThan(0); // Désormais, l'algorithme est réparé !
    });
});