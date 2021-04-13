import { BASE_OCEANIC_CRUST_THICKNESS, FieldType } from "./field";

// Do not use automatic enum values, as if we ever remove one rock type, other values shouldn't change.
// It would break deserialization of the previously saved models.
export enum Rock {
  OceanicSediment = 0,
  ContinentalSediment = 1,
  Granite = 2,
  Basalt = 3,
  Gabbro = 4,
  Rhyolite = 5,
  Andesite = 6,
  Diorite = 7,
}

// Labels used in UI.
export const ROCK_LABEL: Record<Rock, string> = {
  [Rock.Granite]: "Granite",
  [Rock.Basalt]: "Basalt",
  [Rock.Gabbro]: "Gabbro",
  [Rock.Rhyolite]: "Rhyolite",
  [Rock.Andesite]: "Andesite",
  [Rock.Diorite]: "Diorite",
  [Rock.OceanicSediment]: "Oceanic Sediment",
  [Rock.ContinentalSediment]: "Continental Sediment"
};

export interface IRockLayer { 
  rock: Rock; 
  thickness: number; // model units, meaningless
  folding: number; // if value is > 0, its effective thickness will equal to: thickness * (1 + folding)
}

export interface ISerializedCrust {
  // Format of rock layers is destructed to arrays as it should take much less space when serialized to JSON.
  rockLayers: {
    rock: Rock[],
    thickness: number[],
    folding: number[]
  }
}

export function rockLayerFinalThickness(rockLayer: IRockLayer | null | undefined) {
  return rockLayer ? rockLayer.thickness * (1 + rockLayer.folding) : 0;
}

export const MAX_REGULAR_SEDIMENT_THICKNESS = 0.1 * BASE_OCEANIC_CRUST_THICKNESS;
export const MAX_WEDGE_SEDIMENT_THICKNESS = 6 * MAX_REGULAR_SEDIMENT_THICKNESS;
export const MIN_LAYER_THICKNESS = 0.02 * BASE_OCEANIC_CRUST_THICKNESS;

// This constant will decide how deep are the mountain roots.
export const CRUST_THICKNESS_TO_ELEVATION_RATIO = 0.5;

export default class Crust {
  // Rock layers, ordered from the top to the bottom (of the crust).
  rockLayers: IRockLayer[] = [];

  constructor(fieldType?: FieldType, thickness?: number, withSediments = true) {
    if (fieldType) {
      this.setInitialRockLayers(fieldType, thickness || 0, withSediments);
    }
  }

  get thickness() {
    let result = 0;
    for (const layer of this.rockLayers) {
      result += rockLayerFinalThickness(layer);
    }
    return result;
  }

  get topRockType() {
    // Fallback to Rock.OceanicSediment is pretty random. It should never happen, but just in case and to make TypeScript happy.
    return this.rockLayers[0]?.rock || Rock.OceanicSediment;
  }

  get hasOceanicRocks() {
    return this.getLayer(Rock.Basalt) !== null || this.getLayer(Rock.Gabbro) !== null;
  }

  get hasContinentalRocks() {
    return this.getLayer(Rock.Granite) !== null;
  }

  thicknessAboveZeroElevation() {
    let result = 0;
    for (const layer of this.rockLayers) {
      result += rockLayerFinalThickness(layer) * (layer.rock !== Rock.OceanicSediment ? CRUST_THICKNESS_TO_ELEVATION_RATIO : 1);
    }
    return result;
  }

  setThickness(value: number) {
    const ratio = value / this.thickness;
    for (const layer of this.rockLayers) {
      layer.thickness *= ratio;
    }
  }

  serialize(): ISerializedCrust {
    const result: ISerializedCrust = {
      rockLayers: {
        rock: [],
        thickness: [],
        folding: []
      }
    };
    for (const layer of this.rockLayers) {
      result.rockLayers.rock.push(layer.rock);
      result.rockLayers.thickness.push(layer.thickness);
      result.rockLayers.folding.push(layer.folding);
    }
    return result;
  }

  static deserialize(props: ISerializedCrust): Crust {
    const crust = new Crust();
    const len = props.rockLayers.rock.length;
    for (let i = 0; i < len; i += 1) {
      crust.rockLayers.push({ 
        rock: props.rockLayers.rock[i],
        thickness: props.rockLayers.thickness[i],
        folding: props.rockLayers.folding[i]
      });
    }
    return crust;
  }

  clone() {
    return Crust.deserialize(this.serialize());
  }

  setInitialRockLayers(fieldType: FieldType, thickness: number, withSediments = true) {
    if (fieldType === "ocean") {
      this.rockLayers = withSediments ? [
        { rock: Rock.OceanicSediment, thickness: MAX_REGULAR_SEDIMENT_THICKNESS, folding: 0 },
        { rock: Rock.Basalt, thickness: (thickness - MAX_REGULAR_SEDIMENT_THICKNESS) * 0.3, folding: 0 },
        { rock: Rock.Gabbro, thickness: (thickness - MAX_REGULAR_SEDIMENT_THICKNESS) * 0.7, folding: 0 }
      ] : [
        { rock: Rock.Basalt, thickness: thickness * 0.3, folding: 0 },
        { rock: Rock.Gabbro, thickness: thickness * 0.7, folding: 0 }
      ];
    } else if (fieldType === "continent" || fieldType === "island") {
      this.rockLayers = [
        { rock: Rock.Granite, thickness, folding: 0 }
      ];
    }
  }

  getLayer(rock: Rock) {
    for (const layer of this.rockLayers) {
      if (layer.rock === rock) {
        return layer;
      }
    }
    return null;
  }

  increaseLayerThickness(rock: Rock, value: number, maxThickness = Infinity) {
    let layer = this.getLayer(rock);
    if (layer) {
      if (layer.thickness + value < maxThickness) {
        layer.thickness += value;
      }
    } else {
      layer = { rock, thickness: Math.min(value, maxThickness), folding: 0 };
      this.rockLayers.unshift(layer);
    }
  }

  addBasaltAndGabbro(totalAmount: number) {
    this.increaseLayerThickness(Rock.Gabbro, totalAmount * 0.7);
    this.increaseLayerThickness(Rock.Basalt, totalAmount * 0.3);
  }

  addVolcanicRocks(totalAmount: number) {
    if (this.hasContinentalRocks) {
      this.increaseLayerThickness(Rock.Rhyolite, totalAmount);
    } else if (this.hasOceanicRocks) {
      this.increaseLayerThickness(Rock.Diorite, totalAmount * 0.7);
      this.increaseLayerThickness(Rock.Andesite, totalAmount * 0.3);
    }
  }

  addSediment(amount: number) {
    if (this.getLayer(Rock.OceanicSediment) || this.hasOceanicRocks) {
      this.increaseLayerThickness(Rock.OceanicSediment, amount, MAX_REGULAR_SEDIMENT_THICKNESS);
    } else if (this.getLayer(Rock.ContinentalSediment) || this.hasContinentalRocks) {
      this.increaseLayerThickness(Rock.ContinentalSediment, amount, MAX_REGULAR_SEDIMENT_THICKNESS);
    }
  }

  addExcessSediment(amount: number) {
    if (this.getLayer(Rock.OceanicSediment)) {
      this.increaseLayerThickness(Rock.OceanicSediment, amount, MAX_WEDGE_SEDIMENT_THICKNESS);
    }
  } 

  setFolding(value: number) {
    for (const layer of this.rockLayers) {
      if (layer.folding < value) {
        layer.folding = value;
      }
    }
  }

  spreadOceanicSediment(timestep: number, neighboringCrust: Crust[]) {
    const sedimentLayer = this.getLayer(Rock.OceanicSediment);
    const kSpreadingFactor = 0.5;
    // Damping factor ensures that excess sediments don't travel forever. They'll slowly disappear over time.
    const kDampingFactor = Math.pow(0.9, timestep);
    if (sedimentLayer && sedimentLayer.thickness > MAX_REGULAR_SEDIMENT_THICKNESS && neighboringCrust.length > 0) {
      const removedSediment = Math.min(sedimentLayer.thickness, kSpreadingFactor * (sedimentLayer.thickness - MAX_REGULAR_SEDIMENT_THICKNESS) * timestep);
      const increasePerNeigh = kDampingFactor * removedSediment / neighboringCrust.length;
      neighboringCrust.forEach(neighCrust => {
        neighCrust.addExcessSediment(increasePerNeigh);
      });
      sedimentLayer.thickness -= removedSediment;
    }
  }

  subduct(timestep: number, neighboringCrust: Crust[]) {
    let sedimentLayer = null;
    const kThicknessMult = Math.pow(0.4, timestep);

    for (const layer of this.rockLayers) {
      if (layer.rock !== Rock.Gabbro && layer.rock !== Rock.Basalt && layer.rock !== Rock.OceanicSediment) {
        layer.thickness *= kThicknessMult;
      }
      if (layer.rock === Rock.OceanicSediment) {
        sedimentLayer = layer;
      }
    }

    // Move crust to non-subducting neighbors. This will create accretionary wedge.
    if (sedimentLayer && sedimentLayer.thickness > 0) {
      if (neighboringCrust.length > 0) {
        const removedSediment = Math.min(sedimentLayer.thickness, sedimentLayer.thickness * timestep);
        const increasePerNeigh = removedSediment / neighboringCrust.length;
        neighboringCrust.forEach(neighCrust => {
          neighCrust.addExcessSediment(increasePerNeigh);
        });
      } else {
        sedimentLayer.thickness *= kThicknessMult;
      }
    }
  
    this.removeTooThinLayers();
  }

  removeTooThinLayers() {
    this.rockLayers = this.rockLayers.filter(rl => rockLayerFinalThickness(rl) > MIN_LAYER_THICKNESS);
  }

  sortLayers() {
    // Move sediment to the top.
    const sediment = this.getLayer(Rock.OceanicSediment) || this.getLayer(Rock.ContinentalSediment);
    if (sediment) {
      const sedimentIdx = this.rockLayers.indexOf(sediment);
      if (sedimentIdx !== 0) {
        this.rockLayers.splice(sedimentIdx, 1);
        this.rockLayers.unshift(sediment);
      }
    }
  }
}
