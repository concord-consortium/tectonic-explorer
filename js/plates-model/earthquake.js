import { serialize, deserialize } from '../utils'
import config from '../config'
import { random } from '../seedrandom'

export default class Earthquake {
  constructor (field) {
    // Earthquake can be shallow or deep. Shallow are placed around top plate crust, while deep are placed
    // where two plates are colliding (so we use colliding field elevation as a base).
    const subductingField = field.colliding
    const deep = subductingField && random() < 0.5
    const earthquakeElevation = deep ? subductingField.elevation - 0.2 * random() : field.elevation - 0.3 * random()

    this.depth = field.elevation - earthquakeElevation
    this.magnitude = random() * 9
    this.lifespan = config.earthquakeLifespan
  }

  get active () {
    return this.lifespan > 0
  }

  get serializableProps () {
    return [ 'magnitude', 'depth', 'lifespan' ]
  }

  serialize () {
    return serialize(this)
  }

  static deserialize (props, field) {
    return deserialize(new Earthquake(field), props)
  }

  update (timestep) {
    this.lifespan -= timestep
  }
}
