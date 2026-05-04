import db from './ConnectToDatabase.js'

export async function createUser(username, password) {
    try {
        const [result] = await db.query(
            'INSERT INTO user (username, password) VALUES (?,?)',
            [username, password],
        );
        return result.insertId;
    } catch (err) {
        console.error('Insert error:', err.message);
        throw err;
    }
}

export async function getUserByUsername(username) {
    try {
        const [rows] = await db.query(
            'SELECT * FROM user WHERE username = ?',
            [username]
        );
        return rows[0];
    } catch (err) {
        console.error('Select error:', err.message);
        throw err;
    }
}

export async function deleteUser(userId) {
    try {
        await db.query('DELETE FROM user WHERE id = ?', [userId]);
    } catch (err) {
        console.error('Delete error:', err.message);
    }
}

export async function updateUsername(userId, newUsername) {
    try {
        await db.query('UPDATE user SET username = ? WHERE id = ?', [newUsername, userId]);
    } catch (err) {
        console.error('Erreur lors de la modification du pseudo:', err.message);
        throw err;
    }
}

export async function setFavoritePlace(userId, placeName, address, latitude, longitude) {
    try {
        const [result] = await db.query(
            'INSERT INTO saved_locations (user_id, label, address, latitude, longitude) VALUES (?,?,?,?,?)',
            [userId, placeName, address, latitude, longitude]
        );
        return result.insertId;
    } catch (err) {
        console.error('Insert error:', err.message);
        throw err;
    }
}

export async function getFavoritePlaces(userId) {
    try {
        const [rows] = await db.query(
            'SELECT id, label, address, latitude, longitude FROM saved_locations WHERE user_id = ?',
            [userId]
        );
        return rows;
    } catch (err) {
        console.error('Select error:', err.message);
        throw err;
    }
}

export async function deleteFavoritePlace(userId, placeId) {
    try {
        await db.query('DELETE FROM saved_locations WHERE user_id = ? AND id = ?', [userId, placeId]);
    } catch (err) {
        console.error('Delete error:', err.message);
    }
}

export async function updateFavoritePlace(userId, placeId, placeName, address, latitude, longitude) {
    try {
        await db.query(
            'UPDATE saved_locations SET label = ?, address = ?, latitude = ?, longitude = ? WHERE user_id = ? AND id = ?',
            [placeName, address, latitude, longitude, userId, placeId]
        );
    } catch (err) {
        console.error('Update favorite error:', err.message);
        throw err;
    }
}

export async function searchVehicles(query) {
    try {
        // Recherche dans la marque ou le modèle
        const [rows] = await db.query(
            'SELECT id, brand, model FROM vehicule WHERE brand LIKE ? OR model LIKE ? LIMIT 10',
            [`%${query}%`, `%${query}%`]
        );
        return rows;
    } catch (err) {
        console.error('Erreur lors de la recherche de véhicules:', err.message);
        throw err;
    }
}

export async function setUserHasVehicule(userId, vehiculeId, battery_health, tyre) {
    try {
        // Utilisation de ON DUPLICATE KEY pour mettre à jour si l'utilisateur change de voiture
        await db.query(
            'INSERT INTO user_has_vehicule (user_id, vehicule_id, battery_health, tyre) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE vehicule_id = ?, battery_health = ?, tyre = ?',
            [userId, vehiculeId, battery_health, tyre, vehiculeId, battery_health, tyre]
        );
    } catch (err) {
        console.error('Erreur insertion véhicule utilisateur:', err.message);
        throw err;
    }
}

export async function updateUserHasVehicule(userId, vehiculeId, carId, battery_health, tyre) {
    try {
        await db.query('UPDATE user_has_vehicule SET vehiculeId=?, battery_health = ?,  tyre=? WHERE user_id = ? AND vehicule_id = ?', [carId, battery_health, tyre, userId, vehiculeId]);
    } catch (err) {
        console.error('Update error:', err.message);
    }
}

export async function deleteUserHasVehicule(userId, vehiculeId) {
    try {
        await db.query('DELETE FROM user_has_vehicule WHERE user_id = ? AND vehicule_id = ?', [userId, vehiculeId]);
    } catch (err) {
        console.error('Delete error:', err.message);
    }
}

export async function getUserVehicule(userId) {
    try {
        const [rows] = await db.query(
            `SELECT v.id, v.brand, v.model, uhv.battery_health, uhv.tyre 
             FROM user_has_vehicule uhv 
             JOIN vehicule v ON uhv.vehicule_id = v.id 
             WHERE uhv.user_id = ?`,
            [userId]
        );
        return rows;
    } catch (err) {
        console.error('Select error:', err.message);
        throw err;
    }
}

export async function getUserVehicleData(userId, vehiculeId = null) {
    try {
        let query = `
            SELECT v.brand, v.model, v.battery_capacity, v.base_consumption, uhv.battery_health, uhv.tyre, v,air_drag
            FROM user_has_vehicule uhv 
            JOIN vehicule v ON uhv.vehicule_id = v.id 
            WHERE uhv.user_id = ?
        `;
        let params = [userId];
        if (vehiculeId) {
            query += ` AND uhv.vehicule_id = ?`;
            params.push(vehiculeId);
        }
        query += ` LIMIT 1`; //Limite à 1 véhicule
        const [rows] = await db.query(query, params);
        return rows[0];
    } catch (err) {
        console.error('Erreur lors de la récupération du véhicule:', err.message);
        throw err;
    }
}

export async function getUserLanguage(userId) {
    try {
        const [rows] = await db.query(
            'SELECT language FROM user WHERE id = ?',
            [userId]
        );
        return rows[0].language;
    } catch (err) {
        console.error('Select error:', err.message);
        throw err;
    }
}

export async function updateUserLanguage(userId, language) {
    try {
        await db.query('UPDATE user SET language = ? WHERE id = ?', [language, userId]);
    } catch (err) {
        console.error('Erreur lors de la modification du pseudo:', err.message);
    }
}