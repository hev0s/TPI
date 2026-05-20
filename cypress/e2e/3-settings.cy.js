describe('Interface des Paramètres', () => {
    beforeEach(() => {
        cy.window().then((win) => {
            win.localStorage.setItem('token', 'fake-jwt-token');
            win.localStorage.setItem('role', 'user');
        });

        cy.intercept('GET', '**/api/verify', { statusCode: 200, body: { valid: true } }).as('verifyUser');
        cy.intercept('GET', '**/api/vehicules', { statusCode: 200, body: [] }).as('getCars');
        cy.intercept('GET', '**/api/navigation/favorites', { statusCode: 200, body: [] }).as('getFavs');

        cy.visit('/settings.html');
        cy.wait('@verifyUser');
    });

    it('Doit afficher toutes les sections du profil', () => {
        cy.get('h2').contains('Paramètres du compte');
        cy.get('h3').contains('Mon Profil');
        cy.get('h3').contains('Mes Lieux Favoris');
        cy.get('h3').contains('Mes Véhicules');
    });

    it('Doit modifier le pseudo avec succès', () => {
        cy.intercept('PUT', '**/api/user/username', { statusCode: 200, body: { success: true } }).as('updatePseudo');

        cy.get('#new-username').type('NouveauPseudo');
        cy.contains('Mettre à jour le pseudo').click();

        cy.wait('@updatePseudo');
        cy.get('#msg-profile').should('have.css', 'color', 'rgb(0, 128, 0)').and('contain.text', 'mis à jour');
    });

    it('Doit afficher une erreur si on ajoute un favori vide', () => {
        cy.get('#btn-save-fav').click({force: true});
        cy.get('#msg-fav').should('be.visible').and('contain.text', 'Remplissez');
    });

    it('Doit ajouter un favori avec succès', () => {
        cy.intercept('POST', '**/api/navigation/geocode', { statusCode: 200, body: { lat: 46.7, lon: 6.6 } }).as('geo');
        cy.intercept('POST', '**/api/navigation/favorites', { statusCode: 201, body: { success: true } }).as('saveFav');

        cy.get('#fav-label').type('Ma Maison');
        cy.get('#fav-address').type('Rue de la Gare, Yverdon');
        cy.get('#btn-save-fav').click({force: true});

        cy.wait('@geo');
        cy.wait('@saveFav');
        cy.get('#fav-label').should('have.value', ''); // Formulaire vidé après succès
    });

    it('Doit gérer l\'interface de modification de véhicule (Afficher et Annuler)', () => {
        cy.window().then((win) => {
            win.startCarEdit(1, 'Tesla Model 3', 95, 'winter');
        });

        cy.get('#form-car-title').should('contain.text', 'Modifier le véhicule');
        cy.get('#car-search').should('have.value', 'Tesla Model 3');
        cy.get('#car-battery').should('have.value', '95');
        cy.get('#tire-select').should('have.value', 'winter');
        cy.get('#btn-cancel-car').should('be.visible');

        cy.get('#btn-cancel-car').click({force: true});

        cy.get('#form-car-title').should('contain.text', 'Ajouter un véhicule');
        cy.get('#btn-cancel-car').should('not.be.visible');
    });
});