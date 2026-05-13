import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

import path from 'path'; // A mettre en commentaire si hébergé
import { fileURLToPath } from 'url'; // A mettre en commentaire si hébergé

const __filename = fileURLToPath(import.meta.url); // A mettre en commentaire si hébergé
const __dirname = path.dirname(__filename); // A mettre en commentaire si hébergé

// dotenv.config({ path: path.resolve(__dirname, '../.env') }); // A mettre en commentaire si hébergé

// dotenv.config(); //Mis en commentaire pour tourner en localhost

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
});


db.getConnection()
    .then(connection => {
        console.log('Connecté à la base distante Swisscenter !');
        connection.release();
    })
    .catch(err => {
        console.error('Erreur critique de connexion base de données : ' + err.message);
    });

export default db;