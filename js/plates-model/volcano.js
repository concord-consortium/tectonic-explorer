import { serialize, deserialize } from '../utils'
import config from '../config'
import { random } from '../seedrandom'

export default class Volcano {
  static shouldCreateVolcano (field) {
    if (field.risingMagma && random() < 0.1) {
      return true
    } else {
      return false
    }
  }

  constructor (field) {
    this.lifespan = config.volcanoLifespan
    this.eruption = true
  }

  get active () {
    this.eruption = this.lifespan > 0
    return this.eruption
  }

  get serializableProps () {
    return [ 'eruption' ]
  }

  serialize () {
    return serialize(this)
  }

  static deserialize (props, field) {
    return deserialize(new Volcano(field), props)
  }

  update (timestep) {
    this.lifespan -= timestep
  }
}
