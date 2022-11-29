import { Vector3 } from "three";
import Crust, { BASE_CONTINENTAL_CRUST_THICKNESS } from "../../js/plates-model/crust";
import { Rock } from "../../js/plates-model/rock-properties";

describe("Crust model", () => {
  it("can be initialized empty, or as ocean, continent or island", () => {
    let crust = new Crust();
    expect(crust.rockLayers.length).toEqual(0);

    crust = new Crust("ocean", 0.2);
    expect(crust.rockLayers).toEqual([
      { rock: Rock.OceanicSediment, thickness: 0.05 },
      { rock: Rock.Basalt, thickness: 0.045000000000000005 },
      { rock: Rock.Gabbro, thickness: 0.10500000000000001 }
    ]);

    // Continental shelf -> no continental sediments.
    crust = new Crust("continent", 0.5);
    expect(crust.rockLayers).toEqual([
      { rock: Rock.Limestone, thickness: 0.125 },
      { rock: Rock.Granite, thickness: 0.375 }
    ]);

    console.log(BASE_CONTINENTAL_CRUST_THICKNESS);
    crust = new Crust("continent", BASE_CONTINENTAL_CRUST_THICKNESS);
    expect(crust.rockLayers).toEqual([
      { rock: Rock.ContinentalSediment, thickness: 0.05 },
      { rock: Rock.Sandstone, thickness: 0.125 },
      { rock: Rock.Granite, thickness: 1.075 }
    ]);
  });

  it("returns total thickness of all the layers", () => {
    const crust = new Crust();
    crust.rockLayers = [
      { rock: Rock.Andesite, thickness: 0.25 },
      { rock: Rock.Basalt, thickness: 0.25 },
      { rock: Rock.Gabbro, thickness: 0.5 }
    ];
    expect(crust.thickness).toEqual(1);
  });

  it("can add new rock type or increase its thickness", () => {
    const crust = new Crust();
    crust.increaseLayerThickness(Rock.Gabbro, 0.1);
    expect(crust.rockLayers).toEqual([
      { rock: Rock.Gabbro, thickness: 0.1 }
    ]);
    crust.increaseLayerThickness(Rock.Gabbro, 0.1);
    expect(crust.rockLayers).toEqual([
      { rock: Rock.Gabbro, thickness: 0.2 }
    ]);
    crust.increaseLayerThickness(Rock.Andesite, 0.123);
    expect(crust.rockLayers).toEqual([
      { rock: Rock.Andesite, thickness: 0.123 },
      { rock: Rock.Gabbro, thickness: 0.2 }
    ]);
  });

  it("can fold rock layers what should increase neighbouring crust thickness", () => {
    const crust = new Crust();
    crust.rockLayers = [
      { rock: Rock.Andesite, thickness: 0.5 },
      { rock: Rock.Basalt, thickness: 0.5 },
      { rock: Rock.Gabbro, thickness: 1.0 }
    ];

    const crustN1 = new Crust();
    const crustN2 = new Crust();

    crust.fold(1, [crustN1, crustN2], new Vector3(1, 0, 0));

    expect(crustN1.rockLayers).toEqual([
      { rock: Rock.Andesite, thickness: 0.25 },
      { rock: Rock.Basalt, thickness: 0.25 },
      { rock: Rock.Gabbro, thickness: 0.5 }
    ]);

    expect(crustN2.rockLayers).toEqual([
      { rock: Rock.Andesite, thickness: 0.25 },
      { rock: Rock.Basalt, thickness: 0.25 },
      { rock: Rock.Gabbro, thickness: 0.5 }
    ]);

    crust.fold(1, [crustN1, crustN2], new Vector3(1, 0, 0));

    expect(crustN1.rockLayers).toEqual([
      { rock: Rock.Andesite, thickness: 0.2525 },
      { rock: Rock.Basalt, thickness: 0.2525 },
      { rock: Rock.Gabbro, thickness: 0.505 }
    ]);

    expect(crustN2.rockLayers).toEqual([
      { rock: Rock.Andesite, thickness: 0.2525 },
      { rock: Rock.Basalt, thickness: 0.2525 },
      { rock: Rock.Gabbro, thickness: 0.505 }
    ]);
  });

  describe("addLayer", () => {
    it("adds a new layer and keeps all the layers in correct order", () => {
      const crust = new Crust();
      crust.addLayer({ rock: Rock.Basalt, thickness: 0.1 } );
      expect(crust.rockLayers).toEqual([
        { rock: Rock.Basalt, thickness: 0.1 }
      ]);
      crust.addLayer({ rock: Rock.OceanicSediment, thickness: 0.1 });
      expect(crust.rockLayers).toEqual([
        { rock: Rock.OceanicSediment, thickness: 0.1 },
        { rock: Rock.Basalt, thickness: 0.1 }
      ]);
      crust.addLayer({ rock: Rock.Gabbro, thickness: 0.1 });
      expect(crust.rockLayers).toEqual([
        { rock: Rock.OceanicSediment, thickness: 0.1 },
        { rock: Rock.Basalt, thickness: 0.1 },
        { rock: Rock.Gabbro, thickness: 0.1 }
      ]);
      crust.addLayer({ rock: Rock.Diorite, thickness: 0.1 });
      expect(crust.rockLayers).toEqual([
        { rock: Rock.OceanicSediment, thickness: 0.1 },
        { rock: Rock.Diorite, thickness: 0.1 },
        { rock: Rock.Basalt, thickness: 0.1 },
        { rock: Rock.Gabbro, thickness: 0.1 }
      ]);
    });
  });

  describe("removeLayer", () => {
    it("removes layer", () => {
      const crust = new Crust();
      crust.addLayer({ rock: Rock.Basalt, thickness: 0.1 });
      crust.addLayer({ rock: Rock.Gabbro, thickness: 0.1 });
      crust.addLayer({ rock: Rock.OceanicSediment, thickness: 0.1 });
      crust.addLayer({ rock: Rock.Diorite, thickness: 0.1 });
      expect(crust.rockLayers).toEqual([
        { rock: Rock.OceanicSediment, thickness: 0.1 },
        { rock: Rock.Diorite, thickness: 0.1 },
        { rock: Rock.Basalt, thickness: 0.1 },
        { rock: Rock.Gabbro, thickness: 0.1 }
      ]);

      crust.removeLayer(Rock.Basalt);
      expect(crust.rockLayers).toEqual([
        { rock: Rock.OceanicSediment, thickness: 0.1 },
        { rock: Rock.Diorite, thickness: 0.1 },
        { rock: Rock.Gabbro, thickness: 0.1 }
      ]);

      crust.removeLayer(Rock.OceanicSediment);
      expect(crust.rockLayers).toEqual([
        { rock: Rock.Diorite, thickness: 0.1 },
        { rock: Rock.Gabbro, thickness: 0.1 }
      ]);

      crust.removeLayer(Rock.Gabbro);
      expect(crust.rockLayers).toEqual([
        { rock: Rock.Diorite, thickness: 0.1 },
      ]);

      crust.removeLayer(Rock.Diorite);
      expect(crust.rockLayers).toEqual([]);
    });
  });

  describe("setMetamorphic", () => {
    it("limits metamorphic value to 1 and doesn't let client code decrease the metamorphic value", () => {
      const crust = new Crust();
      expect(crust.metamorphic).toEqual(0);

      crust.setMetamorphic(0.5);
      expect(crust.metamorphic).toEqual(0.5);

      crust.setMetamorphic(2);
      expect(crust.metamorphic).toEqual(1);

      crust.setMetamorphic(0.5);
      expect(crust.metamorphic).toEqual(1);
    });
  });
});
