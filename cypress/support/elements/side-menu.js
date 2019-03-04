class SideMenu {
  static getEarthquakes () {
    return cy.contains('.sidebar-menu--listItem--tectonic-explorer', 'Earthquakes')
  }

  static getVolcanicEruptions () {
    return cy.contains('.sidebar-menu--listItem--tectonic-explorer', 'Volcanic eruptions')
  }
}

export default SideMenu
