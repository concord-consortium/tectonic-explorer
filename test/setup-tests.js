import { configure } from 'enzyme'
import Adapter from 'enzyme-adapter-react-15'
import path from 'path'
import getPixels from 'get-pixels'

// see http://airbnb.io/enzyme/docs/installation/index.html
configure({ adapter: new Adapter() })

// Helper function that returns test model image data.
global.getModelImage = (file = 'testModel.png', done) => {
  getPixels(path.join(__dirname, file), (err, pixels) => {
    if (err) {
      throw new Error('getModelImage failed: ', file)
    }
    done({
      data: pixels.data,
      width: pixels.shape[0],
      height: pixels.shape[1]
    })
  })
}
