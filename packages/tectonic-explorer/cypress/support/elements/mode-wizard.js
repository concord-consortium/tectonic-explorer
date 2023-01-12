class ModeWizard {
  static getGeodeButton() {
    return cy.get("[data-test=Geode-button]");
  }

  static getTecRocksButton() {
    return cy.get("[data-test=TecRocks-button]");
  }
}
export default ModeWizard;
