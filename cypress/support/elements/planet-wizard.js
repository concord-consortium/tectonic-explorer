class PlanetWizard {
  getPlateNumOptions (num) {
    switch (num) {
      case ('2'):
        return cy.get('[data-test=interaction-selector]').eq(0)
      case ('3'):
        return cy.get('[data-test=interaction-selector]').eq(1)
      case ('4'):
        return cy.get('[data-test=interaction-selector]').eq(2)
      case ('5'):
        return cy.get('[data-test=interaction-selector]').eq(3)
      case ('5-UD'):
        return cy.get('[data-test=interaction-selector]').eq(4)
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
    cy.get('[data-test=color-key]')
  }
}
export default PlanetWizard
