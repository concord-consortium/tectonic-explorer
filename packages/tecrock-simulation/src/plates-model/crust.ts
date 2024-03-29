import config from "../config";
import { random } from "../seedrandom";
import { FieldType } from "./field";
import getGrid from "./grid";
import { firstNonSedimentaryRockLayer, isSediment, Rock, rockProps } from "./rock-properties";

export interface IRockLayer {
  rock: Rock;
  thickness: number; // model units, meaningless
  metamorphic?: number; // [0, 1] - 0 means that the layer is not metamorphic, 1 that it fully is
}

export interface ISerializedCrust {
  // Format of rock layers is destructed to arrays as it should take much less space when serialized to JSON.
  rockLayers: {
    rock: Rock[],
    thickness: number[],
    metamorphic: number[]
  },
  metamorphic?: number; // [0, 1] - 0 means that rocks are not metamorphic, 1 that they fully are
  maxCrustThickness?: number;
  upliftCapacity?: number;
}

export const crustThicknessToElevation = (crustThickness: number) =>
  crustThickness * CRUST_THICKNESS_TO_ELEVATION_RATIO - CRUST_BELOW_ZERO_ELEVATION;

export const elevationToCrustThickness = (elevation: number) =>
  (elevation + CRUST_BELOW_ZERO_ELEVATION) / CRUST_THICKNESS_TO_ELEVATION_RATIO;

export enum Metamorphism {
  None = 0,
  LowGrade = 0.25,
  MediumGrade = 0.5,
  HighGrade = 1
}

// ---->
// When any of these values is updated, most likely color scales in colormaps.ts will have to be updated too.
export const BASE_OCEAN_ELEVATION = 0.1;
export const SEA_LEVEL = 0.5;
export const BASE_CONTINENT_ELEVATION = 0.55;
export const HIGHEST_MOUNTAIN_ELEVATION = 1;
// <----

// This constant will decide how deep are the mountain roots.
export const CRUST_THICKNESS_TO_ELEVATION_RATIO = 0.6;
export const BASE_OCEANIC_CRUST_THICKNESS = 0.5; // in real world: 6-12km, 7-10km on average
// This constant shifts elevation so the base oceanic crust is at elevation BASE_OCEAN_ELEVATION (in model units, compare that with SEA_LEVEL value).
export const CRUST_BELOW_ZERO_ELEVATION = BASE_OCEANIC_CRUST_THICKNESS * CRUST_THICKNESS_TO_ELEVATION_RATIO - BASE_OCEAN_ELEVATION;
export const BASE_CONTINENTAL_CRUST_THICKNESS = elevationToCrustThickness(BASE_CONTINENT_ELEVATION); // in real world: 30-70km, 35km on average

export const MIN_LAYER_THICKNESS = 0.02 * BASE_OCEANIC_CRUST_THICKNESS;

export const MAX_REGULAR_SEDIMENT_THICKNESS = 0.1 * BASE_OCEANIC_CRUST_THICKNESS;
// These constants decide how thick and how wide the accretionary wedge will be.
export const MAX_WEDGE_SEDIMENT_THICKNESS = 5 * MAX_REGULAR_SEDIMENT_THICKNESS;
export const WEDGE_ACCUMULATION_INTENSITY = 6;
export const WEDGE_METAMORPHISM = Metamorphism.LowGrade;

// When the crust subducts, most of its rock layers are transferred to neighboring fields.
// When this value is low, it will be transferred slower than subduction and most of the rock will be lost.
// When this value is high, pretty much all the rocks will be redistributed to non-subducting neighbors.
export const ROCK_SCARPING_INTENSITY = 40;

// These two constants determine orogeny intensity.
// ROCK_FOLDING_INTENSITY adds some variability to mountains.
export const ROCK_FOLDING_INTENSITY = 15;
// ROCK_TRANSFER_INTENSITY moves rocks from subducting plate to the overriding and speed of this transfer is the
// main factor that affects mountains height.
export const ROCK_TRANSFER_INTENSITY = 12;

export const MIN_EROSION_SLOPE = 20;
export const EROSION_INTENSITY = 0.02;

export const MAX_CRUST_THICKNESS_BASE = 2;

export const SHALE_LIMESTONE_SANDSTONE_THICKNESS = BASE_CONTINENTAL_CRUST_THICKNESS * 0.1;

export const SUBDUCTION_UPLIFT_INTENSITY = 0.3;
// This will affect min effect of the subduction uplift.
export const SUBDUCTION_UPLIFT_MIN_TIME = 0.6;
// This will affect variation of elevation in the subduction uplift area.
export const SUBDUCTION_UPLIFT_TIME_VARIATION = 0.7;

export default class Crust {
  // Rock layers, ordered from the top to the bottom (of the crust).
  rockLayers: IRockLayer[] = [];
  metamorphic = 0; // [0, 1] - 0 means that rocks are not metamorphic, 1 that they are fully metamorphic
  maxCrustThickness = MAX_CRUST_THICKNESS_BASE + random();
  upliftCapacity = SUBDUCTION_UPLIFT_MIN_TIME + SUBDUCTION_UPLIFT_TIME_VARIATION * random();

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

  get sedimentThickness() {
    let result = 0;
    for (const layer of this.rockLayers) {
      if (isSediment(layer.rock)) {
        result += layer.thickness;
      }
    }
    return result;
  }

  getTopRockType(includeSediments = true) {
    if (!includeSediments) {
      return firstNonSedimentaryRockLayer(this.rockLayers).rock;
    }
    // Fallback to Rock.OceanicSediment is pretty random. It should never happen, but just in case and to make TypeScript happy.
    return this.rockLayers[0]?.rock || Rock.OceanicSediment;
  }

  get hasOceanicRocks() {
    return this.rockLayers[this.rockLayers.length - 1].rock === Rock.Gabbro;
  }

  get hasContinentalRocks() {
    return this.rockLayers[this.rockLayers.length - 1].rock === Rock.Granite;
  }

  get canSubduct1() {
    return this.canSubduct();
  }

  wasInitiallyOceanicCrust() {
    return this.getLayer(Rock.Gabbro) !== null;
  }

  canSubduct() {
    for (const layer of this.rockLayers) {
      if (!rockProps(layer.rock).canSubduct && layer.thickness > 0.1) {
        return false;
      }
    }
    return true;
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

  setMetamorphic(value: Metamorphism) {
    // Once crust becomes metamorphic, the process can never be reverted.
    this.metamorphic = Math.min(Metamorphism.HighGrade, Math.max(this.metamorphic, value));
  }

  serialize(): ISerializedCrust {
    const result: ISerializedCrust = {
      rockLayers: {
        rock: [],
        thickness: [],
        metamorphic: []
      },
      maxCrustThickness: this.maxCrustThickness,
      upliftCapacity: this.upliftCapacity
    };
    for (const layer of this.rockLayers) {
      result.rockLayers.rock.push(layer.rock);
      result.rockLayers.thickness.push(layer.thickness);
      result.rockLayers.metamorphic.push(layer.metamorphic || 0);
    }
    if (this.metamorphic > 0) {
      // Serialize only non-zero values.
      result.metamorphic = this.metamorphic;
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
        metamorphic: props.rockLayers.metamorphic[i]
      });
    }
    crust.metamorphic = props.metamorphic || 0;
    crust.maxCrustThickness = props.maxCrustThickness || 0;
    crust.upliftCapacity = props.upliftCapacity || 0;
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
      let continentalCrust: Rock;
      const range = BASE_CONTINENTAL_CRUST_THICKNESS - BASE_OCEANIC_CRUST_THICKNESS;
      if (thickness < BASE_OCEANIC_CRUST_THICKNESS + 0.4 * range) {
        continentalCrust = Rock.Limestone;
      } else if (thickness < BASE_OCEANIC_CRUST_THICKNESS + 0.8 * range) {
        continentalCrust = Rock.Shale;
      } else {
        continentalCrust = Rock.Sandstone;
      }

      if (thickness < BASE_CONTINENTAL_CRUST_THICKNESS) {
        // Continental shelf. No continental sediments here.
        this.rockLayers = [
          { rock: continentalCrust, thickness: SHALE_LIMESTONE_SANDSTONE_THICKNESS },
          { rock: Rock.Granite, thickness: Math.max(0, thickness - SHALE_LIMESTONE_SANDSTONE_THICKNESS) }
        ];
      } else {
        this.rockLayers = [
          { rock: Rock.ContinentalSediment, thickness: MAX_REGULAR_SEDIMENT_THICKNESS },
          { rock: continentalCrust, thickness: SHALE_LIMESTONE_SANDSTONE_THICKNESS },
          { rock: Rock.Granite, thickness: Math.max(0, thickness - SHALE_LIMESTONE_SANDSTONE_THICKNESS - MAX_REGULAR_SEDIMENT_THICKNESS) }
        ];
      }
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

  addLayer(rockLayer: IRockLayer) {
    const orderIdx = rockProps(rockLayer.rock).orderIndex;
    let i = 0;
    while(i < this.rockLayers.length && orderIdx > rockProps(this.rockLayers[i].rock).orderIndex) {
      i += 1;
    }
    this.rockLayers.splice(i, 0, rockLayer);
  }

  removeLayer(rock: Rock) {
    let i = 0;
    while (i < this.rockLayers.length && this.rockLayers[i].rock !== rock) {
      i += 1;
    }
    if (i < this.rockLayers.length) {
      this.rockLayers.splice(i, 1);
    }
  }

  increaseLayerThickness(rock: Rock, value: number, options?: { maxThickness?: number, metamorphic?: number }) {
    const maxThickness = options?.maxThickness ?? Infinity;
    const metamorphic = options?.metamorphic ?? 0;
    if (value < 0) {
      // This means that some calculations went wrong. Do not throw an error and crash the app for user.
      // Notify in the browser console instead, so it can be caught during development.
      console.error("increaseLayerThickness value should be > 0");
      return;
    }
    if (this.thickness + value > this.maxCrustThickness) {
      return;
    }
    let layer = this.getLayer(rock);
    if (layer) {
      if (layer.thickness + value < maxThickness) {
        layer.thickness += value;
      }
      if (metamorphic) {
        // Once rock layer becomes metamorphic, the process can never be reverted.
        layer.metamorphic = Math.min(Metamorphism.HighGrade, Math.max(metamorphic, value));
      }
    } else {
      layer = { rock, thickness: Math.min(value, maxThickness) };
      if (metamorphic) {
        layer.metamorphic = metamorphic;
      }
      this.addLayer(layer);
    }
  }

  addBasaltAndGabbro(totalAmount: number) {
    this.increaseLayerThickness(Rock.Gabbro, totalAmount * 0.7);
    this.increaseLayerThickness(Rock.Basalt, totalAmount * 0.3);
  }

  addVolcanicRocks(totalAmount: number) {
    const halfAmount = 0.5 * totalAmount;
    if (this.hasContinentalRocks) {
      this.increaseLayerThickness(Rock.Rhyolite, halfAmount);
      // Add mountain roots too. Granite is the lowest layer of continental crust.
      this.increaseLayerThickness(Rock.Granite, halfAmount);
    } else if (this.hasOceanicRocks) {
      this.increaseLayerThickness(Rock.Diorite, halfAmount * 0.7);
      this.increaseLayerThickness(Rock.Andesite, halfAmount * 0.3);
      // Add mountain roots too. Gabbro and Basalt are the lowest layers of oceanic crust.
      this.increaseLayerThickness(Rock.Gabbro, halfAmount * 0.7);
      this.increaseLayerThickness(Rock.Basalt, halfAmount * 0.3);
    }
    // Volcanic rocks will cover any sediments.
    this.removeLayer(Rock.OceanicSediment);
    this.removeLayer(Rock.ContinentalSediment);
  }

  addSediment(amount: number) {
    if (amount < 0) {
      // This means that some calculations went wrong. Do not throw an error and crash the app for user.
      // Notify in the browser console instead, so it can be caught during development.
      console.error("addSediment value should be > 0");
      return;
    }
    if (this.hasOceanicRocks) {
      this.increaseLayerThickness(Rock.OceanicSediment, amount, { maxThickness: MAX_REGULAR_SEDIMENT_THICKNESS });
    }
  }

  addExcessSediment(amount: number) {
    // Accretionary wedge should be metamorphic (low grade).
    this.increaseLayerThickness(Rock.OceanicSediment, amount, { metamorphic: WEDGE_METAMORPHISM });
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

  // During subduction of the oceanic plate -> it creates accretionary wedge (made of oceanic sediments).
  // When continental plate goes under another continental plate -> it creates structure similar to accretionary
  // wedge  in the newly created mountain range.
  subduct(timestep: number, neighboringCrust: Crust[], relativeVelocity?: THREE.Vector3) {
    const subductionSpeed = relativeVelocity?.length() || 0;
    // This value decides how much of sediments will be transferred to neighboring fields when a field is subducting.
    // When it's equal to 1, everything will be transferred and the wedge will be bigger. Otherwise, some sediments
    // might subduct and get lost.
    const kThicknessMult = Math.min(1, timestep * subductionSpeed * ROCK_SCARPING_INTENSITY);

    for (const layer of this.rockLayers) {
      if (layer.rock === Rock.Gabbro || layer.rock === Rock.Basalt || layer.rock === Rock.Granite) {
        // These rock subduct unchanged.
        continue;
      }
      const removedThickness = layer.thickness * Math.min(1, kThicknessMult * WEDGE_ACCUMULATION_INTENSITY);
      layer.thickness -= removedThickness;

      const metamorphic = layer.rock === Rock.OceanicSediment ? WEDGE_METAMORPHISM : 0;
      const increasePerNeigh = removedThickness / neighboringCrust.length;
      neighboringCrust.forEach(neighCrust => {
        neighCrust.increaseLayerThickness(layer.rock, increasePerNeigh, { metamorphic });
      });
    }
  }

  // Folds overriding plate during continental collision. Adds a bit of variation to mountains and highlands.
  fold(timestep: number, neighboringCrust: Crust[], relativeVelocity?: THREE.Vector3) {
    const speed = relativeVelocity?.length() || 0;
    const kThicknessMult = Math.min(1, timestep * speed * ROCK_FOLDING_INTENSITY);

    for (const layer of this.rockLayers) {
      const foldedThickness = layer.thickness * kThicknessMult;
      layer.thickness -= foldedThickness * 0.99;
      const increasePerNeigh = foldedThickness / neighboringCrust.length;
      neighboringCrust.forEach(neighCrust => {
        neighCrust.increaseLayerThickness(layer.rock, increasePerNeigh);
      });
    }
  }

  // Transfers rocks from bottom plate to the overriding one during continental collision.
  transferRocks(timestep: number, bottomCrust: Crust, relativeVelocity?: THREE.Vector3) {
    const speed = relativeVelocity?.length() || 0;
    const kThicknessMult = Math.min(1, timestep * speed * ROCK_TRANSFER_INTENSITY);
    for (const layer of bottomCrust.rockLayers) {
      if (rockProps(layer.rock).isTransferrableDuringCollision) {
        const transferredThickness = layer.thickness * kThicknessMult;
        this.increaseLayerThickness(layer.rock, transferredThickness);
        // Theoretically, we should remove transferred rock from the bottom layer. But it will only change
        // less appealing visual effect, as mountains will have a deep valley with steep walls
        // around the converged boundary. See: https://www.pivotaltracker.com/story/show/183128190
      }
    }
  }

  // Thickness granite layer in the top plate during subduction.
  uplift(timestep: number, strength: number) {
    if (this.upliftCapacity <= 0) {
      return;
    }
    for (const layer of this.rockLayers) {
      if (layer.rock === Rock.Granite) {
        this.increaseLayerThickness(Rock.Granite, layer.thickness * (strength * timestep * SUBDUCTION_UPLIFT_INTENSITY));
      }
    }
    this.upliftCapacity -= timestep;
  }

  spreadMetamorphism(neighboringCrust: Crust[]) {
    const diff = getGrid().fieldDiameter / config.metamorphismOrogenyWidth;
    if (this.metamorphic - diff > 0) {
      neighboringCrust.forEach(c => {
        c.setMetamorphic(this.metamorphic - diff);
      });
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
          neighCrust.addSediment(increasePerNeigh);
        });
      }
    }
  }
}
