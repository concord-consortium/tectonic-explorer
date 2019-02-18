import { configure } from 'enzyme'
import Adapter from 'enzyme-adapter-react-15'
import config from '../js/config'

// see http://airbnb.io/enzyme/docs/installation/index.html
configure({ adapter: new Adapter() })

const originalConfig = Object.assign({}, config)
global.resetConfig = () => {
  // Restore config as it can be modified by tests.
  Object.assign(config, originalConfig)
  Object.keys(config).forEach(key => {
    if (originalConfig[key] === undefined) {
      delete config[key]
    }
  })
}
