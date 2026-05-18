describe('Interface de Navigation (Home)', () => {
    beforeEach(() => {
        cy.window().then((win) => {
            win.localStorage.setItem('token', 'fake-jwt-token');
            win.localStorage.setItem('role', 'user');
        });

        cy.intercept('GET', '**/api/verify', { statusCode: 200, body: { valid: true } }).as('verifyUser');
        cy.intercept('GET', '**/api/vehicules*', { statusCode: 200, body: [] }).as('getCars');

        cy.visit('/home.html');
        cy.wait('@verifyUser');
    });

    it('Doit charger la carte Leaflet et le panneau de contrôle', () => {
        cy.get('#map').should('be.visible').and('have.class', 'leaflet-container');
        cy.get('#controls').should('be.visible');
    });

    it('Doit ajouter et supprimer des champs d\'étapes (Waypoints)', () => {
        cy.get('.waypoint-row').should('have.length', 2);
        cy.get('#btn-add-stop').click();
        cy.get('.waypoint-row').should('have.length', 3);
        cy.get('.waypoint-input').eq(1).should('have.attr', 'placeholder').and('include', 'Étape supplémentaire');

        cy.get('.btn-del').first().click({force: true});
        cy.get('.waypoint-row').should('have.length', 2);
    });

    it('Doit afficher les options de route (Eco/Sport) et arrêts', () => {
        cy.get('#route-type-selector').select('eco').should('have.value', 'eco');
        cy.get('#route-type-selector').select('sport').should('have.value', 'sport');
        cy.get('#allow-stops-toggle').should('be.checked');
    });
});