import { serialize, deserialize } from '../utils'
import config from '../config'
import { random } from '../seedrandom'

export default class VolcanicEruption {
  static shouldCreateVolcanicEruption (field) {
    // There are two cases possible:
    // A. Field is in the subduction zone. Then, the volcanic eruption should be more likely to show up when the subduction
    //    is progressing faster (relative speed between plates is higher).
    if (field.risingMagma && field.subductingFieldUnderneath) {
      const p = field.isIsland ? config.volcanicEruptionOnIslandProbability : config.volcanicEruptionOnContinentProbability
      return random() < field.subductingFieldUnderneath.subduction.relativeVelocity.length() * p * config.timestep
    }
    // B. Field is next to the divergent boundary. Then, the volcanic eruption should be more likely to show up when the
    //    plate is moving faster and divergent boundary is more visible.
    if (field.divergentBoundaryVolcanicZone) {
      return random() < field.linearVelocity.length() * config.volcanicEruptionInDivergentZoneProbability * config.timestep
    }
    return false
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
