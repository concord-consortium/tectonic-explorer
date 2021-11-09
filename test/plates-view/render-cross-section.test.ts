import * as THREE from "three";
import { Rock } from "../../js/plates-model/rock-properties";
import { IRockLayerData } from "../../js/plates-model/get-cross-section";
import renderCrossSection, { crossSectionWidth, getIntersectionWithTestPoint, ICrossSectionPlateViewData,
  LIGHT_RED_MAGMA_DIST,
  mergeRockLayers, shouldMergeRockLayers
} from "../../js/plates-view/render-cross-section";

// To have an idea about this data, you can take a look at: test-cross-section.png
// If this test data gets updated, it's useful to update this image too. This can be done very easily:
// const canvas = document.createElement("canvas");
// renderCrossSection(canvas, data, options);
// console.log(canvas.toDataURL());
const testPlateData: ICrossSectionPlateViewData = {
  points: [
    {
      dist: 0,
      field: {
        id: 0,
        plateId: 0,
        elevation: 0.55,
        crustThickness: 1.5,
        rockLayers: [
          { rock: Rock.Sandstone, relativeThickness: 0.2 },
          { rock: Rock.Granite, relativeThickness: 0.8 }
        ],
        lithosphereThickness: 0.7,
        normalizedAge: 1
      }
    },
    {
      dist: 500,
      field: {
        id: 0,
        plateId: 0,
        elevation: 0.7,
        crustThickness: 1.7,
        rockLayers: [
          { rock: Rock.Sandstone, relativeThickness: 0.2 },
          { rock: Rock.Granite, relativeThickness: 0.8 }
        ],
        lithosphereThickness: 0.7,
        normalizedAge: 1,
        magma: [
          {
            dist: 0,
            xOffset: 0,
            finalRockType: Rock.Granite,
            active: true,
            isErupting: false
          },
          {
            dist: 0.4 * LIGHT_RED_MAGMA_DIST,
            xOffset: 0,
            finalRockType: Rock.Granite,
            active: true,
            isErupting: false
          },
          {
            dist: 0.8 * LIGHT_RED_MAGMA_DIST,
            xOffset: 0,
            finalRockType: Rock.Granite,
            active: true,
            isErupting: false
          },
          {
            dist: 1 * LIGHT_RED_MAGMA_DIST,
            xOffset: 0,
            finalRockType: Rock.Granite,
            active: false,
            isErupting: false
          }
        ]
      }
    },
    {
      dist: 1000,
      field: {
        id: 0,
        plateId: 0,
        elevation: 0.15,
        crustThickness: 0.8,
        rockLayers: [
          { rock: Rock.Granite, relativeThickness: 1 }
        ],
        lithosphereThickness: 0.7,
        normalizedAge: 1,
      }
    },
    {
      dist: 2000,
      field: {
        id: 0,
        plateId: 0,
        elevation: 0.05,
        crustThickness: 0.5,
        rockLayers: [
          { rock: Rock.Gabbro, relativeThickness: 1 }
        ],
        lithosphereThickness: 0.7,
        normalizedAge: 1
      }
    }
  ]
};

const options = {
  rockLayers: true,
  metamorphism: true
};

const CS_WIDTH = 400; // last point's dist * 0.2 (see config.crossSectionPxPerKm)

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

  describe("crossSectionWidth", () => {
    it("should reuturn correct width based on the data", () => {
      expect(crossSectionWidth([])).toEqual(0);
      const data: ICrossSectionPlateViewData[] = [testPlateData];
      expect(crossSectionWidth(data)).toEqual(CS_WIDTH);
    });
  });

  describe("renderCrossSection", () => {
    it("renders test data without any errors", () => {
      const data: ICrossSectionPlateViewData[] = [testPlateData];
      const canvas = document.createElement("canvas");
      expect(() => renderCrossSection(canvas, data, options)).not.toThrowError();
      // If you need to update test-cross-section.png or just want to see what is being tested, you can
      // generate a new image using:
      // console.log(canvas.toDataURL());
    });
  });

  describe("getIntersectionWithTestPoint", () => {
    it("get underlying interactive object", () => {
      const data: ICrossSectionPlateViewData[] = [testPlateData];
      const canvas = document.createElement("canvas");
      let testPoint = new THREE.Vector2(1, 1);
      expect(getIntersectionWithTestPoint(canvas, data, options, testPoint)).toEqual("Sky");
      testPoint = new THREE.Vector2(1, 70);
      expect(getIntersectionWithTestPoint(canvas, data, options, testPoint)).toEqual("Sandstone");
      testPoint = new THREE.Vector2(1, 200);
      expect(getIntersectionWithTestPoint(canvas, data, options, testPoint)).toEqual("Mantle (brittle)");
      testPoint = new THREE.Vector2(1, 270);
      expect(getIntersectionWithTestPoint(canvas, data, options, testPoint)).toEqual("Mantle (ductile)");
      testPoint = new THREE.Vector2(350, 110);
      expect(getIntersectionWithTestPoint(canvas, data, options, testPoint)).toEqual("Gabbro");
      // Magma blobs
      testPoint = new THREE.Vector2(100, 100);
      expect(getIntersectionWithTestPoint(canvas, data, options, testPoint)).toEqual("Granite");
      testPoint = new THREE.Vector2(100, 120);
      expect(getIntersectionWithTestPoint(canvas, data, options, testPoint)).toEqual("Silica-rich Magma");
      testPoint = new THREE.Vector2(100, 150);
      expect(getIntersectionWithTestPoint(canvas, data, options, testPoint)).toEqual("Intermediate Magma");
      testPoint = new THREE.Vector2(100, 185);
      expect(getIntersectionWithTestPoint(canvas, data, options, testPoint)).toEqual("Iron-rich Magma");
    });
  });
});
