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
    return cy.get('[id=react-tabs-0]');
  }

  static getSeismicDataTab() {
    return cy.get('[id=react-tabs-2]');
  }

  static getOptionsTab() {
    return cy.get('[id=react-tabs-4]');
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
}
export default KeyAndOptions;
