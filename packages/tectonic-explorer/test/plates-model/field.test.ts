import Field from "../../src/plates-model/field";
import Plate from "../../src/plates-model/plate";
import Earthquake from "../../src/plates-model/earthquake";
import VolcanicEruption from "../../src/plates-model/volcanic-eruption";
import * as THREE from "three";

describe("Field model", () => {
  describe("performGeologicalProcesses", () => {
    it("should try to create earthquakes and volcanic eruptions", () => {
      const plate = {
        linearVelocity: () => new THREE.Vector3(1, 0, 0),
        absolutePosition: (pos: THREE.Vector3) => pos,
        fields: new Map()
      } as unknown as Plate;
      const field = new Field({ id: 0, plate });
      jest.spyOn(Earthquake, "shouldCreateEarthquake").mockImplementation(() => true);
      jest.spyOn(VolcanicEruption, "shouldCreateVolcanicEruption").mockImplementation(() => true);
      field.performGeologicalProcesses(1);
      expect(Earthquake.shouldCreateEarthquake).toHaveBeenCalled();
      expect(VolcanicEruption.shouldCreateVolcanicEruption).toHaveBeenCalled();
      expect(field.earthquake).toBeInstanceOf(Earthquake);
      expect(field.volcanicEruption).toBeInstanceOf(VolcanicEruption);
    });
  });
});
