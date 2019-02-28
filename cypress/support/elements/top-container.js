class TopContainer {
  getRefresh () {
    return cy.get('.top-bar--topBar--lXu1iRHL > .material-icons')
  }

  getShare () {
    return cy.get('.top-bar--share--181dZdzQ')
  }

  getAbout () {
    return cy.get('.top-bar--about--pqGn8uTf')
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
