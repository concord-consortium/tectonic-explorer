import BottomContainer from "../../support/elements/bottom-container";
import BoundaryTypes from "../../support/elements/boundarytype";
import PlanetWizard from "../../support/elements/planet-wizard";
import KeyAndOptions from "../../support/elements/keyandoptions";
import SideMenu from "../../support/elements/side-menu";

describe("Bottom Bar", function() {
  beforeEach(() => {
    cy.visit("/?geode=false&preset=subduction&divisions=15");
    cy.waitForSplashscreen();
  });

  it("Resizes the logo", function() {
    cy.get(".cc-logo-large").should("be.visible");
    cy.get(".cc-logo-small").should("not.be.visible");

    cy.viewport(800, 660);
    cy.get(".cc-logo-large").should("not.be.visible");
    cy.get(".cc-logo-small").should("be.visible");
  });

  it("Take Sample", function() {
    BottomContainer.getTakeSample().should("be.visible");
  });

  it("Map Type", function() {
    BottomContainer.getMapType().should("be.visible");
    BottomContainer.getPrevMapType().should("be.visible");
    BottomContainer.getNextMapType().should("be.visible");
    BottomContainer.getMapTypeLabel().should("contain", "Topographic");
    BottomContainer.getNextMapType().click();
    BottomContainer.getMapTypeLabel().should("contain", "Plate Color");
    BottomContainer.getNextMapType().click();
    BottomContainer.getMapTypeLabel().should("contain", "Crust Age");
    BottomContainer.getNextMapType().click();
    BottomContainer.getMapTypeLabel().should("contain", "Rock Type");
  });

  it("Draw Cross Section", function() {
    BottomContainer.getDrawCrossSection().should("be.visible").click();
    KeyAndOptions.getKeysAndOptionsButton().should("be.visible").should("contain", "Keys and Options");
    cy.mainCanvasDrag([
      { x: 850, y: 500 },
      { x: 800, y: 500 }
    ]);
    BottomContainer.getTakeSample().click();
    BottomContainer.getDrawCrossSection().click();
    cy.mainCanvasDrag([
      { x: 750, y: 500 },
      { x: 700, y: 500 }
    ]);
  });

  it("Buttons", function() {
    BottomContainer.getRestart().should("be.visible").should("contain", "Restart");
    BottomContainer.getStepBack().should("be.visible").should("contain", "– Step");
    BottomContainer.getStartPause().should("be.visible").should("contain", "Pause").click().should("contain", "Start");
    BottomContainer.getStepForward().should("be.visible").should("contain", "+ Step");
  });

  it("Volcanoes And Earthquakes", function() {
    BottomContainer.getVolcanoes().should("be.visible").should("contain", "Volcanoes");
    BottomContainer.getEarthquakes().should("be.visible").should("contain", "Earthquakes");
    BottomContainer.getVolcanoes().click();
    BottomContainer.getVolcanoes().get(".slider-switch--thumb--tectonic-explorer.on").should("be.visible");
    BottomContainer.getVolcanoes().get(".slider-switch--thumbInterior--tectonic-explorer.on").should('have.css', 'background-color').and('eq', 'rgb(152, 209, 163)');
    BottomContainer.getEarthquakes().click();
    BottomContainer.getEarthquakes().get(".slider-switch--thumb--tectonic-explorer.on").should("be.visible");
    BottomContainer.getEarthquakes().get(".slider-switch--thumbInterior--tectonic-explorer.on").should('have.css', 'background-color').and('eq', 'rgb(152, 209, 163)');
    cy.get(".caveat-notice--visible--tectonic-explorer").should("contain", "The earthquakes and volcanic eruptions in this model do not represent actual frequency or duration. Because of the timescale of this model, only a very small number of these events are represented to highlight where they might occur.");
  });

  it("FullScreen Button", function() {
    BottomContainer.getFullScreenButton().should("be.visible");
  });

  it("Measure Temp/Pressure", function() {
    BottomContainer.getTempPressureTool().should('have.disabled');
    BottomContainer.getDrawCrossSection().click();
    cy.mainCanvasDrag([
      { x: 750, y: 500 },
      { x: 700, y: 500 }
    ]);
    BottomContainer.getTempPressureTool().should('not.have.disabled');

  });

  it("Cross Sections Tool", function() {
    BottomContainer.getDrawCrossSection().should("be.visible").click();
    cy.mainCanvasDrag([
      { x: 850, y: 500 },
      { x: 800, y: 500 }
    ]);
    SideMenu.getCrossSectionClose().should("be.visible");
    SideMenu.getCrossSectionZoomIn().should("be.visible").click();
    SideMenu.getCrossSectionZoomOut().should("be.visible");
    SideMenu.getCrossSectionReset().should("be.visible");
  });
});

context("Geode Model", function() {
  before(()=>{
    cy.visit("/?geode&preset=subduction&divisions=15");
    cy.waitForSplashscreen();
  });

  it("Verify TakeSample Not Displayed for Geode", function() {
    BottomContainer.getTakeSample().should("not.exist");
  });
});

context("Reset Plates", function() {
  before(()=>{
    cy.visit("/?geode=false&planetWizard=true&divisions=15");
    cy.waitForSplashscreen();
  });

it("Verify Reset Plates Displayed", function() {

    PlanetWizard.getPlateNumOption("2").click({ force: true });
    cy.waitForSpinner();
    cy.get(" .canvas-3d").click(700, 500);
    cy.wait(2000);
    BottomContainer.getNextButton().click({ force: true });
    cy.get(" .canvas-3d").click(700, 500);
    BoundaryTypes.getConvergentArrow().click();
    BoundaryTypes.getCloseDialog().click();
    BottomContainer.getNextButton().click({ force: true });
    BottomContainer.getFinishButton().click({ force: true });
    BottomContainer.getResetPlates().should("be.visible").should("contain", "Reset Plates");
    BottomContainer.getResetPlates().click();
    PlanetWizard.getPlateNumOption("2").should("be.visible");

});
});
