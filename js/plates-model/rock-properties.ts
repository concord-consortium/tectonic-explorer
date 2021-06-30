// Do not change numeric values without strong reason, as it will break deserialization process.
// Do not use automatic enum values, as if we ever remove one rock type, other values shouldn't change.
export enum Rock {
  OceanicSediment = 0,
  Granite = 1,
  Basalt = 2,
  Gabbro = 3,
  Rhyolite = 4,
  Andesite = 5,
  Diorite = 6,
  Limestone = 8,
  Shale = 9,
  Sandstone = 10
}

export interface IRockProperties {
  label: string;
  // Rock layers have strictly defined order that they need to follow.
  // The top-most layer should have the smallest value.
  orderIndex: number;
  isTransferrableDuringCollision: boolean;
  canSubduct: boolean;
}

export const ROCK_PROPERTIES: Record<Rock, IRockProperties> = {
  [Rock.OceanicSediment]: {
    label: "Oceanic Sediment",
    orderIndex: 1,
    isTransferrableDuringCollision: true,
    canSubduct: true
  },
  [Rock.Rhyolite]: {
    label: "Rhyolite",
    orderIndex: 2,
    isTransferrableDuringCollision: true,
    canSubduct: false
  },
  [Rock.Andesite]: {
    label: "Andesite",
    orderIndex: 3,
    isTransferrableDuringCollision: true,
    canSubduct: false
  },
  [Rock.Diorite]: {
    label: "Diorite",
    orderIndex: 4,
    isTransferrableDuringCollision: true,
    canSubduct: false
  },
  [Rock.Sandstone]: {
    label: "Sandstone",
    orderIndex: 5,
    isTransferrableDuringCollision: true,
    canSubduct: false
  },
  [Rock.Shale]: {
    label: "Shale",
    orderIndex: 6,
    isTransferrableDuringCollision: true,
    canSubduct: false
  },
  [Rock.Limestone]: {
    label: "Limestone",
    orderIndex: 7,
    isTransferrableDuringCollision: true,
    canSubduct: false
  },
  [Rock.Granite]: {
    label: "Granite",
    orderIndex: 8,
    isTransferrableDuringCollision: true,
    canSubduct: false
  },
  [Rock.Basalt]: {
    label: "Basalt",
    orderIndex: 9,
    isTransferrableDuringCollision: false,
    canSubduct: true
  },
  [Rock.Gabbro]: {
    label: "Gabbro",
    orderIndex: 10,
    isTransferrableDuringCollision: false,
    canSubduct: true
  },
};

export const rockProps = (rock: Rock) => ROCK_PROPERTIES[rock];
