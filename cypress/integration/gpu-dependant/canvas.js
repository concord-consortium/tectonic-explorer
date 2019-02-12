// Smoke test for Tectonic Explorer

context('Canvas Test', () => {
  before(function () {
    cy.visit('/?planetWizard=true')
    cy.wait(3000)
  })

  context('Set up same as smoke test to draw a small continent', () => {
    it('Draws a small land mass on the planet', () => {
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
    it('Gets the color of pixels at different locations', () => {
      cy.get('.planet-view .canvas-3d')
        .then((canvas3d) => {
          const cv3d = canvas3d.get(0)
          const cv2d = document.createElement('canvas')
          const ctx2d = cv2d.getContext('2d')
          const ctx3d = cv3d.getContext('webgl', { preserveDrawingBuffer: true })
          ctx3d.canvas.render()
          cv2d.width = cv3d.width
          cv2d.height = cv3d.height

          ctx2d.drawImage(ctx3d.canvas, 0, 0)

          const getColor = (px, py) => {
            const pixel = ctx2d.getImageData(px, py, 1, 1)

            const r = pixel.data[0]
            const g = pixel.data[1]
            const b = pixel.data[2]

            let result = ''
            if (r > 30 && r < 60 && g > 100 && g < 150 && b > 140 && b < 215) {
              // low red, mid green, high blue
              result = 'ocean'
            } else if (r > 200 && r < 230 && g > 65 && g < 80 && b > 135 && b < 160) {
              // magenta
              result = 'border'
            } else if (r > 160 && r < 220 && g > 200 && g < 255 && b > 140 && b < 180) {
              // mid-high red, high green, mid blue
              result = 'land'
            } else if (r > 160 && r < 220 && g > 200 && g < 255 && b > 180 && b < 255) {
              // mid-high red, high green, high blue
              result = 'land' // technically it's coast, using "land" as "not sea"
            } else if (r === 0 && g === 0 && b === 0) {
              // black
              result = 'space'
            } else {
              result = '' + r + ',' + g + ',' + b
            }
            return result
          }

          // canvas center points
          const cx = cv2d.width / 2
          const cy = cv2d.height / 2

          // Corner of map should be black
          expect(getColor(50, 50)).to.eq('space')
          // Dead center will be the plate boundary line and could be a gap
          expect(getColor(cx, cy)).to.eq('border')
          // since we might be on a retina display, pixel values are less useful
          // but "a little bit left-of-center" in this case should find the land we created earlier
          expect(getColor(cx - 20, cy)).to.eq('land')
          // Further from center, beyond the land, should be ocean
          expect(getColor(cx - (cx / 4), cy)).to.eq('ocean')
        })
    })
  })
})
