import BottomContainer from '../../support/elements/bottom-container'
import TopContainer from '../../support/elements/top-container'
import SideMenu from '../../support/elements/side-menu'

context('Snapshot-based tests', () => {
  specify('Subduction model', () => {
    cy.visit('/?preset=subduction&stopAfter=300')
    cy.waitForSplashscreen()
    cy.waitForSpinner()
    BottomContainer.getMenu().click()
    SideMenu.getEarthquakes().click()
    SideMenu.getVolcanicEruptions().click()
    BottomContainer.waitForPause()
    TopContainer.getInteractionSelector('Draw cross section').click()
    // Note that this cross-section includes one earthquake and one volcanic eruption.
    cy.mainCanvasDrag([
      { x: 600, y: 600 },
      { x: 900, y: 600 }
    ])
    cy.wait(700) // wait for resize to finish
    cy.matchImageSnapshot('earthquakes-and-volc-eruptions-1-subduction-zone')
    // Rotate model to take a look at divergent boundary.
    TopContainer.getRotateCamera().click()
    cy.mainCanvasDrag([
      { x: 1000, y: 500 },
      { x: 300, y: 500 }
    ])
    TopContainer.getInteractionSelector('Draw cross section').click()
    // Note that this cross-section includes one earthquake and one volcanic eruption.
    cy.mainCanvasDrag([
      { x: 600, y: 500 },
      { x: 900, y: 500 }
    ])
    cy.matchImageSnapshot('earthquakes-and-volc-eruptions-2-divergent-boundary-zone')
    // Disable earthquakes and volcanoes
    SideMenu.getEarthquakes().click()
    SideMenu.getVolcanicEruptions().click()
    cy.wait(100)
    cy.matchImageSnapshot('earthquakes-and-volc-eruptions-3-hidden')
  })
})
