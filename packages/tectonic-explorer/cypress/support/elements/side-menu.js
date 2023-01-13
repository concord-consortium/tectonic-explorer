class SideMenu {
  static getEarthquakes() {
    return cy.contains(".sidebar-menu--listItem--tectonic-explorer", "Earthquakes");
  }

  static getVolcanicEruptions() {
    return cy.contains(".sidebar-menu--listItem--tectonic-explorer", "Volcanic Eruptions");
  }

  static getShowHidePlate(plateNum) {
    // return cy.contains(".sidebar-menu--listItem--tectonic-explorer", "Plate " + plateNum);
    return cy.get("[data-react-toolbox='list-item-text']").contains("Plate " + plateNum);
  }

  static getCrossSection() {
    return cy.get("[data-test=cross-section]");
  }

  static getCrossSectionClose() {
    return this.getCrossSection().find(".cross-section-button.close");
  }

  static getCrossSectionZoomIn() {
    return this.getCrossSection().find(".cross-section-button.zoom-in");
  }

  static getCrossSectionZoomOut() {
    return this.getCrossSection().find(".cross-section-button.zoom-out");
  }

  static getCrossSectionReset() {
    return this.getCrossSection().find(".cross-section-button.reset-view");
  }
}

export default SideMenu;
