import BottomContainer from "../../support/elements/bottom-container";
import TopContainer from "../../support/elements/top-container";
import SideMenu from "../../support/elements/side-menu";

context("URL parameters tests", () => {
  context("URL parameter debug to show/hide selected plates", () => {
    it("verifies options to show/hide plates", () => {
      cy.visit("/?geode=false&preset=subduction&debug");
      cy.waitForSplashscreen();
      cy.waitForSpinner();
      BottomContainer.getMenu().click();

      // Hide Plate 0
      SideMenu.getShowHidePlate(0).click();
      cy.wait(100);
      cy.matchImageSnapshot("debug-param-plate0-hidden");

      // Now hide Plate 1 too, so both plates are hidden
      SideMenu.getShowHidePlate(1).click();
      cy.wait(100);
      cy.matchImageSnapshot("debug-param-both-plates-hidden");

      // Now unhide Plate 0, so only Plate 1 is hidden
      SideMenu.getShowHidePlate(0).click();
      cy.wait(100);
      cy.matchImageSnapshot("debug-param-plate1-hidden");

      // Now unhide Plate 1 too, so no plate is hidden
      SideMenu.getShowHidePlate(1).click();
      cy.wait(100);
      cy.matchImageSnapshot("debug-param-no-plate-hidden");
    });
  });

  context("URL parameter markCrossSectionFields", () => {
    it("verifies to markCrossSectionFields=true", () => {
      cy.visit("/?geode=false&preset=subduction&stopAfter=300&markCrossSectionFields=true");
      cy.waitForSplashscreen();
      cy.waitForSpinner();
      BottomContainer.waitForPause();
      TopContainer.getInteractionSelector("Draw Cross-section").click();

      // Note that this cross-section includes one earthquake and one volcanic eruption.
      cy.mainCanvasDrag([
        { x: 600, y: 550 },
        { x: 900, y: 550 }
      ]);
      cy.wait(700); // wait for resize to finish
      cy.matchImageSnapshot("mark-cross-section-fields-subduction-zone");

      // Rotate model to take a look at divergent boundary.
      cy.mainCanvasDrag([
        { x: 1000, y: 500 },
        { x: 300, y: 500 }
      ]);
      cy.wait(700); // wait for reposition to finish

      TopContainer.getInteractionSelector("Draw Cross-section").click();
      cy.mainCanvasDrag([
        { x: 600, y: 332 },
        { x: 900, y: 332 }
      ]);
      cy.wait(700); // wait for resize to finish
      cy.matchImageSnapshot("mark-cross-section-fields-divergent-zone");
    });
  });
});
