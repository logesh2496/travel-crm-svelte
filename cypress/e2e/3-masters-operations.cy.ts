describe('Masters and Operations', () => {
  beforeEach(() => {
    cy.login();
  });

  it('should verify Master Management pages and add new entry functionality', () => {
    cy.get('.sidebar').contains('Master Management').click();
    
    // Default is Destination
    cy.get('.master-card.active').should('contain.text', 'Destination');
    cy.contains('button', 'Add Destination').should('be.visible');

    // Test switching tabs to Hotel
    cy.get('.master-card').contains('Hotel').click();
    cy.get('.master-card.active').should('contain.text', 'Hotel');
    cy.contains('button', 'Add New').should('be.visible');

    // Test a generic MasterForm based tab like "Meal Plan"
    cy.get('.master-card').contains('Meal Plan').click();
    cy.get('.master-card.active').should('contain.text', 'Meal Plan');
    cy.contains('button', 'Add Meal Plan').should('be.visible');
    
    // Add a new Meal Plan entry
    cy.contains('button', 'Add Meal Plan').click();
    cy.get('input[placeholder="Name"]').type('All Inclusive Plus');
    cy.get('input[placeholder="Description"]').type('Includes all meals and premium drinks');
    cy.get('input[placeholder="Code"]').type('AIP');
    cy.contains('button', 'Save').click();

    // Verify saving (assuming a toast appears or it gets added to the table)
    cy.get('table').contains('All Inclusive Plus').should('be.visible');
  });

  it('should load B2B Management operations', () => {
    cy.get('.sidebar').contains('B2B / B2C Management').click();
    cy.contains('h2', 'B2B / B2C Management').should('be.visible');
    
    // Verify some tabs or buttons exist
    cy.contains('button', 'Add New Record').should('be.visible');
  });
});
