import Crust, { Rock } from "../../js/plates-model/crust";

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

    crust = new Crust("continent", 0.5);
    expect(crust.rockLayers).toEqual([
      { rock: Rock.Granite, thickness: 0.5 }
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

  it("can fold rock layers what results in larger thickness", () => {
    const crust = new Crust();
    crust.rockLayers = [
      { rock: Rock.Andesite, thickness: 0.5 },
      { rock: Rock.Basalt, thickness: 0.5 },
      { rock: Rock.Gabbro, thickness: 1.0 }
    ];
    const oldThickness = crust.thickness;
    const folding = 0.5;
    crust.fold(folding);
    expect(crust.thickness).toEqual((1 + folding) * oldThickness);
    expect(crust.rockLayers).toEqual([
      { rock: Rock.Andesite, thickness: 0.75 },
      { rock: Rock.Basalt, thickness: 0.75 },
      { rock: Rock.Gabbro, thickness: 1.5 }
    ]);
  });
});
