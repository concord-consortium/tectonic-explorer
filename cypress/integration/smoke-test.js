import PlanetWizard from '../support/elements/planet-wizard'
import TopContainer from '../support/elements/top-container'
import BottomContainer from '../support/elements/bottom-container'

// Smoke test for Tectonic Explorer

context('Smoke Test', () => {
  before(function () {
    cy.visit('/?planetWizard=true')
    cy.wait(3000)
  })

  let bottom = new BottomContainer()
  let top = new TopContainer()
  let planetWizard = new PlanetWizard()

  context('Loading screen and initialization of app', () => {
    it('Makes sure splash screen renders before page loads', () => {
      // check splashscreen shows up
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
      planetWizard.getAllPlateNumOptions()
        .should('exist')
        .and('be.visible')
    })
    it('verifies share', () => {
      top.getShare()
        .should('be.visible')
        .and('contain', 'Share')
        .click({ force: true })
      cy.get('.theme--navigation--wgwdjjmM > :nth-child(1)')
        .should('contain', 'COPY LINK')
      cy.get('.theme--navigation--wgwdjjmM > :nth-child(2)')
        .should('contain', 'COPY HTML')
      cy.get('.theme--navigation--wgwdjjmM > :nth-child(3)')
        .should('contain', 'CLOSE')
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
    })
    it('verifies 4 step labels', () => {
      bottom.getStep(1)
        .should('contain', 'Select layout of the planet')
      bottom.getStep(2)
        .should('contain', 'Draw continents')
      bottom.getStep(3)
        .should('contain', 'Assign force to plates')
      bottom.getStep(4)
        .should('contain', 'Order plates')
    })
  })

  context('Step 1', () => {
    it('checks step 1 options are accurately represented', () => {
      cy.get('canvas').should('be.visible')
      bottom.getStep('1')
        .should('have.class', 'active')
      planetWizard.getColorKey()
        .should('exist')
        .and('be.visible')
        .and('have.length', 1)
      bottom.getBackButton()
        .should('have.attr', 'disabled')
      planetWizard.getTimeDisplay()
        .contains('0 Million Years')
    })
    it('selects number of plates for model, user directed to step 2', () => {
      planetWizard.getAllPlateNumOptions('3')
        .click({ force: true })
      bottom.getStep('2')
        .should('have.class', 'active')
    })
    it('verifies number of plates selected is accurately represented in model', () => {
      // screenshot to verify that the correct option is shown in canvas
    })
    it('Click back, then next to check navigation', () => {
      bottom.getBackButton()
        .should('be.visible')
        .and('not.have.attr', 'disabled')
        .click({ force: true })
      bottom.getStep('1')
        .should('have.class', 'active')
      planetWizard.getAllPlateNumOptions('3')
        .click({ force: true })
    })
  })

  context('Step 2', () => {
    it('checks step 2 conditions are accurately represented', () => {
      top.getDrawContinents()
        .should('be.visible')
        .and('exist')
      top.getEraseContinents()
        .should('be.visible')
        .and('exist')
      top.getRotateCamera()
        .should('be.visible')
        .and('exist')
      bottom.getStep('1')
        .find('span.done')
        .should('be.visible')
      bottom.getStep('2')
        .find('span.active')
        .should('be.visible')
    })
    it('draws a continent', () => {
      top.getDrawContinents()
        .should('be.visible')
        .click({ force: true })
      // drag and drop
      // screenshot comparison
    })
    it('erases some of a continent', () => {
      top.getEraseContinents()
        .should('be.visible')
        .click({ force: true })
    // drag and drop
    // screenshot comparison
    })
    it('rotates the camera and resets planet orientation', () => {
      top.getResetCameraOrientation()
        .should('not.exist')
      top.getRotateCamera()
        .should('be.visible')
        .click({ force: true })
      // drag and drop
      // screenshot
      top.getResetCameraOrientation()
        .should('exist')
        .and('be.visible')
      // screenshot comparison
    })
  })

  context('Step 3', () => {
    it('checks step 3 conditions are correctly represented', () => {
      top.getDrawForceVector()
        .should('be.visible')
        .and('exist')
      top.getResetCameraOrientation()
        .should('be.visible')
        .and('exist')
      bottom.getStep('1')
        .find('span.done')
        .should('be.visible')
      bottom.getStep('2')
        .find('step.done')
        .should('be.visible')
      bottom.getStep('3')
        .find('span.active')
        .should('be.visible')
    })
    it('adds forces to the plates', () => {
      // drag and drop
      // screenshot comparison
    })
  })

  context('Step 4', () => {
    it('checks step 4 conditions are correctly represented', () => {
      planetWizard.getAllPlanetDensityOptions()
        .should('have.length', 3)
      planetWizard.getColorKey()
        .should('exist')
        .and('be.visible')
        .and('have.length', 2)
      bottom.getStep('1')
        .find('span.done')
        .should('be.visible')
      bottom.getStep('2')
        .find('step.done')
        .should('be.visible')
      bottom.getStep('3')
        .find('span.done')
        .should('be.visible')
      bottom.getStep('4')
        .find('span.active')
        .should('be.visible')
    })
    it('rearrange planet order density', () => {
      // drag and drop
      // screenshot
    })
    it('verifies that opposing force vectors create water separation', () => {
      // screenshot
    })
    it('clicks finish', () => {
      bottom.getFinishButton()
        .click({ force: true })
    })
  })

  context('Model Interaction', () => {
    it('turns all map configs on except for wireframe', () => {
      // screenshot
      // I should check that invoking the value for scrubber works correctly
    })

    it('checks wireframe congfig', () => {
      // screenshot
    })

    it('share model success and failure', () => {
      // copy code
      // copy link
      // close

    })
  })
})
