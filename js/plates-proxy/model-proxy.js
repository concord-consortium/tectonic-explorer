import PlateProxy from './plate-proxy'

// 1 step is 0.3 million of years.
const STEP_TO_M_OF_YEARS_RATIO = 0.3

export default class ModelProxy {
  constructor () {
    this.stepIdx = 0
    this.plateById = new Map()
    this.plates = []
  }

  // Time in million of years.
  get time () {
    return Math.round(this.stepIdx * STEP_TO_M_OF_YEARS_RATIO)
  }

  handleDataFromWorker (data) {
    this.stepIdx = data.stepIdx
    const platePresent = {}
    this.plates = []
    data.plates.forEach((plateData, idx) => {
      platePresent[plateData.id] = true
      let plateProxy = this.plateById.get(plateData.id)
      if (!plateProxy) {
        plateProxy = new PlateProxy(plateData)
        this.plateById.set(plateData.id, plateProxy)
      } else {
        plateProxy.handleDataFromWorker(plateData)
      }
      this.plates[idx] = plateProxy
    })
    // Remove old plates
    this.plateById.forEach(plateProxy => {
      if (!platePresent[plateProxy.id]) {
        this.plateById.delete(plateProxy.id)
      }
    })
  }
}
