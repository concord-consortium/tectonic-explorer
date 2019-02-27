class SideMenu {
  getEarthquakes () {
    return cy.contains('.list-item', 'Earthquakes')
  }

  getVolcanicEruptions () {
    return cy.contains('.list-item', 'Volcanic eruptions')
  }
}

export default SideMenu
