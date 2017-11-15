import { serialize, deserialize } from '../utils'
import markIslands from './mark-islands'

// Max time that given field can undergo volcanic activity.
const MAX_DEFORMING_TIME = 15 // s

// Set of properties related to volcanic activity. Used by Field instances.
export default class VolcanicActivity {
  constructor (field) {
    this.field = field
    this.value = 0 // [0, 1]
    this.speed = 0
    // When field undergoes volcanic activity, this attribute is going lower and lower
    // and at some point field will be "frozen" won't be able to undergo any more processes.
    // It ensures that mountains don't grow too big and there's some variation between fields.
    this.deformingCapacity = MAX_DEFORMING_TIME
  }

  get serializableProps () {
    // .speed is reset at the end of each simulation step.
    return [ 'value', 'deformingCapacity' ]
  }

  serialize () {
    return serialize(this)
  }

  static deserialize (props, field) {
    return deserialize(new VolcanicActivity(field), props)
  }

  get active () {
    return this.speed > 0 && this.deformingCapacity > 0
  }

  get islandProbability () {
    if (!this.active) return 0
    return this.value / 40
  }

  setCollision (field) {
    // Volcanic activity is the strongest in the middle of subduction distance / progress.
    let r = field.subduction.progress // [0, 1]
    if (r > 0.5) r = 1 - r
    // Magic number 0.43 ensures that volcanoes get visible enough. If it's lower, they don't grow enough,
    // if it's bigger, they get too big and too similar to each other.
    r = r / (MAX_DEFORMING_TIME * 0.43)
    this.speed = r
  }

  resetCollision () {
    // Needs to be reactivated during next collision.
    this.speed = 0
  }

  update (timestep) {
    if (!this.active) {
      this.resetCollision()
      return
    }

    this.value += this.speed * timestep
    if (this.value > 1) {
      this.value = 1
    }

    if (this.field.isOcean && Math.random() < this.islandProbability * timestep) {
      this.field.type = 'island'
      // Make sure that this is still an island. If it's placed next to other islands, their total area
      // might exceed maximal area of the island and we should treat it as a continent.
      markIslands(this.field)
    }

    this.deformingCapacity -= timestep

    this.resetCollision()
  }
}
