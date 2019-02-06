class BottomContainer {

  getSmallLogo() {
    return cy.get('[data-test=cc-logo-small]')
  }

  getBigLogo() {
    return cy.get('[data-test=cc-logo-large]')
  }

  getReload() {
    return cy.get('[data-test=reload-button]')
  }

  getRestart() {
    return cy.get('[data-test=restart-button]')
  }

  getStepBack() {
    return cy.get('[data-test=stepback-button]')
  }

  getStart() {
    return cy.get('[data-test=playPause-button]')
  }

  getStepForward() {
    return cy.get('[data-test=step-forward-button]')
  }

  getMenu() {
    return cy.get('[data-test=large-menu-button]')
  }

  getfullScreenToggle() {
    return cy.get('[data-test=fullscreen-button]')

  }
}

export default BottomContainer;
