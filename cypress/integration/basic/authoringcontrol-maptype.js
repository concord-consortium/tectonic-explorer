import PlanetWizard from "../../support/elements/planet-wizard";
import BottomContainer from "../../support/elements/bottom-container";
import BoundaryTypes from "../../support/elements/boundarytype";

context("Turnoff Topographic Maptype", function() {
  before(()=>{
    //cy.visit("/?colormap=plate&colormapOptions=[plate,age,rock]");
    cy.visit("/?colormap=plate");
    cy.waitForSplashscreen();
  });

  it("Verify Topographic Maptype Not Displayed", function() {
    PlanetWizard.getPlateNumOption("2").click({ force: true });
    cy.waitForSpinner();
    BottomContainer.getStep("2").find("span.active").should("be.visible");
    cy.get(" .canvas-3d").click(700, 500);
    cy.wait(2000);
    BottomContainer.getNextButton().click({ force: true });
    BottomContainer.getStep("3").find("span.active").should("be.visible");
    BottomContainer.getNextButton().should('have.disabled');
    cy.get(" .canvas-3d").click(700, 500);
    BoundaryTypes.getConvergentArrow().click();
    BoundaryTypes.getCloseDialog().click();
    BottomContainer.getNextButton().click({ force: true });
    BottomContainer.getFinishButton().click({ force: true });
    BottomContainer.getMapType().should("be.visible");
    BottomContainer.getPrevMapType().should("be.visible");
    BottomContainer.getNextMapType().should("be.visible");
    BottomContainer.getMapTypeLabel().should("not.contain", "Topographic");
    BottomContainer.getMapTypeLabel().should("contain", "Plate Color");
    BottomContainer.getNextMapType().click();
    BottomContainer.getMapTypeLabel().should("contain", "Crust Age");
    BottomContainer.getNextMapType().click();
    BottomContainer.getMapTypeLabel().should("contain", "Rock Type");
    BottomContainer.getNextMapType().click();
    BottomContainer.getMapTypeLabel().should("contain", "Plate Color");
  });
});

context.skip("Maptype Hidden", function() {
  before(()=>{
    cy.visit("/?colormap=rock&colormapOptions=[rock]");
    cy.waitForSplashscreen();
  });

  it("Verify Maptype Not Displayed", function() {
    PlanetWizard.getPlateNumOption("2").click({ force: true });
    cy.waitForSpinner();
    BottomContainer.getStep("2").find("span.active").should("be.visible");
    cy.get(" .canvas-3d").click(700, 500);
    cy.wait(2000);
    BottomContainer.getNextButton().click({ force: true });
    BottomContainer.getStep("3").find("span.active").should("be.visible");
    BottomContainer.getNextButton().should('have.disabled');
    cy.get(" .canvas-3d").click(700, 500);
    BoundaryTypes.getConvergentArrow().click();
    BoundaryTypes.getCloseDialog().click();
    BottomContainer.getNextButton().click({ force: true });
    BottomContainer.getFinishButton().click({ force: true });
    BottomContainer.getMapType().should("not.exist");
  });
});

context.skip("DrawCross Section And Take Sample Hidden", function() {
  before(()=>{
    cy.visit("/?showDrawCrossSectionButton=false&showTakeSampleButton=false");
    cy.waitForSplashscreen();
  });

  it("Verify DrawCross Section And Take Sample Are Not Displayed", function() {
    PlanetWizard.getPlateNumOption("2").click({ force: true });
    cy.waitForSpinner();
    BottomContainer.getStep("2").find("span.active").should("be.visible");
    cy.get(" .canvas-3d").click(700, 500);
    cy.wait(2000);
    BottomContainer.getNextButton().click({ force: true });
    BottomContainer.getStep("3").find("span.active").should("be.visible");
    BottomContainer.getNextButton().should('have.disabled');
    cy.get(" .canvas-3d").click(700, 500);
    BoundaryTypes.getConvergentArrow().click();
    BoundaryTypes.getCloseDialog().click();
    BottomContainer.getNextButton().click({ force: true });
    BottomContainer.getFinishButton().click({ force: true });
    BottomContainer.getTakeSample().should("not.exist");
    BottomContainer.getDrawCrossSection().should("not.exist");
  });
});
