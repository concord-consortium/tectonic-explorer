import { serialize, deserialize } from '../utils'
import config from '../config'
import { random } from '../seedrandom'

export default class VolcanicEruption {
  static shouldCreateVolcanicEruption (field) {
    return field.risingMagma && random() < 0.1
  }

  constructor () {
    this.lifespan = config.volcanicEruptionLifespan
  }

  get active () {
    return this.lifespan > 0
  }

  get serializableProps () {
    return [ 'lifespan' ]
  }

  serialize () {
    return serialize(this)
  }

  static deserialize (props) {
    return deserialize(new VolcanicEruption(), props)
  }

  update (timestep) {
    this.lifespan -= timestep
  }
}
