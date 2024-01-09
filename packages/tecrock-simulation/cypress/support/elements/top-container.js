class TopContainer {
  static getRefresh() {
    return cy.get("[data-test=top-bar-refresh]");
  }

  static getShare() {
    return cy.get("[data-test=top-bar-share]");
  }

  static getAbout() {
    return cy.get("[data-test=top-bar-about]");
  }

  static getRotatePlanet() {
    return cy.get("[data-test=rotate-camera]");
    // return cy.get('.interaction-selector > .large-button > .label').contains('Rotate Planet');
  }

  static getResetPlanetOrientation() {
    return cy.get(".planet-view > .camera-reset");
  }

  static getInteractionSelector(option) {
    return cy.contains(option);
  }

  static getDrawForceVectors() {
  return cy.get("[data-test=draw-force-vectors]");
  }

  static waitForDialog() {
    cy.contains("#draggable-dialog-title", "Model Stopped", { timeout: 120000 });
    cy.wait(500);
  }

  static getContinueAnywayButton() {
    return cy.get(".MuiDialog-paper button").contains("Continue anyway");
  }

  static getStopDialogTitle() {
    cy.get("#draggable-dialog-title").contains("Model Stopped");
  }

  static getStopDialogContent() {
    cy.get(".MuiDialog-paper .relative-motion-stopped-dialog--relativeMotionStoppedDialogContent--tectonic-explorer")
    .should("contain", " All tectonic plate interactions have reached their endpoint.")
    .should("contain", "No more plate movement is possible.")
    .should("contain", "Use the buttons in the toolbar to continue to explore this model or ")
    .should("contain", "Reset Plates")
    .should("contain", " to design a new model.");
  }
}

export default TopContainer;
