// public/js/auth.js

// URL de l'API (Configuré pour la production via Swisscenter / Render)
const API_URL = "https://tpi-5ter.onrender.com";

/**
 * Vérifie si l'utilisateur est authentifié et gère l'affichage ou la redirection.
 * @param {boolean} requireAdmin - Mettre à true si la page nécessite les droits administrateur
 * @returns {boolean} - Retourne true si l'accès est autorisé
 */

async function verifyAuth(requireAdmin = false) {
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.replace('index.html');
        return false;
    }

    const endpoint = requireAdmin ? '/api/admin/verify' : '/api/verify';

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const mainBody = document.getElementById('main-body');
            if(mainBody) mainBody.style.display = 'block';
            return true;
        } else {
            if (requireAdmin) {
                alert("Accès refusé. Vous n'êtes pas administrateur.");
                window.location.replace('home.html');
            } else {
                localStorage.removeItem('token');
                localStorage.removeItem('role');
                window.location.replace('index.html');
            }
            return false;
        }
    } catch (error) {
        console.error("Erreur de connexion au serveur", error);
        window.location.replace('index.html');
        return false;
    }
}
// Déconnexion et retour a la page de connexion

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.replace('index.html');
}