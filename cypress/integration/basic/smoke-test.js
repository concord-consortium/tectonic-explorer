import PlanetWizard from '../../support/elements/planet-wizard'
import TopContainer from '../../support/elements/top-container'
import BottomContainer from '../../support/elements/bottom-container'

// Smoke test for Tectonic Explorer

context('Smoke Test', () => {
  before(function () {
    cy.visit('/?planetWizard=true')
    cy.waitForSplashscreen()
  })

  context('Loading screen and initialization of app', () => {
    it('Makes sure splash screen renders and disappears', () => {
      cy.waitForSplashscreen()
    })
    it('verifies the logo', () => {
      BottomContainer.getBigLogo()
        .should('exist')
        .and('be.visible')
    })
    it('verifies refresh', () => {
      TopContainer.getRefresh()
        .should('be.visible')
      PlanetWizard.getAllPlateNumOptions()
        .children()
        .should('have.length', 5)
      PlanetWizard.getPlateNumOption('2')
        .should('be.visible')
        .click({ force: true })
      PlanetWizard.getAllPlateNumOptions()
        .should('not.exist')
      cy.waitForSpinner()
      TopContainer.getRefresh()
        .should('be.visible')
        .click({ force: true })
      cy.waitForSpinner()
      PlanetWizard.getPlateNumOption('3')
        .should('exist')
        .and('be.visible')
    })

    it('verifies share', () => {
      TopContainer.getShare()
        .should('be.visible')
        .and('contain', 'Share')
        .click({ force: true })
      cy.waitForSpinner()
      cy.get('[data-react-toolbox=dialog]').get('[data-react-toolbox=button]')
        .should('contain', 'copy link')
        .should('contain', 'copy html')
        .should('contain', 'close')
      cy.get('[data-react-toolbox=dialog]').get('[data-react-toolbox=button]').eq(2)
        .click({ force: true })
    })

    it('verifies about', () => {
      TopContainer.getAbout()
        .should('be.visible')
        .and('contain', 'About')
        .click({ force: true })
      cy.get('section')
        .should('contain', 'About: Tectonic Explorer')
        .and('contain', 'Piotr Janik')
      cy.get('body')
        .click('left')
    })
    it('verifies 4 step labels', () => {
      BottomContainer.getStep('1')
        .should('contain', 'Select layout of the planet')
      BottomContainer.getStep('2')
        .should('contain', 'Draw continents')
      BottomContainer.getStep('3')
        .should('contain', 'Assign forces to plates')
      BottomContainer.getStep('4')
        .should('contain', 'Order plates')
    })
  })

  context('Step 1', () => {
    it('checks step 1 options are accurately represented', () => {
      TopContainer.getRefresh()
        .should('be.visible')
        .click({ force: true })
      cy.waitForSpinner()
      cy.get('canvas').should('be.visible')
      cy.waitForSpinner()
      BottomContainer.getStep('1')
        .find('span.active')
        .should('be.visible')
      PlanetWizard.getColorKey()
        .should('exist')
        .and('be.visible')
        .and('have.length', 1)
      BottomContainer.getBackButton()
        .should('have.attr', 'disabled')
      PlanetWizard.getTimeDisplay()
        .contains('0 million years')
    })
    it('selects number of plates for model, user directed to step 2', () => {
      PlanetWizard.getPlateNumOption('3')
        .click({ force: true })
      cy.waitForSpinner()
      BottomContainer.getStep('2')
        .find('span.active')
        .should('be.visible')
    })
    it('Click back, then next to check navigation', () => {
      BottomContainer.getBackButton()
        .should('not.have.attr', 'disabled')
      BottomContainer.getBackButton()
        .click({ force: true })
      BottomContainer.getStep('1')
        .find('span.active')
        .should('be.visible')
      PlanetWizard.getPlateNumOption('3')
        .click({ force: true })
      cy.waitForSpinner()
    })
  })

  context('Step 2', () => {
    it('checks step 2 conditions are accurately represented', () => {
      TopContainer.getInteractionSelector('Draw continents')
        .should('be.visible')
      TopContainer.getInteractionSelector('Erase continents')
        .should('be.visible')
      TopContainer.getInteractionSelector('Rotate camera')
        .should('be.visible')
      BottomContainer.getStep('1')
        .find('span.done')
        .should('be.visible')
      BottomContainer.getStep('2')
        .find('span.active')
        .should('be.visible')
    })
    it('rotates the camera and resets planet orientation', () => {
      TopContainer.getResetCameraOrientation()
        .should('not.exist')
      TopContainer.getInteractionSelector('Rotate camera')
        .should('be.visible')
        .click({ force: true })
      cy.mainCanvasDrag([
        { x: 850, y: 500 },
        { x: 800, y: 500 }
      ])
      TopContainer.getResetCameraOrientation()
        .should('exist')
        .and('be.visible')
        .click({ force: true })
      BottomContainer.getNextButton()
        .click({ force: true })
    })
  })

  context('Step 3', () => {
    it('checks step 3 conditions are correctly represented', () => {
      TopContainer.getInteractionSelector('Draw force vectors')
        .should('be.visible')
        .and('exist')
      BottomContainer.getStep('1')
        .find('span.done')
        .should('be.visible')
      BottomContainer.getStep('2')
        .find('span.done')
        .should('be.visible')
      BottomContainer.getStep('3')
        .find('span.active')
        .should('be.visible')
    })
    it('skips to next page', () => {
      BottomContainer.getNextButton()
        .click({ force: true })
    })
  })

  context('Step 4', () => {
    it('checks step 4 conditions are correctly represented', () => {
      PlanetWizard.getAllPlanetDensityOptions()
        .should('have.length', 3)
      PlanetWizard.getColorKey()
        .should('exist')
        .and('be.visible')
      BottomContainer.getStep('1')
        .find('span.done')
        .should('be.visible')
      BottomContainer.getStep('2')
        .find('span.done')
        .should('be.visible')
      BottomContainer.getStep('3')
        .find('span.done')
        .should('be.visible')
      BottomContainer.getStep('4')
        .find('span.active')
        .should('be.visible')
    })
    it('rearranges the density order', () => {
      // Add in test case
    })
    it('clicks finish', () => {
      BottomContainer.getFinishButton().eq(1)
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
