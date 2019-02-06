//Smoke test for Tectonic Explorer

context('Smoke Test', () => {

  before(function () {
    cy.visit('/?planetWizard=true')
  })

  context('Loading screen and initialization of app', () => {
    it('Makes sure splash screen renders before page loads', () => {
      //check splashscreen shows up
    })
    it('verifies the logo', () => {
      //check logo visibility
    })
    it('verifies refresh', () => {
      //check visibility
      //click plate num option
      //refresh page
      //check for plate num options
    })
    it('verifies share', () => {
      //checks visibility
      //clicks share
      //check for title "Share: Tectonic Explorer"
      //check for link and html are present
      //click close
    })
    it('verifies about', () => {
      //verifies visibility
      //clicks about
      //checks for title About: Tectonic Explorer
    })
    it('verifies 4 step labels', () => {
      //checks all 4 titles in bottom pannel
      //Select layout, Draw continents, Assign force, Order plates
    })
    it('verifies next and back labels', () => {
      //checks for back label
      //check for next label
    })
  });

  context('Step 1', () => {
    it('checks step 1 options are accurately represented', () => {
      //5 options for plates
      //canvas visible
      //Step one highlighted, 4 steps visible
      //color key is visible
      //back and next options are disabled
      //checks time presentation at 0 million years
    })
    it('verifies number of plates selected is accurately represented in model', () => {
      //select an option
      //screenshot to verify that the correct option is shown in canvas
    })
    it('Click back then next to check navigation', () => {
      //click back then next
      //screenshot should be the same as the previous screenshot
    })
  });

  context('Step 2', () => {
    it('checks step 1 conditions are accurately represented', () => {
      //
    })
    it('draws a continent', () => {
      //cursor should be defaulted to draw continents cross-hair (highlighted)
      //drag and drop to draw image on canvas
      //screenshot and verify image showed up correctly
    })
    it('erases a continent', () => {
      //select the erase continent option (should then be highlighted)
      //use same coordinates to erase
      //screenshot should show no continent
    })
    it('rotates the camera and resets planet orientation', () => {
      //click off the planet and drag in order to move planet orientation
      //check that the 'reset camera button' is now visible
      //screenshot that it changed
      //
    })
    it('checks that key is visible', () => {
      //check key
    })
    it('adds forces to the plates', () => {
     //click and drag
     //verify arroy remains on canvas
     //only arrow one per plate
    })
    it('rearrange planet order density', () => {
      //select by order from top to bottom ('1-5')
      //all should be visible
      //rearrange
    })
    it('resets the planet density orientation', () => {
      //
    })

    it('returns to step 2, erases continents, prompts to draw again', () => {
      //
    })

    it('verifies that opposing force vectors create water separation', () => {
      //screenshot
    })

    it('turns all map configs on except for wireframe', () => {
      //screenshot
    })

    it('checks wireframe congfig', () => {
      //screenshot
    })

    it('share model success and failure', () => {
     //copy code
     //copy link
     //close
    })
  })
})
