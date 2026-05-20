import { jest } from '@jest/globals';

jest.unstable_mockModule('../Database/ConnectToDatabase.js', () => ({
    default: {
        query: jest.fn(),
        getConnection: jest.fn().mockResolvedValue({ release: jest.fn() })
    }
}));

const { default: db } = await import('../Database/ConnectToDatabase.js');
const dbLinks = await import('../Database/LinkWithDatabase.js');

describe('LinkWithDatabase - Vérification exhaustive des requêtes SQL', () => {
    afterEach(() => { jest.clearAllMocks(); });

    describe('Gestion Utilisateurs', () => {
        it('createUser', async () => {
            db.query.mockResolvedValue([{ insertId: 42 }]);
            const id = await dbLinks.createUser('Test', 'mdp');
            expect(db.query).toHaveBeenCalledWith('INSERT INTO user (username, password) VALUES (?,?)', ['Test', 'mdp']);
            expect(id).toBe(42);
        });

        it('getUserByUsername', async () => {
            db.query.mockResolvedValue([[{ username: 'Niels' }]]);
            await dbLinks.getUserByUsername('Niels');
            expect(db.query).toHaveBeenCalledWith('SELECT * FROM user WHERE username = ?', ['Niels']);
        });

        it('deleteUser', async () => {
            db.query.mockResolvedValue([{}]);
            await dbLinks.deleteUser(1);
            expect(db.query).toHaveBeenCalledWith('DELETE FROM user WHERE id = ?', [1]);
        });

        it('updateUsername', async () => {
            db.query.mockResolvedValue([{}]);
            await dbLinks.updateUsername(1, 'NielsV2');
            expect(db.query).toHaveBeenCalledWith('UPDATE user SET username = ? WHERE id = ?', ['NielsV2', 1]);
        });

        it('updateUserLanguage et getUserLanguage', async () => {
            db.query.mockResolvedValue([[{ language: 'en' }]]);
            await dbLinks.updateUserLanguage(1, 'en');
            expect(db.query).toHaveBeenCalledWith('UPDATE user SET language = ? WHERE id = ?', ['en', 1]);

            const lang = await dbLinks.getUserLanguage(1);
            expect(lang).toBe('en');
        });
    });

    describe('Gestion Favoris', () => {
        it('setFavoritePlace', async () => {
            db.query.mockResolvedValue([{ insertId: 5 }]);
            await dbLinks.setFavoritePlace(1, 'M', 'Rue', 46.0, 6.0);
            expect(db.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO saved_locations'), [1, 'M', 'Rue', 46.0, 6.0]);
        });

        it('getFavoritePlaces', async () => {
            db.query.mockResolvedValue([[]]);
            await dbLinks.getFavoritePlaces(1);
            expect(db.query).toHaveBeenCalledWith('SELECT id, label, address, latitude, longitude FROM saved_locations WHERE user_id = ?', [1]);
        });

        it('updateFavoritePlace', async () => {
            db.query.mockResolvedValue([{}]);
            await dbLinks.updateFavoritePlace(1, 5, 'M2', 'Rue2', 47.0, 7.0);
            expect(db.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE saved_locations'), ['M2', 'Rue2', 47.0, 7.0, 1, 5]);
        });

        it('deleteFavoritePlace', async () => {
            db.query.mockResolvedValue([{}]);
            await dbLinks.deleteFavoritePlace(1, 5);
            expect(db.query).toHaveBeenCalledWith('DELETE FROM saved_locations WHERE user_id = ? AND id = ?', [1, 5]);
        });
    });

    describe('Gestion Véhicules Utilisateur', () => {
        it('setUserHasVehicule', async () => {
            db.query.mockResolvedValue([{}]);
            await dbLinks.setUserHasVehicule(1, 42, 95, 'winter');
            expect(db.query).toHaveBeenCalledWith(expect.stringContaining('ON DUPLICATE KEY UPDATE'), [1, 42, 95, 'winter', 42, 95, 'winter']);
        });

        it('updateUserHasVehicule', async () => {
            db.query.mockResolvedValue([{}]);
            await dbLinks.updateUserHasVehicule(1, 42, 43, 90, 'summer');
            expect(db.query).toHaveBeenCalledWith('UPDATE user_has_vehicule SET vehicule_id=?, battery_health = ?,  tyre=? WHERE user_id = ? AND vehicule_id = ?', [43, 90, 'summer', 1, 42]);
        });

        it('deleteUserHasVehicule', async () => {
            db.query.mockResolvedValue([{}]);
            await dbLinks.deleteUserHasVehicule(1, 42);
            expect(db.query).toHaveBeenCalledWith('DELETE FROM user_has_vehicule WHERE user_id = ? AND vehicule_id = ?', [1, 42]);
        });

        it('getUserVehicule', async () => {
            db.query.mockResolvedValue([[]]);
            await dbLinks.getUserVehicule(1);
            expect(db.query).toHaveBeenCalledWith(expect.stringContaining('JOIN vehicule'), [1]);
        });

        it('getUserVehicleData', async () => {
            db.query.mockResolvedValue([[{ brand: 'Tesla' }]]);
            await dbLinks.getUserVehicleData(1, 10);
            expect(db.query).toHaveBeenCalledWith(expect.stringContaining('AND uhv.vehicule_id = ?'), [1, 10]);
        });
    });

    describe('Gestion Catalogue (Recherche & Admin)', () => {
        it('getAllVehicles', async () => {
            db.query.mockResolvedValue([[]]);
            await dbLinks.getAllVehicles();
            expect(db.query).toHaveBeenCalledWith('SELECT id, brand, model FROM vehicule ORDER BY brand, model');
        });

        it('searchVehicles', async () => {
            db.query.mockResolvedValue([[]]);
            await dbLinks.searchVehicles('Tes');
            expect(db.query).toHaveBeenCalledWith('SELECT id, brand, model FROM vehicule WHERE brand LIKE ? OR model LIKE ? LIMIT 10', ['%Tes%', '%Tes%']);
        });

        it('getBaseVehicleData', async () => {
            db.query.mockResolvedValue([[{ brand: 'Tesla' }]]);
            await dbLinks.getBaseVehicleData(10);
            expect(db.query).toHaveBeenCalledWith(expect.stringContaining('FROM vehicule WHERE id = ?'), [10]);
        });

        it('createVehiculeAdmin', async () => {
            db.query.mockResolvedValue([{ insertId: 99 }]);
            await dbLinks.createVehiculeAdmin('Brand', 'Model', 50, 15, 0.2);
            expect(db.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO vehicule'), ['Brand', 'Model', 50, 15, 0.2]);
        });

        it('updateVehiculeAdmin', async () => {
            db.query.mockResolvedValue([{}]);
            await dbLinks.updateVehiculeAdmin(99, 'Brand', 'Model', 50, 15, 0.2);
            expect(db.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE vehicule SET brand=?'), ['Brand', 'Model', 50, 15, 0.2, 99]);
        });

        it('deleteVehiculeAdmin', async () => {
            db.query.mockResolvedValue([{}]);
            await dbLinks.deleteVehiculeAdmin(99);
            expect(db.query).toHaveBeenCalledWith('DELETE FROM vehicule WHERE id=?', [99]);
        });
    });
});