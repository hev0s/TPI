describe('Interface d\'Authentification', () => {
    beforeEach(() => {
        cy.visit('/');
    });

    it('Doit afficher une erreur visuelle si les identifiants sont faux', () => {
        cy.get('#login-username').type('FauxUtilisateur123');
        cy.get('#login-password').type('FauxMotDePasse');
        cy.get('#login-form button[type="submit"]').click();

        cy.get('#message', { timeout: 5000 })
            .should('be.visible')
            .and('have.css', 'color', 'rgb(234, 67, 53)')
            .and('contain.text', 'Identifiants incorrects');
    });

    it('Doit basculer entre le formulaire de connexion et d\'inscription', () => {
        cy.get('#login-section').should('not.have.class', 'hidden');
        cy.get('#signup-section').should('have.class', 'hidden');

        cy.contains('S\'inscrire').click();

        cy.get('#login-section').should('have.class', 'hidden');
        cy.get('#signup-section').should('not.have.class', 'hidden');
        cy.get('h2').contains('Créer un compte');
    });

    it('Doit connecter l\'utilisateur avec succès et rediriger vers Home', () => {
        // Interception du login pour valider la connexion
        cy.intercept('POST', '**/api/login', {
            statusCode: 200,
            body: { success: true, token: 'fake-token', role: 'user' }
        }).as('loginRequest');

        // Interception de la sécurité de home.html pour qu'elle accepte notre faux token
        cy.intercept('GET', '**/api/verify', {
            statusCode: 200,
            body: { valid: true }
        });

        // On empêche les erreurs de chargement sur la page Home
        cy.intercept('GET', '**/api/vehicules*', {
            statusCode: 200,
            body: []
        });

        cy.get('#login-username').type('Niels');
        cy.get('#login-password').type('MonSuperMotDePasse');
        cy.get('#login-form button[type="submit"]').click();

        cy.wait('@loginRequest');

        cy.location('pathname', { timeout: 10000 }).should('include', 'home.html');

        // Vérification que le token a bien été stocké dans le navigateur
        cy.window().then((win) => {
            expect(win.localStorage.getItem('token')).to.eq('fake-token');
        });
    });
});