import BottomContainer from "../../support/elements/bottom-container";
import TopContainer from "../../support/elements/top-container";
import SideMenu from "../../support/elements/side-menu";

context("Snapshot-based tests", () => {
  specify("Subduction model", () => {
    cy.visit("/?rocks=true&preset=subduction&stopAfter=300");
    cy.waitForSplashscreen();
    cy.waitForSpinner();
    BottomContainer.getVolcanoes().click();
    BottomContainer.getEarthquakes().click();
    BottomContainer.waitForPause();
    BottomContainer.getDrawCrossSection().click();
    // Note that this cross-section includes one earthquake and one volcanic eruption.
    cy.mainCanvasDrag([
      { x: 600, y: 550 },
      { x: 900, y: 550 }
    ]);
    cy.wait(700); // wait for resize to finish
    cy.matchImageSnapshot("earthquakes-and-volc-eruptions-1-subduction-zone");

    // Rotate model to take a look at divergent boundary.
    BottomContainer.getDrawCrossSection().click();
    cy.mainCanvasDrag([
      { x: 1000, y: 500 },
      { x: 300, y: 500 }
    ]);
    BottomContainer.getDrawCrossSection().click();
    // Note that this cross-section includes one earthquake and one volcanic eruption.
    cy.mainCanvasDrag([
      { x: 600, y: 332 },
      { x: 900, y: 332 }
    ]);
    cy.matchImageSnapshot("earthquakes-and-volc-eruptions-2-divergent-boundary-zone");
    // Disable earthquakes and volcanoes
    BottomContainer.getVolcanoes().click();
    BottomContainer.getEarthquakes().click();
    cy.wait(100);
    cy.matchImageSnapshot("earthquakes-and-volc-eruptions-3-hidden");
  });
});

describe("Earthquakes & Volcanoes Icons", function() {
  before(() => {
    cy.visit("/?rocks=true&preset=subduction&stopAfter=300");
    cy.waitForSplashscreen();
  });

  it("Verify Earthquakes & Volcanoes Icons", function() {
    BottomContainer.getVolcanoes().click();
    BottomContainer.getEarthquakes().click();
    BottomContainer.waitForPause();
    cy.matchImageSnapshot("earthquakes-and-volcanoes-icons");
  });
});
