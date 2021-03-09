import { FieldType } from "./field";

export enum Rock {
  Granite = "Gr",
  Basalt = "Ba",
  Gabbro = "Ga",
  MaficRocks = "MaR",
  AndesiticRocks = "AnR",
}

// Labels used in UI.
export const ROCK_LABEL: Record<Rock, string> = {
  [Rock.Granite]: "Granite",
  [Rock.Basalt]: "Basalt",
  [Rock.Gabbro]: "Gabbro",
  [Rock.MaficRocks]: "Mafic Rocks",
  [Rock.AndesiticRocks]: "Andesitic Rocks"
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

export default class Crust {
  // Rock layers, ordered from the top to the bottom (of the crust).
  rockLayers: IRockLayer[] = [];

  constructor(fieldType?: FieldType, thickness?: number) {
    if (fieldType && thickness) {
      this.setInitialRockLayers(fieldType, thickness);
    }
  }

  get thickness() {
    let result = 0;
    for (const layer of this.rockLayers) {
      result += rockLayerFinalThickness(layer);
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

  setInitialRockLayers(fieldType: FieldType, thickness: number) {
    if (fieldType === "ocean") {
      this.rockLayers = [
        { rock: Rock.Basalt, thickness: thickness * 0.5, folding: 0 },
        { rock: Rock.Gabbro, thickness: thickness * 0.5, folding: 0 }
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
    this.increaseLayerThickness(Rock.Gabbro, totalAmount * 0.5);
    this.increaseLayerThickness(Rock.Basalt, totalAmount * 0.5);
  }

  addVolcanicRocks(totalAmount: number) {
    this.increaseLayerThickness(Rock.MaficRocks, totalAmount * 0.5);
    this.increaseLayerThickness(Rock.AndesiticRocks, totalAmount * 0.5);
  }

  setFolding(value: number) {
    for (const layer of this.rockLayers) {
      if (layer.folding < value) {
        layer.folding = value;
      }
    }
  }
}
