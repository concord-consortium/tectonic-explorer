const FOLDING_STRESS_FACTOR = 10;

// Set of properties related to orogenesis. Used by Field instances.
export default class Orogeny {
  constructor(field) {
    this.field = field;
    this.maxFoldingStress = 0;
  }

  calcFoldingStress(force) {
    if (!force) return;
    const stress = Math.min(1, force.length() * FOLDING_STRESS_FACTOR);
    this.setFoldingStress(stress);
  }

  setFoldingStress(foldingStress) {
    if (this.maxFoldingStress < foldingStress) {
      this.maxFoldingStress = foldingStress;
      this.spreadFoldingStress();
    }
  }

  spreadFoldingStress() {
    const adjStress = this.maxFoldingStress - 0.2;
    if (adjStress < 0.1) return;
    this.field.forEachNeighbour(field => {
      if (field.isOcean) return;
      if (!field.orogeny) {
        field.orogeny = new Orogeny(field);
      }
      field.orogeny.setFoldingStress(adjStress);
    });
  }
}
