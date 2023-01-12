import BottomContainer from "../../support/elements/bottom-container";
import ModeWizard from "../../support/elements/mode-wizard";
import TopContainer from "../../support/elements/top-container";

describe("Planet Wizard", function() {
  before(() => {
    cy.visit("/?planetWizard=true&divisions=15");
    cy.waitForSpinner();
  });

  it("Verify Planet Wizard", () => {
    ModeWizard.getTecRocksButton().click({ force: true });
    cy.wait(500); // refresh (reload) works with a small delay, wait for it
    cy.waitForSpinner();
    BottomContainer.getStep("3").should("contain", "Assign boundary types");
    TopContainer.getRefresh().should("be.visible").click({ force: true });
    cy.wait(500); // refresh (reload) works with a small delay, wait for it
    cy.waitForSpinner();
    ModeWizard.getGeodeButton().click({ force: true });
    cy.wait(500); // refresh (reload) works with a small delay, wait for it
    cy.waitForSpinner();
    BottomContainer.getStep("3").should("contain", "Assign forces to plates");
  });
});

describe("Preset Subduction", function() {
  before(() => {
    cy.visit("/?preset=subduction&divisions=15");
    cy.waitForSpinner();
  });

  it("Verify Preset Subduction", () => {
    ModeWizard.getTecRocksButton().click({ force: true });
    cy.wait(1000); // refresh (reload) works with a small delay, wait for it
    cy.waitForSpinner();
    BottomContainer.getTakeSample().should("exist");
    TopContainer.getRefresh().should("be.visible").click({ force: true });
    cy.wait(1000); // refresh (reload) works with a small delay, wait for it
    cy.waitForSpinner();
    ModeWizard.getGeodeButton().click({ force: true });
    cy.wait(1000); // refresh (reload) works with a small delay, wait for it
    cy.waitForSpinner();
    BottomContainer.getTakeSample().should("not.exist");
  });
});
