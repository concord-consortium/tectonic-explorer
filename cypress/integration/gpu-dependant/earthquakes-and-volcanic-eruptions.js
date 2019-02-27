import BottomContainer from '../../support/elements/bottom-container'
import TopContainer from '../../support/elements/top-container'
import SideMenu from '../../support/elements/side-menu'

const bottom = new BottomContainer()
const sidemenu = new SideMenu()
const top = new TopContainer()

context('Snapshot-based tests', () => {
  specify('Subduction model', () => {
    cy.visit('/?preset=subduction&stopAfter=300')
    cy.waitForSplashscreen()
    cy.waitForSpinner()
    bottom.getMenu().click()
    sidemenu.getEarthquakes().click()
    sidemenu.getVolcanicEruptions().click()
    bottom.waitForPause()
    top.getDrawCrossSection().click()
    // Note that this cross-section includes one earthquake and one volcanic eruption.
    cy.mainCanvasDrag([
      { x: 600, y: 600 },
      { x: 900, y: 600 }
    ])
    cy.wait(700) // wait for resize to finish
    cy.matchImageSnapshot('earthquakes-and-volc-eruptions-1-subduction-zone')
    // Rotate model to take a look at divergent boundary.
    top.getRotateCamera().click()
    cy.mainCanvasDrag([
      { x: 1000, y: 500 },
      { x: 300, y: 500 }
    ])
    top.getDrawCrossSection().click()
    // Note that this cross-section includes one earthquake and one volcanic eruption.
    cy.mainCanvasDrag([
      { x: 600, y: 500 },
      { x: 900, y: 500 }
    ])
    cy.matchImageSnapshot('earthquakes-and-volc-eruptions-2-divergent-boundary-zone')
    // Disable earthquakes and volcanoes
    sidemenu.getEarthquakes().click()
    sidemenu.getVolcanicEruptions().click()
    cy.wait(100)
    cy.matchImageSnapshot('earthquakes-and-volc-eruptions-3-hidden')
  })
})
