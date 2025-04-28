describe('My First E2E Test', () => {
    it('Should visit the homepage and check the title', () => {
      cy.visit('http://localhost:5000'); // Replace with your app's URL
      cy.title().should('include', 'Delivery App'); // Validate the page title
    });
  });