describe('Core Flow: Lead -> Booking', () => {
  beforeEach(() => {
    cy.login();
  });

  it('should complete the full lead to booking lifecycle', () => {
    // 1. Create Lead
    cy.get('.sidebar').contains('Lead Management').click();
    cy.contains('button', 'New Lead').click();
    
    cy.get('#addQueryModal').should('be.visible');
    
    // Fill lead details
    const uniqueId = Math.floor(Math.random() * 10000);
    const leadName = `Test Lead ${uniqueId}`;
    
    cy.get('#qName').type(leadName);
    cy.get('#qPhone').type('9999999999');
    cy.get('#qDest').type('Maldives');
    cy.get('#qDate').type('2026-12-01');
    cy.get('#qBudget').type('150000');
    
    // Save
    cy.contains('button', 'Save Lead').click();
    
    // Verify lead is in the table
    cy.get('table').contains(leadName).should('be.visible');
    
    // 2. Change Status to Confirmed
    // Assuming we can click the row or a specific edit button
    // The leads table might have a status dropdown directly, or we click the row to edit.
    // We'll search for the row containing our lead name, then find the status select.
    cy.contains('tr', leadName).find('select.status-badge').select('Confirmed');
    cy.get('#toast').should('contain.text', 'Lead updated');
    cy.get('#toast').should('contain.text', 'Booking auto-created');

    // 3. Build Itinerary & Cost
    cy.get('.sidebar').contains('Itinerary Builder').click();
    cy.get('select').select(leadName);
    
    // Verify auto-fill
    cy.get('input[placeholder*="Dest"]').should('have.value', 'Maldives');
    
    // Fill costing (optional, but requested in flow)
    cy.contains('Costing Engine').scrollIntoView();
    cy.contains('label', 'Flight Cost').next('input').type('50000');
    cy.contains('label', 'Hotel Cost').next('input').type('60000');
    cy.contains('button', 'Calculate Totals').click();
    
    cy.contains('button', 'Save').click();
    cy.get('#toast').should('contain.text', 'saved successfully');

    // 4. Verify Booking
    cy.get('.sidebar').contains('Booking Management').click();
    cy.get('table').contains(leadName).should('be.visible');
  });
});
