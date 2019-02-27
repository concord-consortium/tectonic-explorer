import PlanetWizard from '../../support/elements/planet-wizard'
import TopContainer from '../../support/elements/top-container'
import BottomContainer from '../../support/elements/bottom-container'

// Smoke test for Tectonic Explorer

context('Smoke Test', () => {
  before(function () {
    cy.visit('/?planetWizard=true')
    cy.wait(3000)
    cy.waitForSplashscreen()
  })

  let bottom = new BottomContainer()
  let top = new TopContainer()
  let planetWizard = new PlanetWizard()

  context('Loading screen and initialization of app', () => {
    it('Makes sure splash screen renders and disappears', () => {
      cy.waitForSplashscreen()
    })
    it('verifies the logo', () => {
      bottom.getBigLogo()
        .should('exist')
        .and('be.visible')
    })
    it('verifies refresh', () => {
      top.getRefresh()
        .should('be.visible')
      planetWizard.getAllPlateNumOptions()
        .children()
        .should('have.length', 5)
      planetWizard.getPlateNumOption('2')
        .should('be.visible')
        .click({ force: true })
      planetWizard.getAllPlateNumOptions()
        .should('not.exist')
      cy.wait(2000)
      top.getRefresh()
        .should('be.visible')
        .click()
      cy.waitForSplashscreen()
      planetWizard.getPlateNumOption('3')
        .should('exist')
        .and('be.visible')
    })
    it('verifies share', () => {
      top.getShare()
        .should('be.visible')
        .and('contain', 'Share')
        .click({ force: true })
      cy.get('.theme--navigation--wgwdjjmM > :nth-child(1)')
        .should('contain', 'copy link')
      cy.get('.theme--navigation--wgwdjjmM > :nth-child(2)')
        .should('contain', 'copy html')
      cy.get('.theme--navigation--wgwdjjmM > :nth-child(3)')
        .should('contain', 'close')
        .click({ force: true })
    })
    it('verifies about', () => {
      top.getAbout()
        .should('be.visible')
        .and('contain', 'About')
        .click({ force: true })
      cy.get('section')
        .should('contain', 'About: Tectonic Explorer')
        .and('contain', 'Piotr Janik')
      cy.get('body')
        .click('left')
      cy.wait(3000)
    })
    it('verifies 4 step labels', () => {
      bottom.getStep('1')
        .should('contain', 'Select layout of the planet')
      bottom.getStep('2')
        .should('contain', 'Draw continents')
      bottom.getStep('3')
        .should('contain', 'Assign forces to plates')
      bottom.getStep('4')
        .should('contain', 'Order plates')
    })
  })

  context('Step 1', () => {
    it('checks step 1 options are accurately represented', () => {
      cy.get('canvas').should('be.visible')
      bottom.getStep('1')
        .find('span.active')
        .should('be.visible')
      planetWizard.getColorKey()
        .should('exist')
        .and('be.visible')
        .and('have.length', 1)
      bottom.getBackButton()
        .should('have.attr', 'disabled')
      planetWizard.getTimeDisplay()
        .contains('0 million years')
    })
    it('selects number of plates for model, user directed to step 2', () => {
      planetWizard.getPlateNumOption('3')
        .click({ force: true })
      cy.waitForSpinner()
      bottom.getStep('2')
        .find('span.active')
        .should('be.visible')
    })
    it('Click back, then next to check navigation', () => {
      bottom.getBackButton()
        .should('not.have.attr', 'disabled')
      bottom.getBackButton()
        .click({ force: true })
      bottom.getStep('1')
        .find('span.active')
        .should('be.visible')
      planetWizard.getPlateNumOption('3')
        .click({ force: true })
      cy.waitForSpinner()
    })
  })

  context('Step 2', () => {
    it('checks step 2 conditions are accurately represented', () => {
      top.getInteractionSelector('Draw continents')
        .should('be.visible')
      top.getInteractionSelector('Erase continents')
        .should('be.visible')
      top.getInteractionSelector('Rotate camera')
        .should('be.visible')
      bottom.getStep('1')
        .find('span.done')
        .should('be.visible')
      bottom.getStep('2')
        .find('span.active')
        .should('be.visible')
    })
    it('rotates the camera and resets planet orientation', () => {
      top.getResetCameraOrientation()
        .should('not.exist')
      top.getInteractionSelector('Rotate camera')
        .should('be.visible')
        .click({ force: true })
      cy.mainCanvasDrag([
        { x: 850, y: 500 },
        { x: 800, y: 500 }
      ])
      top.getResetCameraOrientation()
        .should('exist')
        .and('be.visible')
        .click({ force: true })
      bottom.getNextButton()
        .click({ force: true })
    })
  })

  context('Step 3', () => {
    it('checks step 3 conditions are correctly represented', () => {
      top.getInteractionSelector('Draw force vectors')
        .should('be.visible')
        .and('exist')
      bottom.getStep('1')
        .find('span.done')
        .should('be.visible')
      bottom.getStep('2')
        .find('span.done')
        .should('be.visible')
      bottom.getStep('3')
        .find('span.active')
        .should('be.visible')
    })
    it('skips to next page', () => {
      bottom.getNextButton()
        .click({ force: true })
    })
  })

  context('Step 4', () => {
    it('checks step 4 conditions are correctly represented', () => {
      planetWizard.getAllPlanetDensityOptions()
        .should('have.length', 3)
      planetWizard.getColorKey()
        .should('exist')
        .and('be.visible')
      bottom.getStep('1')
        .find('span.done')
        .should('be.visible')
      bottom.getStep('2')
        .find('span.done')
        .should('be.visible')
      bottom.getStep('3')
        .find('span.done')
        .should('be.visible')
      bottom.getStep('4')
        .find('span.active')
        .should('be.visible')
    })
    it('rearranges the density order', () => {
      // Add in test case
    })
    it('clicks finish', () => {
      bottom.getFinishButton().eq(1)
        .click({ force: true })
    })
  })

  context('Model Interaction', () => {
    it('turns all map configs on except for wireframe', () => {
      // tests located in bottom-bar.js test file
    })

    it('share model success and failure', () => {
      // copy code
      // copy link
      // close
    })
  })
})
