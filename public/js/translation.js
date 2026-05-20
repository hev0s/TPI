// public/js/translations.js

const translations = {
    fr: {
        // --- index.html ---
        login_title: "Se connecter",
        signup_title: "Créer un compte",
        username_placeholder: "Nom d'utilisateur",
        password_placeholder: "Mot de passe",
        login_btn: "Connexion",
        signup_btn: "S'inscrire",
        no_account: "Pas de compte ?",
        has_account: "Déjà un compte ?",

        // --- home.html ---
        search_route: "Rechercher l'itinéraire",
        logout: "Déconnexion",
        start_nav: "🚀 Démarrer la navigation",
        stop_nav: "🛑 Quitter la navigation",
        add_stop: "+ Ajouter une étape",
        my_location: "📍 Votre position (Laissez vide)",
        destination: "🏁 Destination",

        // --- settings.html ---
        settings_title: "⚙️ Paramètres du compte",
        profile_title: "Mon Profil",
        new_username: "Nouveau nom d'utilisateur",
        update_pseudo: "Mettre à jour le pseudo",
        fav_title: "⭐ Mes Lieux Favoris",
        add_fav: "Ajouter un favori",
        fav_name: "Nom (ex: Maison, Travail)",
        fav_address: "Adresse complète",
        btn_add: "Ajouter",
        danger_zone: "Zone de danger",
        delete_account: "🗑️ Supprimer mon compte définitivement",
        back_map: "⬅ Retour à la carte"
    },
    en: {
        login_title: "Sign In",
        signup_title: "Create Account",
        username_placeholder: "Username",
        password_placeholder: "Password",
        login_btn: "Login",
        signup_btn: "Sign Up",
        no_account: "No account?",
        has_account: "Already have an account?",

        search_route: "Find Route",
        logout: "Logout",
        start_nav: "🚀 Start Navigation",
        stop_nav: "🛑 Stop Navigation",
        add_stop: "+ Add a stop",
        my_location: "📍 Your location (Leave empty)",
        destination: "🏁 Destination",

        settings_title: "⚙️ Account Settings",
        profile_title: "My Profile",
        new_username: "New username",
        update_pseudo: "Update username",
        fav_title: "⭐ My Favorite Places",
        add_fav: "Add a favorite",
        fav_name: "Name (e.g., Home, Work)",
        fav_address: "Full address",
        btn_add: "Add",
        danger_zone: "Danger Zone",
        delete_account: "🗑️ Delete my account permanently",
        back_map: "⬅ Back to Map"
    },
    de: {
        login_title: "Anmelden",
        signup_title: "Konto erstellen",
        username_placeholder: "Benutzername",
        password_placeholder: "Passwort",
        login_btn: "Einloggen",
        signup_btn: "Registrieren",
        no_account: "Kein Konto?",
        has_account: "Bereits ein Konto?",

        search_route: "Route suchen",
        logout: "Abmelden",
        start_nav: "🚀 Navigation starten",
        stop_nav: "🛑 Navigation beenden",
        add_stop: "+ Stopp hinzufügen",
        my_location: "📍 Ihr Standort (Leer lassen)",
        destination: "🏁 Ziel",

        settings_title: "⚙️ Kontoeinstellungen",
        profile_title: "Mein Profil",
        new_username: "Neuer Benutzername",
        update_pseudo: "Benutzernamen aktualisieren",
        fav_title: "⭐ Meine Lieblingsorte",
        add_fav: "Favorit hinzufügen",
        fav_name: "Name (z.B. Zuhause, Arbeit)",
        fav_address: "Vollständige Adresse",
        btn_add: "Hinzufügen",
        danger_zone: "Gefahrenzone",
        delete_account: "🗑️ Mein Konto dauerhaft löschen",
        back_map: "⬅ Zurück zur Karte"
    },
    it: {
        // --- index.html ---
        login_title: "Se connecter",
        signup_title: "Créer un compte",
        username_placeholder: "Nom d'utilisateur",
        password_placeholder: "Mot de passe",
        login_btn: "Connexion",
        signup_btn: "S'inscrire",
        no_account: "Pas de compte ?",
        has_account: "Déjà un compte ?",

        // --- home.html ---
        search_route: "Rechercher l'itinéraire",
        logout: "Déconnexion",
        start_nav: "🚀 Démarrer la navigation",
        stop_nav: "🛑 Quitter la navigation",
        add_stop: "+ Ajouter une étape",
        my_location: "📍 Votre position (Laissez vide)",
        destination: "🏁 Destination",

        // --- settings.html ---
        settings_title: "⚙️ Paramètres du compte",
        profile_title: "Mon Profil",
        new_username: "Nouveau nom d'utilisateur",
        update_pseudo: "Mettre à jour le pseudo",
        fav_title: "⭐ Mes Lieux Favoris",
        add_fav: "Ajouter un favori",
        fav_name: "Nom (ex: Maison, Travail)",
        fav_address: "Adresse complète",
        btn_add: "Ajouter",
        danger_zone: "Zone de danger",
        delete_account: "🗑️ Supprimer mon compte définitivement",
        back_map: "⬅ Retour à la carte"
    },
};

// Fonction pour changer la langue en temps réel
function setLanguage(lang) {
    if (!translations[lang]) lang = 'fr'; // Français par défaut
    localStorage.setItem('appLang', lang);

    // Mettre à jour les textes normaux (innerHTML pour garder les balises si besoin)
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) {
            el.innerHTML = translations[lang][key];
        }
    });

    // Mettre à jour les placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[lang][key]) {
            el.placeholder = translations[lang][key];
        }
    });

    // Synchroniser tous les sélecteurs de langue présents sur la page
    document.querySelectorAll('.lang-selector').forEach(sel => {
        sel.value = lang;
    });
}

// Fonction utilitaire pour traduire des textes générés en JavaScript (ex: les alertes)
function t(key) {
    const lang = localStorage.getItem('appLang') || 'fr';
    return translations[lang][key] || key;
}

// Appliquer la langue au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('appLang') || 'fr';
    setLanguage(savedLang);
});