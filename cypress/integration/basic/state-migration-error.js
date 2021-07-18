describe("State migrations", function() {
  beforeEach(() => {
    // This model was saved in TE v1.x
    cy.visit("/?modelId=81cd56f3-9ba5-4d44-b207-167fd729b216");
    cy.waitForSplashscreen();
  });

  it("detects incompatible state and shows an error message", function() {
    cy.get(".error-message").should("be.visible");
    cy.contains("It is impossible to load a state saved by Tectonic Explorer V1.x");
  });
});
