// Smoke test for Tectonic Explorer

// Helper function to convert RGB color values to HSL
// This makes color tests much easier
function rgbToHsl (r, g, b) {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = (max + min) / 2
  let s = (max + min) / 2
  let l = (max + min) / 2

  if (max === min) {
    h = s = 0
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g: h = (b - r) / d + 2
        break
      case b: h = (r - g) / d + 4
        break
    }
    h /= 6
  }
  return [ h, s, l ]
}

context('Canvas Test', () => {
  before(function () {
    cy.visit('/?preset=subduction&stopAfter=1')
    cy.waitForSplashscreen()
    cy.waitForSpinner()
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

            const hsl = rgbToHsl(r, g, b)
            const hue = hsl[0]

            let result = ''
            if (hue > 0.45 && hue < 0.65) {
              result = 'ocean'
            } else if (hue > 0.2 && hue < 0.44) {
              result = 'land'
            } else if (hue < 0.1) {
            // black
              result = 'space'
            } else {
              result = '' + hue
            }
            return result
          }

          // canvas center points
          const cx = cv2d.width / 2
          const cy = cv2d.height / 2

          // Corner of map should be black
          expect(getColor(50, 50)).to.eq('space')
          // since we might be on a retina display, pixel values are less useful
          // but "a little bit right-of-center" in this case should find the landmass
          expect(getColor(cx + 200, cy)).to.eq('land')
          // Left from center should be ocean
          expect(getColor(cx - 200, cy)).to.eq('ocean')
        })
    })
  })
})
