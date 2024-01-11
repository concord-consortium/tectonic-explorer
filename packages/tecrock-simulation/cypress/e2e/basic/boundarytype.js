import PlanetWizard from "../../support/elements/planet-wizard";
import TopContainer from "../../support/elements/top-container";
import BottomContainer from "../../support/elements/bottom-container";
import BoundaryTypes from "../../support/elements/boundarytype";
import KeyAndOptions from "../../support/elements/keyandoptions";

describe("Boundary Type Popup", function() {
  beforeEach(() => {
    cy.visit("/?rocks=true&planetWizard=true&divisions=15");
    cy.waitForSplashscreen();
  });

  it("2 Plates Boundary", function() {
      KeyAndOptions.getKeysAndOptionsButton().should("not.exist");
      PlanetWizard.getPlateNumOption("2").click({ force: true });
      cy.waitForSpinner();
      BottomContainer.getStep("2").find("span.active").should("be.visible");
      TopContainer.getRotatePlanet().get(".label").contains("Rotate Planet");
      cy.get(" .canvas-3d").click(700, 500);
      cy.wait(2000);
      BottomContainer.getNextButton().click({ force: true });
      BottomContainer.getStep("3").find("span.active").should("be.visible");
      BottomContainer.getNextButton().should('have.disabled');
      TopContainer.getRotatePlanet().should("not.exist");
      TopContainer.getDrawForceVectors().should("not.exist");

      cy.get(" .canvas-3d").click(700, 500);

      BoundaryTypes.getDialogTitle().contains("Plate Boundary Type");
      BoundaryTypes.getConvergent().contains("Convergent");
      BoundaryTypes.getDivergent().contains("Divergent");
      BoundaryTypes.getConvergentArrow().get(".undefined.boundary-config-dialog--arrow-color-0--tectonic-explorer.left").should("be.visible");
      BoundaryTypes.getConvergentArrow().get(".boundary-config-dialog--arrow-color-1--tectonic-explorer.right").should("be.visible");

      BoundaryTypes.getDivergentArrow().get(".boundary-config-dialog--arrow-color-0--tectonic-explorer.left").should("be.visible");
      BoundaryTypes.getDivergentArrow().get(".boundary-config-dialog--arrow-color-1--tectonic-explorer.right").should("be.visible");
      BoundaryTypes.getConvergentArrow().click();
      BoundaryTypes.getConvergentArrow().get(".boundary-config-dialog--selected--tectonic-explorer").should("be.visible");
      BoundaryTypes.getCloseDialog().click();

      cy.get(" .canvas-3d").click(700, 500);
      BoundaryTypes.getDivergentArrow().click();
      BoundaryTypes.getDivergentArrow().get(".boundary-config-dialog--selected--tectonic-explorer").should("be.visible");

  });

  it("4 Plates Boundary", function() {
      KeyAndOptions.getKeysAndOptionsButton().should("not.exist");
      PlanetWizard.getPlateNumOption("4").click({ force: true });
      cy.waitForSpinner();
      BottomContainer.getStep("2").find("span.active").should("be.visible");
      cy.get(" .canvas-3d").click(700, 500);
      cy.get(" .canvas-3d").click(650, 200);
      cy.get(" .canvas-3d").click(650, 720);
      cy.wait(2000);
      BottomContainer.getNextButton().click({ force: true });
      BottomContainer.getStep("3").find("span.active").should("be.visible");
      BottomContainer.getNextButton().should('have.disabled');
      TopContainer.getRotatePlanet().should("not.exist");
      TopContainer.getDrawForceVectors().should("not.exist");

      cy.get(" .canvas-3d").click(700, 500);

      BoundaryTypes.getDialogTitle().contains("Plate Boundary Type");
      BoundaryTypes.getConvergent().contains("Convergent");
      BoundaryTypes.getDivergent().contains("Divergent");
      BoundaryTypes.getConvergentArrow().get(".undefined.boundary-config-dialog--arrow-color-1--tectonic-explorer.left").should("be.visible");
      BoundaryTypes.getConvergentArrow().get(".boundary-config-dialog--arrow-color-2--tectonic-explorer.right").should("be.visible");

      BoundaryTypes.getDivergentArrow().get(".boundary-config-dialog--arrow-color-1--tectonic-explorer.left").should("be.visible");
      BoundaryTypes.getDivergentArrow().get(".boundary-config-dialog--arrow-color-2--tectonic-explorer.right").should("be.visible");
      BoundaryTypes.getConvergentArrow().click();
      BottomContainer.getNextButton().should('not.have.disabled');
      BoundaryTypes.getConvergentArrow().get(".boundary-config-dialog--selected--tectonic-explorer").should("be.visible");
      BoundaryTypes.getCloseDialog().click();

      cy.get(" .canvas-3d").click(700, 500);
      BoundaryTypes.getDivergentArrow().click();
      BoundaryTypes.getDivergentArrow().get(".boundary-config-dialog--selected--tectonic-explorer").should("be.visible");
      BoundaryTypes.getCloseDialog().click();
      cy.get(" .canvas-3d").click(650, 200);

      BoundaryTypes.getDialogTitle().contains("Plate Boundary Type");
      BoundaryTypes.getConvergent().contains("Convergent");
      BoundaryTypes.getDivergent().contains("Divergent");
      BoundaryTypes.getConvergentArrow().get(".boundary-config-dialog--down--tectonic-explorer.boundary-config-dialog--arrow-color-0--tectonic-explorer.top").should("be.visible");

      BoundaryTypes.getDivergentArrow().get(".boundary-config-dialog--up--tectonic-explorer.boundary-config-dialog--arrow-color-0--tectonic-explorer.top").should("be.visible");
      BoundaryTypes.getConvergentArrow().click();
      BottomContainer.getNextButton().should('not.have.disabled');
      BoundaryTypes.getConvergentArrow().get(".boundary-config-dialog--selected--tectonic-explorer").should("be.visible");
      BoundaryTypes.getCloseDialog().click();
      cy.get(" .canvas-3d").click(650, 200);
      BoundaryTypes.getDivergentArrow().click();
      BoundaryTypes.getDivergentArrow().get(".boundary-config-dialog--selected--tectonic-explorer").should("be.visible");
      BoundaryTypes.getCloseDialog().click();
      cy.get(" .canvas-3d").click(650, 720);

      BoundaryTypes.getDialogTitle().contains("Plate Boundary Type");
      BoundaryTypes.getConvergent().contains("Convergent");
      BoundaryTypes.getDivergent().contains("Divergent");
      BoundaryTypes.getConvergentArrow().get(".boundary-config-dialog--up--tectonic-explorer.boundary-config-dialog--arrow-color-3--tectonic-explorer.bottom").should("be.visible");

      BoundaryTypes.getDivergentArrow().get(".boundary-config-dialog--down--tectonic-explorer.boundary-config-dialog--arrow-color-3--tectonic-explorer.bottom").should("be.visible");
      BoundaryTypes.getConvergentArrow().click();
      BottomContainer.getNextButton().should('not.have.disabled');
      BoundaryTypes.getConvergentArrow().get(".boundary-config-dialog--selected--tectonic-explorer").should("be.visible");
      BoundaryTypes.getCloseDialog().click();
      cy.get(" .canvas-3d").click(650, 720);
      BoundaryTypes.getDivergentArrow().click();
      BoundaryTypes.getDivergentArrow().get(".boundary-config-dialog--selected--tectonic-explorer").should("be.visible");
      BoundaryTypes.getCloseDialog().click();

  });
});

describe("Pop-up Message", function() {
  beforeEach(() => {
    cy.visit("/?rocks=true&planetWizard=true&divisions=15");
    cy.waitForSplashscreen();
  });

  it("TecRocks Explorer stops running popup message", function() {
      PlanetWizard.getPlateNumOption("2").click({ force: true });
      cy.waitForSpinner();
      cy.mainCanvasDrag([
        { x: 600, y: 500 },
        { x: 550, y: 450 },
        { x: 500, y: 400 },
        { x: 450, y: 450 },
        { x: 450, y: 500 },
        { x: 450, y: 550 }
      ]);
      cy.mainCanvasDrag([
        { x: 750, y: 400 },
        { x: 750, y: 450 },
        { x: 750, y: 500 }
      ]);
      BottomContainer.getNextButton().click({ force: true });
      cy.get(" .canvas-3d").click(700, 500);
      BoundaryTypes.getConvergentArrow().click();
      BoundaryTypes.getCloseDialog().click();
      BottomContainer.getNextButton().click({ force: true });
      BottomContainer.getFinishButton().click({ force: true });
      TopContainer.getContinueAnywayButton().click({ force: true });
      TopContainer.waitForDialog();
      TopContainer.getStopDialogTitle();
      TopContainer.getStopDialogContent();
  });
});
