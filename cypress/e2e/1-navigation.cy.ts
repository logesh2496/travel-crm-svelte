describe('Navigation', () => {
  beforeEach(() => {
    cy.login();
  });

  const pages = [
    { name: 'Dashboard', id: 'dashboard' },
    { name: 'Lead Management', id: 'leads' },
    { name: 'Itinerary Builder', id: 'itineraries' },
    { name: 'Booking Management', id: 'bookings' },
    { name: 'Follow-Ups', id: 'followups' },
    { name: 'Invoice Management', id: 'invoices' },
    { name: 'Payment Management', id: 'payments' },
    { name: 'Supplier Payments', id: 'supplier-payments' },
    { name: 'B2B / B2C Management', id: 'b2b' },
    { name: 'Supplier Management', id: 'suppliers' },
    { name: 'Master Management', id: 'masters' },
    { name: 'Client Communication', id: 'communication' },
    { name: 'Reports & Analytics', id: 'reports' },
    { name: 'Daily Duty Sheet', id: 'duty-sheet' },
    { name: 'User & Role Management', id: 'users' },
    { name: 'Settings', id: 'settings' }
  ];

  pages.forEach(page => {
    it(`should navigate to ${page.name}`, () => {
      // Click the navigation item
      cy.get('.sidebar').contains(page.name).click();
      
      // Wait for the URL to update (except for dashboard which is /)
      if (page.id === 'dashboard') {
        cy.url().should('eq', Cypress.config().baseUrl + '/');
      } else {
        cy.url().should('include', `/${page.id}`);
      }

      // Assert that the page container doesn't show errors
      cy.get('.main').should('be.visible');
    });
  });
});
