// Smoke test for Tectonic Explorer

context('Canvas Test', () => {
  before(function () {
    cy.visit('/?planetWizard=true')
    cy.wait(3000)
  })

  context('Loading screen and initialization of app', () => {
    it('drags and disorients the planet', () => {
      cy.get('.planet-wizard-overlay > :nth-child(1)').click()
      // cy.get('.interaction-selector > :nth-child(3)').click()
      cy.wait(7000)
      cy.get('canvas').eq(1)
        .trigger('mousedown', { force: true }, { which: 1, pageX: 500, pageY: 300 })
        .trigger('mousemove', { force: true }, { which: 1, pageX: 350, pageY: 350 })
        .trigger('mouseup', { force: true })
    })

  })

  context('Canvas Check', () => {
    it('Gets the color of a pixel', () => {

      cy.get('.planet-view .canvas-3d')
        .then((canvas3d) => {
          console.log(canvas3d);
          console.log(typeof (canvas3d));
          // const canvas2d = document.createElement("canvas")
          // const ctx2d = canvas2d.getContext("2d");
          // const ctx3d = canvas3d.getContext("webgl", { preserveDrawingBuffer: true });
          // ctx3d.canvas.render();

          // canvas2d.width = canvas3d.width
          // canvas2d.height = canvas3d.height

          // const img = canvas2d.getContext("2d").drawImage(canvas3d, 0, 0)
          // console.log(img);
          // return img;
        })

    })

  })
})
