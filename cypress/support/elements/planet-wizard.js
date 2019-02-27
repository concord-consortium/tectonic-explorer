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

  getAllPlanetDensityOptions () {
    return cy.get('.densities').find('li')
  }

  getPlanetDensityOptions (num) {
    switch (num) {
      case ('1'):
        return cy.get('.densities').find('li').eq(0)
      case ('2'):
        return cy.get('.densities').find('li').eq(1)
      case ('3'):
        return cy.get('.densities').find('li').eq(2)
      case ('4'):
        return cy.get('.densities').find('li').eq(3)
      case ('5UD'):
        return cy.get('.densities').find('li').eq(4)
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
