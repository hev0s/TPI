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

    it('Doit créer et récupérer un utilisateur', async () => {
        db.query.mockResolvedValue([{ insertId: 42 }]);
        const id = await dbLinks.createUser('NouveauTest', 'motdepasse');
        expect(db.query).toHaveBeenCalledWith('INSERT INTO user (username, password) VALUES (?,?)', ['NouveauTest', 'motdepasse']);
        expect(id).toBe(42);

        db.query.mockResolvedValue([[{ id: 1, username: 'Niels' }]]);
        const result = await dbLinks.getUserByUsername('Niels');
        expect(result.username).toBe('Niels');
    });

    it('Doit insérer/mettre à jour une voiture pour l\'utilisateur', async () => {
        db.query.mockResolvedValue([{}]);
        await dbLinks.setUserHasVehicule(1, 42, 95, 'winter');
        expect(db.query).toHaveBeenCalledWith(
            expect.stringContaining('ON DUPLICATE KEY UPDATE'),
            [1, 42, 95, 'winter', 42, 95, 'winter']
        );
    });

    it('Doit récupérer les données physiques complètes jointes (JOIN)', async () => {
        db.query.mockResolvedValue([[{ brand: 'Tesla', battery_capacity: 75 }]]);
        await dbLinks.getUserVehicleData(1, 10);
        expect(db.query).toHaveBeenCalledWith(
            expect.stringContaining('SELECT v.brand, v.model'),
            [1, 10]
        );
    });

    it('Doit insérer et supprimer un lieu favori', async () => {
        db.query.mockResolvedValue([{ insertId: 5 }]);
        await dbLinks.setFavoritePlace(1, 'Maison', 'Rue A', 46.0, 6.0);
        expect(db.query).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO saved_locations'),
            [1, 'Maison', 'Rue A', 46.0, 6.0]
        );

        db.query.mockResolvedValue([{}]);
        await dbLinks.deleteFavoritePlace(1, 5);
        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('DELETE'), [1, 5]);
    });
});