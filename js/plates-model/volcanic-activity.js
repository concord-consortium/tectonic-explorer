// Set of properties related to volcanic activity. Used by Field instances.
export default class VolcanicActivity {
  constructor() {
    this.value = 0; // [0, 1]
    this.speed = 0;
    this.active = false;
  }

  get islandProbability() {
    return this.value / 40;
  }

  update(timestep) {
    this.value += this.speed * timestep;
    if (this.value > 1) {
      this.value = 1;
    }
    // Needs to be reactivated during next collision.
    this.active = false;
    this.speed = 0;
  }
}
