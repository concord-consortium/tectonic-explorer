class TopContainer {
  getRefresh () {
    return cy.get('[data-test=top-bar-refresh]')
  }

  getShare () {
    return cy.get('[data-test=top-bar-share]')
  }

  getAbout () {
    return cy.get('[data-test=top-bar-about]')
  }

  getRotateCamera () {
    return cy.get('[data-test=rotate-camera')
    // return cy.get('.interaction-selector > .large-button > .label').contains('Rotate Camera');
  }

  getResetCameraOrientation () {
    return cy.get('.planet-view > .camera-reset')
  }

  getInteractionSelector (option) {
    return cy.contains(option)
  }
}
export default TopContainer
