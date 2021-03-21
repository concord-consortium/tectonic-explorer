import { BASE_OCEANIC_CRUST_THICKNESS, FieldType } from "./field";

export enum Rock {
  Granite = "Gr",
  Basalt = "Ba",
  Gabbro = "Ga",
  MaficRocks = "MaR",
  AndesiticRocks = "AnR",
  Sediment = "Se"
}

// Labels used in UI.
export const ROCK_LABEL: Record<Rock, string> = {
  [Rock.Granite]: "Granite",
  [Rock.Basalt]: "Basalt",
  [Rock.Gabbro]: "Gabbro",
  [Rock.MaficRocks]: "Mafic Rocks",
  [Rock.AndesiticRocks]: "Andesitic Rocks",
  [Rock.Sediment]: "Sedimentary Rocks"
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

export function rockLayerFinalThickness(rockLayer: IRockLayer) {
  return rockLayer.thickness * (1 + rockLayer.folding);
}

export const MAX_SEDIMENT_THICKNESS = 0.1 * BASE_OCEANIC_CRUST_THICKNESS;
export const MAX_WEDGE_SEDIMENT_THICKNESS = 5 * MAX_SEDIMENT_THICKNESS;
export const MIN_LAYER_THICKNESS = 0.02 * BASE_OCEANIC_CRUST_THICKNESS;

// This constant will decide how deep are the mountain roots.
export const CRUST_THICKNESS_TO_ELEVATION_RATIO = 0.5;

export default class Crust {
  // Rock layers, ordered from the top to the bottom (of the crust).
  rockLayers: IRockLayer[] = [];

  constructor(fieldType?: FieldType, thickness?: number, withSediments = true) {
    if (fieldType && thickness) {
      this.setInitialRockLayers(fieldType, thickness, withSediments);
    }
  }

  get thickness() {
    let result = 0;
    for (const layer of this.rockLayers) {
      result += rockLayerFinalThickness(layer);
    }
    return result;
  }

  thicknessAboveZeroElevation() {
    let result = 0;
    for (const layer of this.rockLayers) {
      result += rockLayerFinalThickness(layer) * (layer.rock !== Rock.Sediment ? CRUST_THICKNESS_TO_ELEVATION_RATIO : 1);
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
        { rock: Rock.Sediment, thickness: MAX_SEDIMENT_THICKNESS, folding: 0 },
        { rock: Rock.Basalt, thickness: (thickness - MAX_SEDIMENT_THICKNESS) * 0.3, folding: 0 },
        { rock: Rock.Gabbro, thickness: (thickness - MAX_SEDIMENT_THICKNESS) * 0.7, folding: 0 }
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

  increaseLayerThickness(rock: Rock, value: number) {
    const layer = this.getLayer(rock);
    if (layer) {
      layer.thickness += value;
    } else {
      this.rockLayers.unshift({ rock, thickness: value, folding: 0 });
    }
  }

  addBasaltAndGabbro(totalAmount: number) {
    this.increaseLayerThickness(Rock.Gabbro, totalAmount * 0.7);
    this.increaseLayerThickness(Rock.Basalt, totalAmount * 0.3);
  }

  addVolcanicRocks(totalAmount: number) {
    this.increaseLayerThickness(Rock.MaficRocks, totalAmount * 0.5);
    this.increaseLayerThickness(Rock.AndesiticRocks, totalAmount * 0.5);
  }

  addSediment(amount: number) {
    const sediment = this.getLayer(Rock.Sediment);
    if (!sediment) {
      this.increaseLayerThickness(Rock.Sediment, Math.min(amount, MAX_SEDIMENT_THICKNESS));
    } else if (sediment && rockLayerFinalThickness(sediment) < MAX_SEDIMENT_THICKNESS) {
      this.increaseLayerThickness(Rock.Sediment, amount);
    }
  }

  addScrapedOffSediment(amount: number) {
    // No limits here.
    const sediment = this.getLayer(Rock.Sediment);
    if (!sediment) {
      this.increaseLayerThickness(Rock.Sediment, Math.min(amount, MAX_WEDGE_SEDIMENT_THICKNESS));
    } else if (sediment && rockLayerFinalThickness(sediment) < MAX_WEDGE_SEDIMENT_THICKNESS) {
      this.increaseLayerThickness(Rock.Sediment, amount);
    }
  }

  setFolding(value: number) {
    for (const layer of this.rockLayers) {
      if (layer.folding < value) {
        layer.folding = value;
      }
    }
  }

  subduct(timestep: number) {
    for (const layer of this.rockLayers) {
      if (layer.rock !== Rock.Gabbro && layer.rock !== Rock.Basalt) {
        layer.thickness *= Math.pow(0.4, timestep);
      }
    }
    this.removeTooThinLayers();
  }

  removeTooThinLayers() {
    this.rockLayers = this.rockLayers.filter(rl => rockLayerFinalThickness(rl) > MIN_LAYER_THICKNESS);
  }

  sortLayers() {
    // Move sediment to the top.
    const sediment = this.getLayer(Rock.Sediment);
    if (sediment) {
      const sedimentIdx = this.rockLayers.indexOf(sediment);
      if (sedimentIdx !== 0) {
        this.rockLayers.splice(sedimentIdx, 1);
        this.rockLayers.unshift(sediment);
      }
    }
  }
}
