import Earthquake from "../../src/plates-model/earthquake";
import Field from "../../src/plates-model/field";

describe("Earthquake model", () => {
  it("should be initialized correctly", () => {
    const field = {
      elevation: 0,
      crustThickness: 10,
      lithosphereThickness: 10
    };
    const eq = new Earthquake(field as Field);
    expect(eq.lifespan).toBeGreaterThan(0);
    expect(eq.depth).toBeLessThan(0);
    expect(eq.magnitude).toBeGreaterThan(0);
    expect(eq.active).toEqual(true);
  });

  describe("update", () => {
    it("should decrease lifespan", () => {
      const field = {};
      const eq = new Earthquake(field as Field);
      const oldLifespan = eq.lifespan;
      const timestep = 0.1;
      eq.update(timestep);
      expect(eq.lifespan).toEqual(oldLifespan - timestep);
      expect(eq.active).toEqual(true);
      eq.update(oldLifespan);
      expect(eq.active).toEqual(false);
    });
  });
});
