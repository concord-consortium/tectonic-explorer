class SideMenu {
  getEarthquakes () {
    return cy.contains('.sidebar-menu--listItem--tectonic-explorer', 'Earthquakes')
  }

  getVolcanicEruptions () {
    return cy.contains('.sidebar-menu--listItem--tectonic-explorer', 'Volcanic eruptions')
  }
}

export default SideMenu
