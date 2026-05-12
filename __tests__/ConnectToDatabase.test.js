import { jest } from '@jest/globals';

jest.unstable_mockModule('mysql2/promise', () => ({
    default: {
        createPool: jest.fn().mockReturnValue({
            getConnection: jest.fn().mockResolvedValue({ release: jest.fn() })
        })
    }
}));

describe('Test de la Configuration Database (ConnectToDatabase)', () => {
    let originalEnv;

    beforeAll(() => {
        originalEnv = process.env;
        process.env = { ...originalEnv, DB_HOST: 'localhost', DB_USER: 'test', DB_NAME: 'db' };
    });

    afterAll(() => { process.env = originalEnv; });

    it('Initialise correctement le pool de connexion', async () => {
        const mysql = await import('mysql2/promise');
        const { default: db } = await import('../Database/ConnectToDatabase.js');

        // Vérifie que MySQL Pool est instancié avec les variables d'environnement
        expect(mysql.default.createPool).toHaveBeenCalledWith(
            expect.objectContaining({
                host: 'localhost',
                user: 'test',
                database: 'db'
            })
        );
        expect(db).toBeDefined();
    });
});