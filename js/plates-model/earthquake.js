import { serialize, deserialize } from '../utils'
import config from '../config'
import { random } from '../seedrandom'

export default class Earthquake {
  static shouldCreateEarthquake (field) {
    // There are two cases possible:
    // A. Field is in the subduction zone. Then, the earthquake should be more likely to show up when the subduction
    //    is progressing faster (relative speed between plates is higher)
    if (field.subductingFieldUnderneath) {
      if (random() < field.subductingFieldUnderneath.subduction.relativeVelocity.length() * config.earthquakeInSubductionZoneProbability) {
        return true
      }
    }
    // B. Field is next to the divergent boundary. Then, the earthquake should be more likely to show up when the
    //    plate is moving faster and divergent boundary is more visible.
    return field.divergentBoundaryZone && random() < field.linearVelocity.length() * config.earthquakeInDivergentZoneProbability
  }

  constructor (field) {
    // Earthquake can be shallow or deep. Shallow are placed around top plate crust, while deep are placed
    // where two plates are colliding (so we use colliding field elevation as a base).
    const subductingField = field.colliding
    let earthquakeElevation
    if (subductingField) {
      // Subduction zone
      const deep = subductingField && random() < 0.5
      earthquakeElevation = deep ? subductingField.elevation - 0.2 * random() : field.elevation - 0.3 * random()
    } else if (field.normalizedAge < 1) {
      // Divergent boundary
      earthquakeElevation = field.elevation - 0.3 * random()
    }

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
