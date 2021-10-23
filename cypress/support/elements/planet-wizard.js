class PlanetWizard {
  static getAllPlateNumOptions() {
    return cy.get("[data-test=plate-num-options]");
  }

  static getPlateNumOption(num) {
    switch (num) {
    case ("2"):
      return cy.get("[data-test=plate-num-options] > :nth-child(1)");
    case ("3"):
      return cy.get("[data-test=plate-num-options] > :nth-child(2)");
    case ("4"):
      return cy.get("[data-test=plate-num-options] > :nth-child(3)");
    case ("5"):
      return cy.get("[data-test=plate-num-options] > :nth-child(4)");
    case ("5UD"):
      return cy.get("[data-test=plate-num-options] > :nth-child(5)");
    }
  }

  static getAllPlanetDensityOptions() {
    return cy.get(".densities").find("li");
  }

  static getPlanetDensityOptions(num) {
    switch (num) {
    case ("1"):
      return cy.get(".densities").find("li").eq(0);
    case ("2"):
      return cy.get(".densities").find("li").eq(1);
    case ("3"):
      return cy.get(".densities").find("li").eq(2);
    case ("4"):
      return cy.get(".densities").find("li").eq(3);
    case ("5UD"):
      return cy.get(".densities").find("li").eq(4);
    }
  }

  static getColorKey() {
    return cy.get("[data-test=color-key]");
  }

  static toggleColorKey() {
    return cy.get("[data-test=key-toggle-button]").click();
  }

  static getTimeDisplay() {
    return cy.get("[data-test=time-display]");
  }
}
export default PlanetWizard;
