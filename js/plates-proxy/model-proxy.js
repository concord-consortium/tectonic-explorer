import PlateProxy from './plate-proxy'

export default class ModelProxy {
  constructor () {
    this.stepIdx = 0
    this.plateById = new Map()
    this.plates = []
  }

  handleDataFromWorker (data) {
    this.stepIdx = data.stepIdx

    this.plates.length = 0
    data.plates.forEach((plateData, idx) => {
      let plateProxy = this.plateById.get(plateData.id)
      if (!plateProxy) {
        plateProxy = new PlateProxy(plateData)
        this.plateById.set(plateData.id, plateProxy)
      } else {
        plateProxy.handleDataFromWorker(plateData)
      }
      this.plates[idx] = plateProxy
    })
  }
}
