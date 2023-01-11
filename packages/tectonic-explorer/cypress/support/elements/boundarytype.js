class BoundaryTypes {

  static getDialogTitle() {
    return cy.get("#draggable-dialog-title");
  }

  static getCloseDialog() {
    return cy.get('[fill-rule="evenodd"]').eq(0);
  }

  static getConvergent() {
    return cy.get(".boundary-config-dialog--boundaryOption--tectonic-explorer").find("p").eq(0);
  }

  static getDivergent() {
    return cy.get(".boundary-config-dialog--boundaryOption--tectonic-explorer").find("p").eq(1);
  }

  static getConvergentArrow() {
    return cy.get(".boundary-config-dialog--boundaryOption--tectonic-explorer").eq(0);
  }

  static getDivergentArrow() {
    return cy.get(".boundary-config-dialog--boundaryOption--tectonic-explorer").eq(1);
  }
}
export default BoundaryTypes;
