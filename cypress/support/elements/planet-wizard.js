class PlanetWizard {
  getAllPlateNumOptions () {
    return cy.get('[data-test=plate-num-options]')
  }

  getPlateNumOption (num) {
    switch (num) {
      case ('2'):
        return cy.get('[data-test=plate-num-options] > :nth-child(1)')
      case ('3'):
        return cy.get('[data-test=plate-num-options] > :nth-child(2)')
      case ('4'):
        return cy.get('[data-test=plate-num-options] > :nth-child(3)')
      case ('5'):
        return cy.get('[data-test=plate-num-options] > :nth-child(4)')
      case ('5UD'):
        return cy.get('[data-test=plate-num-options] > :nth-child(5)')
    }
  }

  getPlanetDensityOptions (num) {
    switch (num) {
      case ('1'):
        return cy.get('')
      case ('2'):
        return cy.get('')
      case ('3'):
        return cy.get('')
      case ('4'):
        return cy.get('')
      case ('5'):
        return cy.get('')
    }
  }

  getColorKey () {
    return cy.get('[data-test=color-key]')
  }

  getTimeDisplay () {
    return cy.get('[data-test=time-display]')
  }
}
export default PlanetWizard
