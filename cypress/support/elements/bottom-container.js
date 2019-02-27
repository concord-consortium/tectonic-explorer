class BottomContainer {
  getSmallLogo () {
    return cy.get('[data-test=cc-logo-small]')
  }

  getBigLogo () {
    return cy.get('[data-test=cc-logo-large]')
  }

  getStep (num) {
    switch (num) {
      case ('1'):
        return cy.get('.step').eq(0)
      case ('2'):
        return cy.get('.step').eq(1)
      case ('3'):
        return cy.get('.step').eq(2)
      case ('4'):
        return cy.get('.step').eq(3)
    }
  }

  getBackButton () {
    return cy.get('.planet-wizard-bottom-panel').find('button').eq(0)
  }

  getNextButton () {
    return cy.get('.planet-wizard-bottom-panel').find('button').eq(1)
  }

  getFinishButton () {
    return cy.get('.planet-wizard-bottom-panel').find('button')
  }

  getReload () {
    return cy.get('[data-test=reload-button]')
  }

  getRestart () {
    return cy.get('[data-test=restart-button]')
  }

  getStepBack () {
    return cy.get('[data-test=stepback-button]')
  }

  getStepForward () {
    return cy.get('[data-test=step-forward-button]')
  }

  getStartPause () {
    return cy.get('[data-test=playPause-button]')
  }

  getMenu () {
    return cy.get('[data-test=large-menu-button]')
  }

  getfullScreenToggle () {
    return cy.get('[data-test=fullscreen-button]')
  }

  waitForPause () {
    // Let model run for max 120s.
    cy.contains('[data-test=playPause-button]', 'start', { timeout: 120000 })
    cy.wait(500)
  }
}

export default BottomContainer
