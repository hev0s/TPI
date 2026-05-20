DROP DATABASE IF EXISTS tpi26_nde_tpi;
CREATE DATABASE IF NOT EXISTS tpi26_nde_tpi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE tpi26_nde_tpi;

-- ==========================================
-- CRÉATION DES TABLES
-- ==========================================

CREATE TABLE user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    -- lang VARCHAR(2),
    role ENUM('user', 'admin') DEFAULT 'user' NOT NULL
);

CREATE TABLE saved_locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    label VARCHAR(50) NOT NULL,
    address VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE TABLE vehicule (
    id INT AUTO_INCREMENT PRIMARY KEY,
    brand VARCHAR(50),
    model VARCHAR(50),
    battery_capacity DECIMAL(6,2),
    weight INT,
    air_drag DECIMAL(2,2),
    -- image VARCHAR(255),
    base_consumption DECIMAL(5,2)
);

CREATE TABLE user_has_vehicule (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    vehicule_id INT NOT NULL,
    battery_health INT,
    tyre ENUM('winter', 'summer', 'all season'),
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicule_id) REFERENCES vehicule(id) ON DELETE CASCADE
);

-- OPTIMISATIONS

-- 1. Index pour l'autocomplétion des véhicules
-- Explication : Lors d'une recherche (ex: barre de recherche), les utilisateurs tapent souvent la marque puis le modèle (ex: "Renault Megane"). 
-- Cet index composite de gauche à droite optimise les clauses WHERE utilisant "brand LIKE 'x%'" ou "brand = 'x' AND model LIKE 'y%'".
CREATE INDEX idx_vehicule_brand_model ON vehicule (brand, model);

-- 2. Index pour la recherche des favoris
-- Explication : Les requêtes chercheront systématiquement les favoris d'un utilisateur spécifique (WHERE user_id = X). 
-- L'ajout de 'label' dans un index composite permet d'accélérer une recherche textuelle d'un favori précis pour cet utilisateur, 
-- évitant un parcours séquentiel (table scan) sur toutes ses adresses.
CREATE INDEX idx_saved_locations_user_label ON saved_locations (user_id, label);

-- 3. Index pour la jointure des véhicules de l'utilisateur
-- Explication : Bien qu'InnoDB crée automatiquement des index sur les clés étrangères, 
-- la création d'un index composite (user_id, vehicule_id) sur la table de liaison agit comme un "Covering Index". 
-- Si une requête vérifie uniquement la possession (SELECT vehicule_id FROM user_has_vehicule WHERE user_id = X), 
-- MySQL n'aura même pas besoin de lire les données de la table, l'index seul suffira pour répondre.
CREATE INDEX idx_user_vehicule_join ON user_has_vehicule (user_id, vehicule_id);