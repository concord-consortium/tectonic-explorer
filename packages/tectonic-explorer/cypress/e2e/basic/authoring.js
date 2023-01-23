import BottomContainer from "../../support/elements/bottom-container";

describe("Temp Pressure Tool Authoring Options False", function() {
  before(() => {
    cy.visit("/?rocks=true&preset=subduction&showTempPressureTool=false&divisions=15");
    cy.waitForSplashscreen();
  });

  it("Verify Temp Pressure Tool Not Displayed", function() {
    BottomContainer.getTempPressureTool().should("not.exist");
  });
});

describe("Temp Pressure Tool Authoring Options True", function() {
  before(() => {
    cy.visit("/?rocks=true&preset=subduction&showTempPressureTool=true&divisions=15");
    cy.waitForSplashscreen();
  });

  it("Verify Temp Pressure Tool Not Displayed", function() {
    BottomContainer.getTempPressureTool().should("exist");
  });
});

describe("Contact Metamorphism Authoring Options False", function() {
  before(() => {
    cy.visit("/?rocks=true&preset=subduction&contactMetamorphism=false&&stopAfter=300&divisions=15");
    cy.waitForSplashscreen();
  });

  it("Verify Contact Metamorphism Set To False", function() {
    BottomContainer.waitForPause();
    BottomContainer.getDrawCrossSection().click();
    cy.mainCanvasDrag([
      { x: 600, y: 550 },
      { x: 900, y: 550 }
    ]);
    cy.wait(700); // wait for resize to finish
    cy.matchImageSnapshot("contact-metamorphism-false");
  });
});

describe("Contact Metamorphism Authoring Options True", function() {
  before(() => {
    cy.visit("/?rocks=true&preset=subduction&contactMetamorphism=true&&stopAfter=300&divisions=15");
    cy.waitForSplashscreen();
  });

  it("Verify Contact Metamorphism Set To True", function() {
    BottomContainer.waitForPause();
    BottomContainer.getDrawCrossSection().click();
    cy.mainCanvasDrag([
      { x: 600, y: 550 },
      { x: 900, y: 550 }
    ]);
    cy.wait(700); // wait for resize to finish
    cy.matchImageSnapshot("contact-metamorphism-true");
  });
});

describe("Faulting Lines Authoring Options False", function() {
  before(() => {
    cy.visit("/?rocks=true&preset=divergentBoundary&blockFaultingLines=false&&stopAfter=300&divisions=15");
    cy.waitForSplashscreen();
  });

  it("Verify Faulting Lines Set To False", function() {
    BottomContainer.waitForPause();
    BottomContainer.getDrawCrossSection().click();
    cy.mainCanvasDrag([
      { x: 600, y: 550 },
      { x: 900, y: 550 }
    ]);
    cy.wait(700); // wait for resize to finish
    cy.matchImageSnapshot("block-faulting-lines-false");
  });
});

describe("Faulting Lines Authoring Options True", function() {
  before(() => {
    cy.visit("/?rocks=true&preset=divergentBoundary&blockFaultingLines=true&&stopAfter=300&divisions=15");
    cy.waitForSplashscreen();
  });

  it("Verify Faulting Lines Set To True", function() {
    BottomContainer.waitForPause();
    BottomContainer.getDrawCrossSection().click();
    cy.mainCanvasDrag([
      { x: 600, y: 550 },
      { x: 900, y: 550 }
    ]);
    cy.wait(700); // wait for resize to finish
    cy.matchImageSnapshot("block-faulting-lines-true");
  });
});
