import PlateStore from './plate-store'
import { observable, computed } from 'mobx'

// 1 step is 0.3 million of years.
const STEP_TO_M_OF_YEARS_RATIO = 0.3

export default class ModelStore {
  @observable stepIdx = 0
  @observable platesMap = new Map()

  @computed get plates () {
    return Array.from(this.platesMap.values())
  }

  // Time in million of years.
  get time () {
    return Math.round(this.stepIdx * STEP_TO_M_OF_YEARS_RATIO)
  }

  getPlate (id) {
    return this.platesMap.get(id)
  }

  handleDataFromWorker (data) {
    this.stepIdx = data.stepIdx
    const platePresent = {}
    data.plates.forEach(plateData => {
      platePresent[plateData.id] = true
      let plateStore = this.platesMap.get(plateData.id)
      if (!plateStore) {
        plateStore = new PlateStore(plateData.id)
        plateStore.handleDataFromWorker(plateData)
        this.platesMap.set(plateData.id, plateStore)
      } else {
        plateStore.handleDataFromWorker(plateData)
      }
    })
    // Remove old plates
    this.platesMap.forEach(plateStore => {
      if (!platePresent[plateStore.id]) {
        this.platesMap.delete(plateStore.id)
      }
    })
  }
}
