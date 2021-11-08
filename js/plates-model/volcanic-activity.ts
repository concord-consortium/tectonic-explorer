import { random } from "../seedrandom";
import Crust from "./crust";
import { Rock } from "./rock-properties";
import Field from "./field";

export interface IMagmaBlob {
  active: boolean;
  dist: number;
  maxDist: number;
  xOffset: number;
  isErupting: boolean;
  finalRockType: Rock | undefined;
}

export interface ISerializedVolcanicAct {
  deformingCapacity: number;
  highVolcanoCapacity: number;
  magma: IMagmaBlob[];
  eruptionTime: number;
  // .intensity and .colliding are dynamically calculated every simulation step.
}

// Max time that given field can undergo volcanic activity.
const MAX_DEFORMING_TIME = 8; // model time
const ADDITIONAL_HIGH_VOLCANO_DEFORMING_TIME = 10; // model time
// This param can be used to change number of high volcanoes.
const HIGH_VOLCANO_PROBABILITY_FACTOR = 0.02;

const MAGMA_BLOB_PROBABILITY = 0.3;
const MAGMA_RISE_SPEED = 0.2;
const MAX_MAGMA_BLOBS_COUNT = 10; // this will be multiplied by crust elevation
const MAGMA_BLOB_MAX_X_OFFSET = 50; // km
const MIN_INTENSITY_FOR_MAGMA = 0.7;

const ERUPTION_TIME = 14;

const getFinalRockType = (crust: Crust, finalDistProportion: number) => {
  // based on: https://www.pivotaltracker.com/story/show/178271502
  const isOceanicCrust = crust.hasOceanicRocks;
  if (isOceanicCrust) {
    if (finalDistProportion < 0.75) {
      return Rock.Gabbro;
    }
    return Rock.Diorite;
  } else {
    const rhyoliteLevel = 1 - (crust.getLayer(Rock.Rhyolite)?.thickness || 0) / crust.thickness;
    if (finalDistProportion < 0.3) {
      return Rock.Gabbro;
    }
    if (finalDistProportion < 0.6) {
      return Rock.Diorite;
    }
    if (finalDistProportion < rhyoliteLevel) {
      return Rock.Granite;
    }
    return Rock.Rhyolite;
  }
};

// Set of properties related to volcanic activity. Used by Field instances.
export default class VolcanicActivity {
  field: Field;
  deformingCapacity: number;
  highVolcanoCapacity: number;
  magma: IMagmaBlob[] = [];
  eruptionTime = 0;
  // Fields calculated dynamically during each step:
  intensity: number;
  colliding: false | Field;

  constructor(field: Field) {
    this.field = field;
    this.intensity = 0;
    this.colliding = false;
    // When field undergoes volcanic activity, this attribute is going lower and lower
    // and at some point field will be "frozen" won't be able to undergo any more processes.
    // It ensures that mountains don't grow too big and there's some variation between fields.
    // Deforming capacity is lower when the field has already a high elevation.
    this.deformingCapacity = MAX_DEFORMING_TIME / (1 + field.elevation);
    this.highVolcanoCapacity = 0;
  }

  serialize(): ISerializedVolcanicAct {
    return {
      deformingCapacity: this.deformingCapacity,
      highVolcanoCapacity: this.highVolcanoCapacity,
      magma: this.magma.map(blob => ({ ...blob })), // clone magma blob properties
      eruptionTime: this.eruptionTime,
    };
  }

  static deserialize(props: ISerializedVolcanicAct, field: Field) {
    const vAct = new VolcanicActivity(field);
    vAct.deformingCapacity = props.deformingCapacity;
    vAct.highVolcanoCapacity = props.highVolcanoCapacity;
    vAct.magma = props.magma;
    vAct.eruptionTime = props.eruptionTime;
    return vAct;
  }

  get active() {
    return this.intensity > 0 && this.deformingCapacity + this.highVolcanoCapacity > 0;
  }

  get risingMagma() {
    return this.highVolcanoCapacity > 0;
  }

  get erupting() {
    return this.eruptionTime > 0;
  }

  get highVolcanoProbability() {
    if (!this.active) {
      return 0;
    }
    return this.intensity * HIGH_VOLCANO_PROBABILITY_FACTOR;
  }

  setCollision(field: Field) {
    this.colliding = field;
    // Volcanic activity is the strongest in the middle of subduction distance / progress.
    if (field.subduction) {
      let r = field.subduction.progress; // [0, 1]
      if (r > 0.5) r = 1 - r;
      this.intensity = Math.pow(2 * r, 2); // [0, 1]
    }
  }

  resetCollision() {
    // Needs to be reactivated during next collision.
    this.colliding = false;
    this.intensity = 0;
  }

  update(timestep: number) {
    const crustThickness = this.field.crustThickness;

    if (this.intensity > MIN_INTENSITY_FOR_MAGMA && random() < MAGMA_BLOB_PROBABILITY * timestep) {
      // * 1.1 ensures that around 10% of the blobs will reach the surface.
      const maxDist = Math.max(0.1, Math.min(crustThickness, random() * crustThickness * 1.1));

      this.magma.push({
        active: true,
        dist: 0,
        maxDist,
        isErupting: false,
        finalRockType: getFinalRockType(this.field.crust, maxDist / crustThickness),
        xOffset: (random() * 2 - 1) * MAGMA_BLOB_MAX_X_OFFSET
      });
    }

    const maxBlobsCount = MAX_MAGMA_BLOBS_COUNT * crustThickness;
    while (this.magma.length > maxBlobsCount) {
      this.magma.shift();
    }

    this.magma.forEach(blob => {
      if (blob.dist < blob.maxDist) {
        blob.dist = Math.min(blob.maxDist, blob.dist + MAGMA_RISE_SPEED * timestep);
      } else {
        if (blob.active) {
          blob.active = false;
        }
        const canErupt = blob.maxDist === crustThickness; // magma can erupt when it reaches the surface
        if (canErupt) {
          if (this.intensity > 0 && this.eruptionTime === 0) {
            blob.isErupting = true;
            this.eruptionTime = ERUPTION_TIME;
          }
        }
        if (blob.isErupting) {
          // Line up erupting magma blob with the crust surface.
          blob.dist = crustThickness;
        }
      }
    });

    if (this.eruptionTime > 0) {
      this.eruptionTime -= timestep;
    }
    if (this.eruptionTime <= 0 || !this.active) {
      this.eruptionTime = 0;
      this.magma.forEach(blob => {
        if (blob.isErupting) {
          blob.isErupting = false;
        }
      });
    }

    if (!this.active) {
      return;
    }

    // Some volcanoes can get taller than the other, just to add visual variability.
    if (this.highVolcanoCapacity === 0 && random() < this.highVolcanoProbability * timestep) {
      this.highVolcanoCapacity += (0.5 +random() * 0.5) * ADDITIONAL_HIGH_VOLCANO_DEFORMING_TIME;
    }
  }
}
