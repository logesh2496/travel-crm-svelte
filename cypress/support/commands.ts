/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    login(): Chainable<void>;
  }
}

Cypress.Commands.add('login', () => {
  const email = Cypress.env('testUserEmail');
  const password = Cypress.env('testUserPassword');

  cy.visit('/');
  
  // Wait for login form to be visible
  cy.get('form.lform').should('be.visible');

  // Fill in credentials
  cy.get('#lEmail').type(email);
  cy.get('#lPass').type(password);

  // Submit
  cy.get('.btn-login').click();

  // Wait for login to complete (sidebar should be visible)
  cy.get('.sidebar', { timeout: 10000 }).should('be.visible');
});
