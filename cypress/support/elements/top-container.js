class TopContainer {
  static getRefresh() {
    return cy.get("[data-test=top-bar-refresh]");
  }

  static getShare() {
    return cy.get("[data-test=top-bar-share]");
  }

  static getAbout() {
    return cy.get("[data-test=top-bar-about]");
  }

  static getRotateCamera() {
    return cy.get("[data-test=rotate-camera");
    // return cy.get('.interaction-selector > .large-button > .label').contains('Rotate Camera');
  }

  static getResetCameraOrientation() {
    return cy.get(".planet-view > .camera-reset");
  }

  static getInteractionSelector(option) {
    return cy.contains(option);
  }
}
export default TopContainer;
