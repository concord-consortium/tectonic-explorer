class SideMenu {
  static getEarthquakes() {
    return cy.contains(".sidebar-menu--listItem--tectonic-explorer", "Earthquakes");
  }

  static getVolcanicEruptions() {
    return cy.contains(".sidebar-menu--listItem--tectonic-explorer", "Volcanic Eruptions");
  }

  static getShowHidePlate(plateNum) {
    return cy.contains(".sidebar-menu--listItem--tectonic-explorer", "Plate " + plateNum);
  }
}

export default SideMenu;
