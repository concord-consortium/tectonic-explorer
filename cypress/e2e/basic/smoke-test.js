import PlanetWizard from "../../support/elements/planet-wizard";
import TopContainer from "../../support/elements/top-container";
import BottomContainer from "../../support/elements/bottom-container";
import BoundaryTypes from "../../support/elements/boundarytype";
import ModeWizard from "../../support/elements/mode-wizard";

// Smoke test for Tectonic Explorer

context("Smoke Test", () => {
  before(function() {
    // voronoiSphereFieldsCount=1000 will greatly speed up loading times
    cy.visit("/?geode=false&planetWizard=true&voronoiSphereFieldsCount=1000&divisions=15");
    cy.waitForSplashscreen();
  });

  context("Loading screen and initialization of app", () => {
    it("Makes sure splash screen renders and disappears", () => {
      cy.waitForSplashscreen();
    });
    it("verifies the logo", () => {
      BottomContainer.getBigLogo().should("exist").and("be.visible");
    });
    it("verifies refresh", () => {
      TopContainer.getRefresh().should("be.visible");
      PlanetWizard.getAllPlateNumOptions().children().should("have.length", 5);
      PlanetWizard.getPlateNumOption("2").should("be.visible").click({ force: true });
      PlanetWizard.getAllPlateNumOptions().should("not.exist");
      cy.waitForSpinner();
      TopContainer.getRefresh().should("be.visible").click({ force: true });
      cy.wait(500); // refresh (reload) works with a small delay, wait for it
      cy.waitForSpinner();
      ModeWizard.getTecRocksButton().click({ force: true });
      cy.wait(500); // refresh (reload) works with a small delay, wait for it
      cy.waitForSpinner();
      PlanetWizard.getPlateNumOption("3").should("exist").and("be.visible");
    });

    it("verifies share", () => {
      TopContainer.getShare().should("be.visible").and("contain", "Share").click({ force: true });
      cy.waitForSpinner();
      cy.get("[data-react-toolbox=dialog]").get("[data-react-toolbox=button]")
        .should("contain", "Copy Link")
        .should("contain", "Copy HTML")
        .should("contain", "Close");
      cy.get("[data-react-toolbox=dialog]").get("[data-react-toolbox=button]").eq(2).click({ force: true });
    });

    it("verifies about", () => {
      TopContainer.getAbout().should("be.visible").and("contain", "About").click({ force: true });
      cy.get("section").should("contain", "About: Tectonic Explorer").and("contain", "Piotr Janik");
      cy.get("body").click("left");
    });
    it("verifies all the step labels", () => {
      BottomContainer.getStep("1").should("contain", "Select layout of the planet");
      BottomContainer.getStep("2").should("contain", "Draw continents");
      BottomContainer.getStep("3").should("contain", "Assign boundary types");
      BottomContainer.getStep("4").should("contain", "Order plates");
    });
  });

  context("Step 1", () => {
    it("checks step 1 options are accurately represented", () => {
      TopContainer.getRefresh().should("be.visible").click({ force: true });
      cy.wait(500); // refresh (reload) works with a small delay, wait for it
      cy.waitForSpinner();
      ModeWizard.getTecRocksButton().click({ force: true });
      cy.wait(500); // refresh (reload) works with a small delay, wait for it
      cy.waitForSplashscreen();
      BottomContainer.getStep("1").find("span.active").should("be.visible");
      PlanetWizard.getColorKey().should("not.exist");
      BottomContainer.getBackButton().should("be.disabled");
    });
    it("selects number of plates for model, user directed to step 2", () => {
      PlanetWizard.getPlateNumOption("3").click({ force: true });
      cy.waitForSpinner();
      BottomContainer.getStep("2").find("span.active").should("be.visible");
    });
    it("Click back, then next to check navigation", () => {
      BottomContainer.getBackButton().should("not.have.attr", "disabled");
      BottomContainer.getBackButton().click({ force: true });
      BottomContainer.getStep("1").find("span.active").should("be.visible");
      PlanetWizard.getPlateNumOption("3").click({ force: true });
      cy.waitForSpinner();
    });
  });

  context("Step 2", () => {
    it("checks step 2 conditions are accurately represented", () => {
      TopContainer.getInteractionSelector("Draw Continents").should("be.visible");
      TopContainer.getInteractionSelector("Erase Continents").should("be.visible");
      TopContainer.getInteractionSelector("Rotate Planet").should("be.visible");
      BottomContainer.getStep("1").find("span.done").should("be.visible");
      BottomContainer.getStep("2").find("span.active").should("be.visible");
    });
    it("rotates the camera and resets planet orientation", () => {
      TopContainer.getResetCameraOrientation().should("not.exist");
      TopContainer.getInteractionSelector("Rotate Planet").should("be.visible").click({ force: true });
      cy.mainCanvasDrag([
        { x: 850, y: 500 },
        { x: 800, y: 500 }
      ]);
      TopContainer.getResetCameraOrientation().should("exist").and("be.visible").click({ force: true });
      BottomContainer.getNextButton().click({ force: true });
    });
  });

  context("Step 3", () => {
    it("checks step 3 conditions are correctly represented", () => {
      // TopContainer.getInteractionSelector("Draw Force Vectors")
      //   .should("be.visible")
      //   .and("exist");
      BottomContainer.getStep("1").find("span.done").should("be.visible");
      BottomContainer.getStep("2").find("span.done").should("be.visible");
      BottomContainer.getStep("3").find("span.active").should("be.visible");
      cy.get(" .canvas-3d").click(480, 250);
      BoundaryTypes.getConvergentArrow().click();
      BoundaryTypes.getCloseDialog().click();
    });
    // TODO: next button is disabled until a boundary type is assigned
    it("skips to next page", () => {
      BottomContainer.getNextButton().click({ force: true });
    });
  });

  context("Step 4", () => {
    it("checks step 4 conditions are correctly represented", () => {
      PlanetWizard.getAllPlanetDensityOptions().should("have.length", 3);
      BottomContainer.getStep("1").find("span.done").should("be.visible");
      BottomContainer.getStep("2").find("span.done").should("be.visible");
      BottomContainer.getStep("3").find("span.done").should("be.visible");
      BottomContainer.getStep("4").find("span.active").should("be.visible");
    });
    it("rearranges the density order", () => {
      // Add in test case
    });
    it("clicks finish", () => {
      BottomContainer.getFinishButton().click({ force: true });
    });
  });
});
