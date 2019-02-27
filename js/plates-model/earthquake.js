import { serialize, deserialize } from '../utils'
import config from '../config'
import { random } from '../seedrandom'

const MIN_DEPTH = 0.05

export default class Earthquake {
  static shouldCreateEarthquake (field) {
    // There are two cases possible:
    // A. Field is in the subduction zone. Then, the earthquake should be more likely to show up when the subduction
    //    is progressing faster (relative speed between plates is higher). Also, don't show earthquakes at the beginning
    //    of the subduction zone, as that's likely to be a trench and it wouldn't look good in the cross-section.
    if (field.subductingFieldUnderneath && field.subductingFieldUnderneath.subduction.progress > 0.15) {
      return random() < field.subductingFieldUnderneath.subduction.relativeVelocity.length() * config.earthquakeInSubductionZoneProbability * config.timestep
    }
    // B. Field is next to the divergent boundary. Then, the earthquake should be more likely to show up when the
    //    plate is moving faster and divergent boundary is more visible.
    if (field.divergentBoundaryZone) {
      return random() < field.linearVelocity.length() * config.earthquakeInDivergentZoneProbability * config.timestep
    }
    return false
  }

  constructor (field) {
    // Earthquake can be shallow or deep. Shallow are placed around top plate crust, while deep are placed
    // where two plates are colliding (so we use colliding field elevation as a base).
    const subductingField = field.subductingFieldUnderneath
    if (subductingField) {
      // Subduction zone
      // Earthquakes can be "shallow" or "deep". Shallow earthquake take place in the lithosphere of the top plate.
      // "Deep" earthquakes take place around lithosphere of the subducting plate, so where the collision happens.
      // Earthquakes are always attached to the top plate, as that's where they are felt and registered. That makes
      // visualization better too, as earthquakes won't be moving together with the subducting plate.
      const deep = subductingField && random() < 0.5
      const baseField = deep ? subductingField : field
      const availableRange = baseField.crustThickness + baseField.lithosphereThickness - MIN_DEPTH
      const earthquakeElevation = baseField.elevation - MIN_DEPTH - random() * availableRange
      this.depth = field.elevation - earthquakeElevation
    } else if (field.normalizedAge < 1) {
      // Divergent boundary, only shallow earthquakes.
      this.depth = MIN_DEPTH + random() * (field.crustThickness + field.lithosphereThickness - MIN_DEPTH)
    }
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
