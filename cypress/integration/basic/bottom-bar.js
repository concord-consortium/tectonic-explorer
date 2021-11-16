describe("Bottom Bar", function() {
  beforeEach(() => {
    cy.visit("/?preset=subduction");
    cy.waitForSplashscreen();
  });

  it("Resizes the logo", function() {
    cy.get(".cc-logo-large").should("be.visible");
    cy.get(".cc-logo-small").should("not.be.visible");

    cy.viewport(800, 660);
    cy.get(".cc-logo-large").should("not.be.visible");
    cy.get(".cc-logo-small").should("be.visible");
  });
});
