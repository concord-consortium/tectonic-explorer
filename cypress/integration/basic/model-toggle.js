import BottomContainer from "../../support/elements/bottom-container";
import ModeWizard from "../../support/elements/mode-wizard";

describe("Planet Wizard", function() {
  beforeEach(() => {
    cy.visit("/?planetWizard=true");
    cy.waitForSpinner();
  });

  it("Verify TecRocks Version", () => {
    ModeWizard.getTecRocksButton().click({ force: true });
    cy.wait(500); // refresh (reload) works with a small delay, wait for it
    cy.waitForSpinner();
    BottomContainer.getStep("3").should("contain", "Assign boundary types");
  });

  it("Verify GEODE Version", () => {
    ModeWizard.getGeodeButton().click({ force: true });
    cy.wait(500); // refresh (reload) works with a small delay, wait for it
    cy.waitForSpinner();
    BottomContainer.getStep("3").should("contain", "Assign forces to plates");
  });
});

describe("Preset Subduction", function() {
  beforeEach(() => {
    cy.visit("/?preset=subduction");
    cy.waitForSpinner();
  });

  it("Verify TecRocks Version", () => {
    ModeWizard.getTecRocksButton().click({ force: true });
    cy.wait(500); // refresh (reload) works with a small delay, wait for it
    cy.waitForSpinner();
    BottomContainer.getTakeSample().should("exist");
  });

  it("Verify GEODE Version", () => {
    ModeWizard.getGeodeButton().click({ force: true });
    cy.wait(500); // refresh (reload) works with a small delay, wait for it
    cy.waitForSpinner();
    BottomContainer.getTakeSample().should("not.exist");
  });
});
