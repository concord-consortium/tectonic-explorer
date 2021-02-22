class BottomContainer {
  static getSmallLogo () {
    return cy.get("[data-test=cc-logo-small]");
  }

  static getBigLogo () {
    return cy.get("[data-test=cc-logo-large]");
  }

  static getStep (num) {
    switch (num) {
      case ("1"):
        return cy.get(".step").eq(0);
      case ("2"):
        return cy.get(".step").eq(1);
      case ("3"):
        return cy.get(".step").eq(2);
      case ("4"):
        return cy.get(".step").eq(3);
    }
  }

  static getBackButton () {
    return cy.get(".planet-wizard-bottom-panel").find("button").eq(0);
  }

  static getNextButton () {
    return cy.get(".planet-wizard-bottom-panel").find("button").eq(1);
  }

  static getFinishButton () {
    return cy.get(".planet-wizard-bottom-panel").find("button");
  }

  static getReload () {
    return cy.get("[data-test=reload-button]");
  }

  static getRestart () {
    return cy.get("[data-test=restart-button]");
  }

  static getStepBack () {
    return cy.get("[data-test=stepback-button]");
  }

  static getStepForward () {
    return cy.get("[data-test=step-forward-button]");
  }

  static getStartPause () {
    return cy.get("[data-test=playPause-button]");
  }

  static getMenu () {
    return cy.get("[data-test=large-menu-button]");
  }

  static getfullScreenToggle () {
    return cy.get("[data-test=fullscreen-button]");
  }
  static waitForPause () {
    // Let model run for max 120s.
    cy.contains("[data-test=playPause-button]", "Start", { timeout: 120000 });
    cy.wait(500);
  }
}

export default BottomContainer;
