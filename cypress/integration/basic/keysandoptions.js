import KeyAndOptions from "../../support/elements/keyandoptions";
import BottomContainer from "../../support/elements/bottom-container";
import TopContainer from "../../support/elements/top-container";

describe("Keys And Options", function() {
  before(() => {
    cy.visit("/?preset=subduction");
    cy.waitForSplashscreen();
  });

  it("Verify Rotate Camera And Draw Force Vectors Are Not Displayed", function() {
    TopContainer.getRotateCamera().should("not.exist");
    TopContainer.getDrawForceVectors().should("not.exist");
  });

  it("Keys And Options Tabs", function() {
    KeyAndOptions.getKeysAndOptionsButton().should("be.visible").should("contain", "Keys and Options");
    KeyAndOptions.getKeysAndOptionsButton().click();
    KeyAndOptions.getMapTypeTab().should("be.visible").should("contain", "Map Type");
    KeyAndOptions.getSeismicDataTab().should("be.visible").should("contain", "Seismic Data");
    KeyAndOptions.getSeismicDataTab().invoke("attr", "aria-disabled").should("contain", true);
    KeyAndOptions.getOptionsTab().should("be.visible").should("contain", "Options");
  });

  it("Map Type Tab", function() {
    BottomContainer.getTakeSample().click();
    KeyAndOptions.getMapTypeKey().should("be.visible").should("contain", "Key: Elevation");
    KeyAndOptions.getKeyRockType().should("be.visible").get(".rock-types--title--tectonic-explorer").should("contain", "Key: Rock Types");

    //verfiy different rock types displayed
    KeyAndOptions.getRockKeyNumOption("1").get(".rock-types--headerLabel--tectonic-explorer").contains("Igneous Rocks");

    KeyAndOptions.getRockKeyNumOption("1").get(".rock-types--flashContainer--tectonic-explorer")
      .should("contain", "Gabbro")
      .should("contain", "Basalt")
      .should("contain", "Diorite")
      .should("contain", "Andesite")
      .should("contain", "Granite")
      .should("contain", "Rhyolite");

    KeyAndOptions.getRockKeyNumOption("2").get(".rock-types--headerLabel--tectonic-explorer").contains("Mantle Rocks");

    KeyAndOptions.getRockKeyNumOption("2").get(".rock-types--flashContainer--tectonic-explorer")
      .should("contain", "Mantle (brittle)")
      .should("contain", "Mantle (ductile)");

    KeyAndOptions.getRockKeyNumOption("3").get(".rock-types--headerLabel--tectonic-explorer").contains("Metamorphic Rocks");

    KeyAndOptions.getRockKeyNumOption("3").get(".rock-types--flashContainer--tectonic-explorer")
      .should("contain", "Low Grade")
      .should("contain", "Medium Grade")
      .should("contain", "High Grade");

    KeyAndOptions.getRockKeyNumOption("4").get(".rock-types--headerLabel--tectonic-explorer").contains("Sedimentary Rocks");

    KeyAndOptions.getRockKeyNumOption("4").get(".rock-types--flashContainer--tectonic-explorer")
      .should("contain", "Sandstone")
      .should("contain", "Shale")
      .should("contain", "Limestone");

    KeyAndOptions.getRockKeyNumOption("5").get(".rock-types--headerLabel--tectonic-explorer").contains("Sediments");

    KeyAndOptions.getRockKeyNumOption("5").get(".rock-types--flashContainer--tectonic-explorer")
      .should("contain", "Oceanic")
      .should("contain", "Continental");

    KeyAndOptions.getRockKeyNumOption("6").get(".rock-types--headerLabel--tectonic-explorer").contains("Magma");

    KeyAndOptions.getRockKeyNumOption("6").get(".rock-types--flashContainer--tectonic-explorer")
      .should("contain", "Silica-rich")
      .should("contain", "Intermediate")
      .should("contain", "Iron-rich");

    KeyAndOptions.getRockKeyNumOption("7").get(".rock-types--headerLabel--tectonic-explorer").contains("Other");

    KeyAndOptions.getRockKeyNumOption("7").get(".rock-types--flashContainer--tectonic-explorer")
      .should("contain", "Sky")
      .should("contain", "Ocean");
  });

  it("Seismic Data Tab", function() {
    BottomContainer.getVolcanoes().click();
    BottomContainer.getEarthquakes().click();
    KeyAndOptions.getSeismicDataTab().click();
    KeyAndOptions.getSeismicDataTab().invoke("attr", "aria-disabled").should("contain", false);
    KeyAndOptions.getVolcanicKey().should("be.visible")
    .should("contain", "Key: Volcanoes")
    .should("contain", "Volcanic Eruption");
    KeyAndOptions.getEarthquakesKey().should("be.visible")
    .should("contain", "Key: Earthquakes")
    .should("contain", "Magnitude and Depth");
    BottomContainer.getVolcanoes().click();
    BottomContainer.getEarthquakes().click();
    KeyAndOptions.getSeismicDataTab().invoke("attr", "aria-disabled").should("contain", true);
  });

  it("Options Tab", function() {
    KeyAndOptions.getOptionsTab().click();
    cy.get('[data-react-toolbox=dropdown]')
    .should("contain", "Rotate Camera")
    .should("contain", "Draw Cross-section")
    .should("contain", "Draw Force Vectors")
    .should("contain", "Draw Continents")
    .should("contain", "Erase Continents")
    .should("contain", "Mark Field")
    .should("contain", "Remove Field Markers")
    .should("contain", "Log Field Data");
    cy.get(".theme--itemText--26rpnLbH.theme--primary--2RBxYs8e")
    .should("contain", "Metamorphism")
    .should("contain", "Latitude and Longitude Lines")
    .should("contain", "Plate Labels")
    .should("contain", "Velocity Arrows")
    .should("contain", "Force Arrows")
    .should("contain", "Euler Poles")
    .should("contain", "Plate Boundaries")
    .should("contain", "Wireframe");
    KeyAndOptions.getShareModel().should("contain", "Share Model");
  });

});

context("Geode Model", function() {
  before(()=>{
    cy.visit("/?geode&preset=subduction");
    cy.waitForSplashscreen();
  });

it("Verify Rotate Camera And Draw Force Vectors Are Displayed", function() {
    TopContainer.getRotateCamera().should("exist");
    TopContainer.getDrawForceVectors().should("exist");
  });

it("Verify Metamorphism Option not displayed", function() {
  KeyAndOptions.getKeysAndOptionsButton().click();
  KeyAndOptions.getOptionsTab().click();
  cy.get(".theme--itemText--26rpnLbH.theme--primary--2RBxYs8e")
  .should("not.contain", "Metamorphism")
  .should("contain", "Latitude and Longitude Lines")
  .should("contain", "Plate Labels")
  .should("contain", "Velocity Arrows")
  .should("contain", "Force Arrows")
  .should("contain", "Euler Poles")
  .should("contain", "Plate Boundaries")
  .should("contain", "Wireframe");
});
});