import BottomContainer from '../support/elements/bottom-container'
const bottom = new BottomContainer()

context('Snapshot-based tests', () => {
  it('planet wizard', () => {
    cy.visit('/?planetWizard=true&stopAfter=300')
    cy.waitForSplashscreen()
    cy.matchImageSnapshot('planet-wizard-1')
    cy.get('[data-test=plate-num-options] button').first().click()
    cy.waitForSpinner()
    // cy.matchImageSnapshot('planet-wizard-2-empty-two-plates')
    // Draw some continents.
    cy.mainCanvasDrag([
      { x: 600, y: 500 },
      { x: 550, y: 450 },
      { x: 500, y: 400 },
      { x: 450, y: 450 },
      { x: 450, y: 500 },
      { x: 450, y: 550 }
    ])
    cy.mainCanvasDrag([
      { x: 750, y: 400 },
      { x: 750, y: 450 },
      { x: 750, y: 500 }
    ])
    // Erase part of the 1st continent.
    cy.get('[data-test=erase-continents]').click()
    cy.mainCanvasDrag([
      { x: 450, y: 550 },
      { x: 450, y: 500 }
    ])
    cy.matchImageSnapshot('planet-wizard-2-continent')
    cy.get('[data-test=planet-wizard-next]').click()
    // Draw force arrows.
    cy.mainCanvasDrag([
      { x: 550, y: 500 },
      { x: 600, y: 500 }
    ])
    cy.mainCanvasDrag([
      { x: 850, y: 500 },
      { x: 800, y: 500 }
    ])
    cy.matchImageSnapshot('planet-wizard-3-force-arrows')
    cy.get('[data-test=planet-wizard-next]').click()
    cy.get('[data-test=density-button]').first()
      .trigger('mousedown')
    cy.get('body')
      .trigger('mousemove', { pageX: 200, pageY: 500 })
      .trigger('mouseup')
    cy.matchImageSnapshot('planet-wizard-4-density-order')
    cy.get('[data-test=planet-wizard-next]').click()
    bottom.waitForPause()
    cy.matchImageSnapshot('planet-wizard-5-model-output')
  })

  it('subduction', () => {
    cy.visit('/?preset=subduction&playing=false&stopAfter=300')
    cy.waitForSplashscreen()
    cy.waitForSpinner()
    cy.matchImageSnapshot('subduction-1-model-load')
    bottom.getStart().click()
    bottom.waitForPause()
    cy.matchImageSnapshot('subduction-2-after-90mln-years')
  })
})
