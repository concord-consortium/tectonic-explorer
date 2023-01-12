import VolcanicEruption from "../../js/plates-model/volcanic-eruption";

describe("VolcanicEruption model", () => {
  it("should be initialized correctly", () => {
    const ve = new VolcanicEruption();
    expect(ve.lifespan).toBeGreaterThan(0);
    expect(ve.active).toEqual(true);
  });

  describe("update", () => {
    it("should decrease lifespan", () => {
      const ve = new VolcanicEruption();
      const oldLifespan = ve.lifespan;
      const timestep = 0.1;
      ve.update(timestep);
      expect(ve.lifespan).toEqual(oldLifespan - timestep);
      expect(ve.active).toEqual(true);
      ve.update(oldLifespan);
      expect(ve.active).toEqual(false);
    });
  });
});
