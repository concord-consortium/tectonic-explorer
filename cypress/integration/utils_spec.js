import { rgbToHex } from '../../js/colormaps'

describe('Utilities', function () {
  context('colormaps.js', function() {
    it ('Reads URL parameters', function () {
      expect(rgbToHex({r: .1, g: .2, b: .3})).to.eq(1717069)
    })
  })
})