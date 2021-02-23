import PlateStore from "./plate-store";
import { observable, computed, makeObservable } from "mobx";

// 1 step is 0.3 million of years.
const STEP_TO_M_OF_YEARS_RATIO = 0.3;

export default class ModelStore {
  @observable stepIdx = 0
  @observable platesMap = new Map()
  @observable fieldMarkers = []

  constructor () {
    makeObservable(this);
  }

  @computed get plates () {
    return Array.from(this.platesMap.values());
  }

  @computed get sortedPlates () {
    return this.plates.sort((a, b) => a.density - b.density);
  }

  // Time in million of years.
  get time () {
    return Math.round(this.stepIdx * STEP_TO_M_OF_YEARS_RATIO);
  }

  getPlate (id: any) {
    return this.platesMap.get(id);
  }

  topFieldAt (position: any) {
    for (let i = 0, len = this.sortedPlates.length; i < len; i++) {
      // Plates are sorted by density, start from the top one.
      const plate = this.sortedPlates[i];
      const field = plate.fieldAtAbsolutePos(position);
      if (field) {
        return field;
      }
    }
    return null;
  }

  handleDataFromWorker (data: any) {
    this.stepIdx = data.stepIdx;
    this.fieldMarkers = data.fieldMarkers;
    const platePresent: Record<string, boolean> = {};
    data.plates.forEach((plateData: any) => {
      platePresent[plateData.id] = true;
      let plateStore = this.platesMap.get(plateData.id);
      if (!plateStore) {
        plateStore = new PlateStore(plateData.id);
        plateStore.handleDataFromWorker(plateData);
        this.platesMap.set(plateData.id, plateStore);
      } else {
        plateStore.handleDataFromWorker(plateData);
      }
    });
    // Remove old plates
    this.platesMap.forEach(plateStore => {
      if (!platePresent[plateStore.id]) {
        this.platesMap.delete(plateStore.id);
      }
    });
  }
}
