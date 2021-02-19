import Field from "../../js/plates-model/field";
import Earthquake from "../../js/plates-model/earthquake";
import VolcanicEruption from "../../js/plates-model/volcanic-eruption";
import * as THREE from "three";

describe("Field model", () => {
  describe("performGeologicalProcesses", () => {
    it("should try to create earthquakes and volcanic eruptions", () => {
      const plate = {
        linearVelocity: () => new THREE.Vector3(1, 0, 0),
        absolutePosition: pos => pos
      };
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
