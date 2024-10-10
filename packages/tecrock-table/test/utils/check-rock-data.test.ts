import { IDataSample, RockKeyLabel } from "@concord-consortium/tecrock-shared";
import { checkRockData } from "../../src/utils/check-rock-data";

const dataSamples: IDataSample[] = [
  {
    id: 1,
    crossSectionWall: "front",
    coords: {
      x: 362.39926859488185,
      y: 62.763062066624286
    },
    type: "Sandstone",
    pressure: "Low",
    temperature: "Low"
  },
  {
    id: 2,
    crossSectionWall: "front",
    coords: {
      x: 196.58227926294316,
      y: 220.43685215792746
    },
    type: "Mantle (ductile)",
    pressure: "High",
    temperature: "High"
  },
  {
    id: 3,
    crossSectionWall: "front",
    coords: {
      x: 49.594054509854516,
      y: 157.7133503205767
    },
    type: "Mantle (brittle)",
    pressure: "Med",
    temperature: "High"
  },
  {
    id: 4,
    crossSectionWall: "front",
    coords: {
      x: 164.25976778597192,
      y: 107.92845361681036
    },
    type: "Gabbro",
    pressure: "Low",
    temperature: "Low"
  },
  {
    id: 5,
    crossSectionWall: "front",
    coords: {
      x: 344.923160018517,
      y: 89.7746647890616
    },
    type: "Granite",
    pressure: "Low",
    temperature: "Low"
  }
];

const sampled = Array.from(dataSamples.reduce((acc, cur) => {
  acc.add(cur.type);
  return acc;
}, new Set<RockKeyLabel>));

describe("checkRockData", () => {

  it("returns all still needed when none found", () => {
    const result = checkRockData(dataSamples, ["Andesite", "Basalt"]);
    expect(result.collected.length).toBe(0);
    expect(result.sampled).toStrictEqual(sampled);
    expect(result.stillNeeded).toStrictEqual(["Andesite", "Basalt"]);
  });

  it("returns partial still needed when some found", () => {
    const result = checkRockData(dataSamples, ["Sandstone", "Basalt"]);
    expect(result.collected.length).toBe(1);
    expect(result.sampled).toStrictEqual(sampled);
    expect(result.stillNeeded).toStrictEqual(["Basalt"]);
  });

  it("returns none still needed when all found", () => {
    const result = checkRockData(dataSamples, ["Sandstone", "Gabbro", "Granite"]);
    expect(result.collected.length).toBe(3);
    expect(result.sampled).toStrictEqual(sampled);
    expect(result.stillNeeded).toStrictEqual([]);
  });

});
