import { Rock } from "../../js/plates-model/crust";
import { IRockLayerData } from "../../js/plates-model/get-cross-section";
import { mergeRockLayers, shouldMergeRockLayers } from "../../js/plates-view/render-cross-section";

describe("render cross-section helpers", () => {
  describe("shouldMergeRockLayers", () => {
    it("should return true if bottom layers match", () => {
      const a: IRockLayerData[] = [{ rock: Rock.Rhyolite, relativeThickness: 0.5 }, { rock: Rock.Granite, relativeThickness: 0.5 }];
      const b: IRockLayerData[] = [{ rock: Rock.Rhyolite, relativeThickness: 0.5 }, { rock: Rock.Granite, relativeThickness: 0.5 }];
      const c: IRockLayerData[] = [{ rock: Rock.Rhyolite, relativeThickness: 0.5 }, { rock: Rock.Gabbro, relativeThickness: 0.5 }];
      expect(shouldMergeRockLayers(a, b)).toEqual(true);
      expect(shouldMergeRockLayers(a, c)).toEqual(false);
    });
  });

  describe("mergeRockLayers", () => {
    it("should merge two arrays of rock layers keeping the expected order", () => {
      const a: IRockLayerData[] = [{ rock: Rock.OceanicSediment, relativeThickness: 0.5 }, { rock: Rock.Granite, relativeThickness: 0.5 }];
      const b: IRockLayerData[] = [{ rock: Rock.Rhyolite, relativeThickness: 0.5 }, { rock: Rock.Granite, relativeThickness: 0.5 }];
      expect(mergeRockLayers(a, b)).toEqual([
        { rock: Rock.OceanicSediment, relativeThickness1: 0.5, relativeThickness2: 0 },
        { rock: Rock.Rhyolite, relativeThickness1: 0, relativeThickness2: 0.5 },
        { rock: Rock.Granite, relativeThickness1: 0.5, relativeThickness2: 0.5 }
      ]);

      const c: IRockLayerData[] = [
        { rock: Rock.OceanicSediment, relativeThickness: 0.1 }, 
        { rock: Rock.Andesite, relativeThickness: 0.2 },
        { rock: Rock.Basalt, relativeThickness: 0.2 },
        { rock: Rock.Gabbro, relativeThickness: 0.2 },
      ];
      const d: IRockLayerData[] = [
        { rock: Rock.Diorite, relativeThickness: 0.2 },
        { rock: Rock.Basalt, relativeThickness: 0.4 },
        { rock: Rock.Gabbro, relativeThickness: 0.4 },
      ];
      expect(mergeRockLayers(c, d)).toEqual([
        { rock: Rock.OceanicSediment, relativeThickness1: 0.1, relativeThickness2: 0 },
        { rock: Rock.Andesite, relativeThickness1: 0.2, relativeThickness2: 0 },
        { rock: Rock.Diorite, relativeThickness1: 0, relativeThickness2: 0.2 },
        { rock: Rock.Basalt, relativeThickness1: 0.2, relativeThickness2: 0.4 },
        { rock: Rock.Gabbro, relativeThickness1: 0.2, relativeThickness2: 0.4 },
      ]);
    });
  });
});
