class TopContainer {
  getDrawContinents () {
    return cy.get('[data-test=draw-continents')
    // return cy.get('.interaction-selector > .large-button > .label').contains('Draw Continents');
  }

  getEraseContinents () {
    return cy.get('[data-test=erase-continents')
    // return cy.get('.interaction-selector > .large-button > .label').contains('Erase Continents');
  }

  getDrawCrossSection () {
    return cy.get('[data-test=draw-cross-section')
    // return cy.get('.interaction-selector > .large-button > .label').contains('Draw cross section');
  }

  getDrawForceVector () {
    return cy.get('[data-test=draw-force-vectors')
    // return cy.get('.interaction-selector > .large-button > .label').contains('Draw force vectors');
  }

  getRotateCamera() {
    return cy.get('[data-test=rotate-camera')
    // return cy.get('.interaction-selector > .large-button > .label').contains('Rotate Camera');
  }
  getInteractionSelector(option) {
    let selector = option;
    return cy.contains(option)
  }

  getRefresh () {
    return cy.get('.top-bar--topBar--lXu1iRHL > .material-icons')
  }

  getShare () {
    return cy.get('.top-bar--share--181dZdzQ')
  }

  getAbout () {
    return cy.get('.top-bar--about--pqGn8uTf')
  }

  getResetCameraOrientation () {
    return cy.get('.planet-view > .camera-reset')
  }
}
export default TopContainer
