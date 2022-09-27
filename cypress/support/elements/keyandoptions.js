class KeyAndOptions {

  static getRockKeyNumOption(num) {
    switch (num) {
    case ("1"):
      return cy.get("div[class^=rock-types--rockKey--tectonic-explorer] > :nth-child(2)");
    case ("2"):
      return cy.get("div[class^=rock-types--rockKey--tectonic-explorer] > :nth-child(3)");
    case ("3"):
      return cy.get("div[class^=rock-types--rockKey--tectonic-explorer] > :nth-child(4)");
    case ("4"):
      return cy.get("div[class^=rock-types--rockKey--tectonic-explorer] > :nth-child(5)");
    case ("5"):
      return cy.get("div[class^=rock-types--rockKey--tectonic-explorer] > :nth-child(6)");
    case ("6"):
      return cy.get("div[class^=rock-types--rockKey--tectonic-explorer] > :nth-child(7)");
    case ("7"):
      return cy.get("div[class^=rock-types--rockKey--tectonic-explorer] > :nth-child(8)");
    }
  }

  static getKeysAndOptionsButton() {
    return cy.get('[data-test=key-toggle-button]');
  }

  static getMapTypeTab() {
    return cy.get('[data-test=map-type-tab]');
  }

  static getSeismicDataTab() {
    return cy.get('[data-test=seismic-data-tab]');
  }

  static getOptionsTab() {
    return cy.get('[data-test=advanced-options-tab]');
  }

  static getMapTypeKey() {
    return cy.get('[data-test=map-type-key]');
  }

  static getKeyRockType() {
    return cy.get(".rock-types--rockKey--tectonic-explorer");
  }

  static getVolcanicKey() {
    return cy.get('[data-test=seismic-key-volcanic-eruptions]');
  }

  static getEarthquakesKey() {
    return cy.get('[data-test=seismic-key-earthquakes]');
  }

  static getShareModel() {
    return cy.get('[data-react-toolbox=button]');
  }

  static verifyCrustAgeKey() {
    this.getMapTypeKey().find(".map-type--crustAgeSwatch--tectonic-explorer").eq(0).invoke("attr", "style").should("contain", "background: rgb(246, 247, 77);");
    this.getMapTypeKey().find(".map-type--crustAgeSwatch--tectonic-explorer").eq(1).invoke("attr", "style").should("contain", "background: rgb(251, 211, 61);");
    this.getMapTypeKey().find(".map-type--crustAgeSwatch--tectonic-explorer").eq(2).invoke("attr", "style").should("contain", "background: rgb(251, 167, 57);");
    this.getMapTypeKey().find(".map-type--crustAgeSwatch--tectonic-explorer").eq(3).invoke("attr", "style").should("contain", "background: rgb(248, 130, 75);");
    this.getMapTypeKey().find(".map-type--crustAgeSwatch--tectonic-explorer").eq(4).invoke("attr", "style").should("contain", "background: rgb(237, 62, 106);");
    this.getMapTypeKey().find(".map-type--crustAgeSwatch--tectonic-explorer").eq(5).invoke("attr", "style").should("contain", "background: rgb(194, 15, 131);");
    this.getMapTypeKey().find(".map-type--crustAgeSwatch--tectonic-explorer").eq(6).invoke("attr", "style").should("contain", "background: rgb(136, 14, 144);");
    this.getMapTypeKey().find(".map-type--crustAgeSwatch--tectonic-explorer").eq(7).invoke("attr", "style").should("contain", "background: rgb(50, 27, 140);");
    this.getMapTypeKey().find(".map-type--crustAgeSwatch--tectonic-explorer").eq(8).invoke("attr", "style").should("contain", "background: rgb(6, 15, 94);");
    this.getMapTypeKey()
    .should("contain", "Newest crust")
    .should("contain", "Oldest crust")
    .should("contain", "Pre-existing crust")
  }
}
export default KeyAndOptions;
