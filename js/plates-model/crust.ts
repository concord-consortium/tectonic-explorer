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
}

export interface ISerializedCrust {
  // Format of rock layers is destructed to arrays as it should take much less space when serialized to JSON.
  rockLayers: {
    rock: Rock[],
    thickness: number[],
  }
}

export const MIN_LAYER_THICKNESS = 0.02 * BASE_OCEANIC_CRUST_THICKNESS;
// This constant will decide how deep are the mountain roots.
export const CRUST_THICKNESS_TO_ELEVATION_RATIO = 0.5;

export const MAX_REGULAR_SEDIMENT_THICKNESS = 0.1 * BASE_OCEANIC_CRUST_THICKNESS;
// These constants decide how thick and how wide the accretionary wedge will be.
export const MAX_WEDGE_SEDIMENT_THICKNESS = 6 * MAX_REGULAR_SEDIMENT_THICKNESS;
export const WEDGE_ACCUMULATION_INTENSITY = 2;

// When the crust subducts, most of its rock layers are transferred to neighboring fields. 
// When this value is low, it will be transferred slower than subduction and most of the rock will be lost.
// When this value is high, pretty much all the rocks will be redistributed to non-subducting neighbors.
export const ROCK_SCARPING_INTENSITY = 50;

export const MIN_EROSION_SLOPE = 12;
export const EROSION_INTENSITY = 0.02;

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
      result += layer.thickness;
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

  get hasVolcanicRocks() {
    return this.getLayer(Rock.Diorite) !== null || this.getLayer(Rock.Andesite) !== null || this.getLayer(Rock.Rhyolite) !== null;
  }

  isOceanicCrust() {
    // This is very likely to change. For now, there's an assumption that crust is oceanic as long as gabbro
    // is a significant part of it. When amount of volcanic rocks or sediments reaches some level, it'll become
    // a continental crust.
    const gabbro = this.getLayer(Rock.Gabbro);
    return gabbro !== null && gabbro.thickness > 0.2 * this.thickness;
  }

  thicknessAboveZeroElevation() {
    let result = 0;
    for (const layer of this.rockLayers) {
      result += layer.thickness * (layer.rock !== Rock.OceanicSediment ? CRUST_THICKNESS_TO_ELEVATION_RATIO : 1);
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
      }
    };
    for (const layer of this.rockLayers) {
      result.rockLayers.rock.push(layer.rock);
      result.rockLayers.thickness.push(layer.thickness);
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
        { rock: Rock.OceanicSediment, thickness: MAX_REGULAR_SEDIMENT_THICKNESS },
        { rock: Rock.Basalt, thickness: (thickness - MAX_REGULAR_SEDIMENT_THICKNESS) * 0.3 },
        { rock: Rock.Gabbro, thickness: (thickness - MAX_REGULAR_SEDIMENT_THICKNESS) * 0.7 }
      ] : [
        { rock: Rock.Basalt, thickness: thickness * 0.3 },
        { rock: Rock.Gabbro, thickness: thickness * 0.7 }
      ];
    } else if (fieldType === "continent") {
      this.rockLayers = [
        { rock: Rock.Granite, thickness }
      ];
    } else if (fieldType === "island") {
      const oceanicBaseThickness = Math.min(thickness, BASE_OCEANIC_CRUST_THICKNESS);
      const volcanicRocksThickness = thickness - oceanicBaseThickness;
      this.rockLayers = [
        { rock: Rock.OceanicSediment, thickness: MAX_REGULAR_SEDIMENT_THICKNESS },
        { rock: Rock.Andesite, thickness: volcanicRocksThickness * 0.3 },
        { rock: Rock.Diorite, thickness: volcanicRocksThickness * 0.7 },
        { rock: Rock.Basalt, thickness: (oceanicBaseThickness - MAX_REGULAR_SEDIMENT_THICKNESS) * 0.3 },
        { rock: Rock.Gabbro, thickness: (oceanicBaseThickness - MAX_REGULAR_SEDIMENT_THICKNESS) * 0.7 }
      ];
      // In case volcanic layers have 0 thickness.
      this.removeTooThinLayers();
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
      layer = { rock, thickness: Math.min(value, maxThickness) };
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
    if (this.hasOceanicRocks) {
      this.increaseLayerThickness(Rock.OceanicSediment, amount, MAX_REGULAR_SEDIMENT_THICKNESS);
    } else if (this.hasContinentalRocks) {
      this.increaseLayerThickness(Rock.ContinentalSediment, amount, MAX_REGULAR_SEDIMENT_THICKNESS);
    }
  }

  addExcessSediment(amount: number) {
    this.increaseLayerThickness(Rock.OceanicSediment, amount, Infinity);
  } 

  spreadOceanicSediment(timestep: number, neighboringCrust: Crust[]) {
    const sedimentLayer = this.getLayer(Rock.OceanicSediment);
    const kSpreadingFactor = Math.min(1, 10 * timestep);
    // Damping factor ensures that excess sediments don't travel forever. They'll slowly disappear over time.
    const kDampingFactor = Math.pow(0.8, timestep);
    if (sedimentLayer && sedimentLayer.thickness > MAX_WEDGE_SEDIMENT_THICKNESS && neighboringCrust.length > 0) {
      const removedSediment = kSpreadingFactor * (sedimentLayer.thickness - MAX_WEDGE_SEDIMENT_THICKNESS);
      sedimentLayer.thickness -= removedSediment;
      const increasePerNeigh = kDampingFactor * removedSediment / neighboringCrust.length;
      neighboringCrust.forEach(neighCrust => {
        neighCrust.addExcessSediment(increasePerNeigh);
      });
    }
  }

  subduct(timestep: number, neighboringCrust: Crust[], relativeVelocity?: THREE.Vector3) {
    const subductionSpeed = relativeVelocity?.length() || 0;
    // This value decides how much of sediments will be transferred to neighboring fields when a field is subducting.
    // When it's equal to 1, everything will be transferred and the wedge will be bigger. Otherwise, some sediments
    // might subduct and get lost.
    const kThicknessMult = Math.min(1, timestep * subductionSpeed * ROCK_SCARPING_INTENSITY);

    for (const layer of this.rockLayers) {
      if (layer.rock === Rock.Gabbro || layer.rock === Rock.Basalt) {
        // These rock subduct unchanged.
        continue;
      }
      if (layer.rock === Rock.Granite && layer.thickness <= BASE_OCEANIC_CRUST_THICKNESS) {
        // Stop granite folding / propagation after it gets too thin.
        continue;
      }
      // Sediments move faster, so the wedge accumulation is more visible.
      const removedThickness = layer.thickness * kThicknessMult * (layer.rock === Rock.OceanicSediment ? WEDGE_ACCUMULATION_INTENSITY : 1);
      layer.thickness -= removedThickness;
      const increasePerNeigh = removedThickness / neighboringCrust.length;
      neighboringCrust.forEach(neighCrust => {
        neighCrust.increaseLayerThickness(layer.rock, increasePerNeigh);
      });
    }
  
    this.removeTooThinLayers();
  }

  fold(strength: number) {
    for (const layer of this.rockLayers) {
      layer.thickness *= (1 + strength);
    }
  }

  erode(timestep: number, neighboringCrust: Crust[], slopeFactor: number) {
    // Erosion is applied to steep slopes only. It simply redistributes rocks to neighboring fields.
    if (slopeFactor < MIN_EROSION_SLOPE) {
      return;
    }
    const kErodeFactor = Math.min(1, EROSION_INTENSITY * timestep);
    const thinnerNeighboringCrust = neighboringCrust.filter(c => c.thickness < this.thickness);
    if (thinnerNeighboringCrust.length > 0) {
      for (const layer of this.rockLayers) {
        const removedThickness = layer.thickness * kErodeFactor;
        layer.thickness -= removedThickness;
        const increasePerNeigh = removedThickness / thinnerNeighboringCrust.length;
        thinnerNeighboringCrust.forEach(neighCrust => {
          neighCrust.increaseLayerThickness(layer.rock, increasePerNeigh);
        });
      }
    }
  }

  removeTooThinLayers() {
    this.rockLayers = this.rockLayers.filter(rl => rl.thickness > MIN_LAYER_THICKNESS);
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
