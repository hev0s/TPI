describe('Interface Administrateur', () => {
    it('Doit rediriger vers l\'accueil si l\'utilisateur n\'est pas admin', () => {
        cy.window().then((win) => {
            win.localStorage.setItem('token', 'fake-user-token');
            win.localStorage.setItem('role', 'user');
        });

        const stub = cy.stub();
        cy.on('window:alert', stub);

        cy.intercept('GET', '**/api/admin/verify', { statusCode: 403, body: { error: 'Accès refusé' } }).as('verifyAdminFail');

        cy.visit('/admin.html');
        cy.wait('@verifyAdminFail');

        cy.location('pathname').should('include', 'index.html');
    });

    it('Doit afficher l\'interface si l\'utilisateur a les droits admin', () => {
        cy.window().then((win) => {
            win.localStorage.setItem('token', 'fake-admin-token');
            win.localStorage.setItem('role', 'admin');
        });

        cy.intercept('GET', '**/api/admin/verify', { statusCode: 200, body: { valid: true } }).as('verifyAdmin');
        cy.intercept('GET', '**/api/vehicules/all', { statusCode: 200, body: [] }).as('getCars');

        cy.visit('/admin.html');
        cy.wait('@verifyAdmin');

        cy.get('h2').contains('Panneau Admin');
        cy.get('#car-brand').should('be.visible');
        cy.get('#car-model').should('be.visible');
    });

    it('Doit créer un véhicule via l\'interface d\'administration', () => {
        cy.window().then((win) => {
            win.localStorage.setItem('token', 'fake-admin-token');
            win.localStorage.setItem('role', 'admin');
        });

        cy.intercept('GET', '**/api/admin/verify', { statusCode: 200, body: { valid: true } });
        cy.intercept('GET', '**/api/vehicules/all', { statusCode: 200, body: [] });
        cy.intercept('POST', '**/api/admin/vehicules', { statusCode: 201, body: { success: true } }).as('createCar');

        cy.visit('/admin.html');

        cy.get('#car-brand').type('Porsche');
        cy.get('#car-model').type('Taycan');
        cy.get('#car-battery').type('93');
        cy.get('#car-conso').type('21');
        cy.get('#car-cx').type('0.22');

        cy.contains('Enregistrer').click();

        cy.wait('@createCar');
        cy.get('#admin-msg').should('have.css', 'color', 'rgb(0, 128, 0)').and('contain.text', 'succès');
    });
});