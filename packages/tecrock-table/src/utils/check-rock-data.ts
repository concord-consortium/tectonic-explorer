import { IDataSample, RockKeyLabelArray, RockKeyLabel } from "@concord-consortium/tecrock-shared";

export const checkRockData = (dataSamples: IDataSample[], requiredRockTypes: RockKeyLabelArray) => {
  const requiredSet = new Set(requiredRockTypes);
  const collectedSet = new Set<RockKeyLabel>();
  const stillNeededSet = new Set<RockKeyLabel>();
  const sampledSet = dataSamples.reduce((acc, cur) => {
    acc.add(cur.type);
    return acc;
  }, new Set<RockKeyLabel>());

  for (const item of sampledSet) {
    if (requiredSet.has(item)) {
      collectedSet.add(item);
    }
  }

  for (const item of requiredSet) {
    if (!sampledSet.has(item)) {
      stillNeededSet.add(item);
    }
  }

  return {
    sampled: Array.from(sampledSet),
    collected: Array.from(collectedSet),
    stillNeeded: Array.from(stillNeededSet)
  };
};