import TopContainer from "../../support/elements/top-container";

describe("Camera rotation", function() {
  beforeEach(() => {
    // voronoiSphereFieldsCount=1000 will greatly speed up loading times
    cy.visit("/?preset=subduction&voronoiSphereFieldsCount=1000");
    cy.waitForSplashscreen();
  });

  it("lets user rotate and reset camera", function() {
    cy.waitForSpinner();
    TopContainer.getResetCameraOrientation()
      .should("not.exist");
    TopContainer.getInteractionSelector("Rotate Camera")
      .should("be.visible")
      .click({ force: true });
    cy.mainCanvasDrag([
      { x: 850, y: 500 },
      { x: 800, y: 500 }
    ]);
    TopContainer.getResetCameraOrientation()
      .should("exist")
      .and("be.visible")
      .click({ force: true });
  });
});

describe("Continent drawing and erasing", function() {
  beforeEach(() => {
    // voronoiSphereFieldsCount=1000 will greatly speed up loading times
    cy.visit("/?planetWizard&voronoiSphereFieldsCount=1000");
    cy.waitForSplashscreen();
  });

  const getNumberOfContinentalFields = (window) => 
    // simulation store is available at "s" variable. 0.5 is a sea level elevation.
    Array.from(window.s.model.plates[0].fields.values()).filter(f => f.elevation > 0.5).length;

  it("lets user draw and erase continents", function() {
    cy.get("[data-test=plate-num-options] button").first().click();
    cy.waitForSpinner();

    // No continent at the beginning.
    cy.window().then(win => expect(getNumberOfContinentalFields(win)).to.equal(0));

    // Draw some continents.
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

    // Continent added.
    cy.window().then(win => expect(getNumberOfContinentalFields(win)).to.be.greaterThan(70));

    // Erase part of the 1st continent.
    cy.get("[data-test=erase-continents]").click();
    cy.mainCanvasDrag([
      { x: 450, y: 550 },
      { x: 450, y: 500 }
    ]);

    // Part of continent removed.
    cy.window().then(win => expect(getNumberOfContinentalFields(win)).to.be.lessThan(70));
  });
});

