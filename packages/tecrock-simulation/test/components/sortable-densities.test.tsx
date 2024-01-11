import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import SortableDensities from "../../src/components/sortable-densities";
import config from "../../src/config";

describe("SortableDensities component", () => {
  let store: any;
  beforeEach(() => {
    // Restore config as it can be modified by tests.
    (self as any).resetConfig();
    store = {
      model: {
        sortedPlates: []
      }
    };
  });

  it("respects `densityWordInPlanetWizard` config option", () => {
    config.densityWordInPlanetWizard = true;

    render(<SortableDensities simulationStore={store} />);
    expect(screen.getByText("LOW")).toBeInTheDocument();
    expect(screen.getByText("HIGH")).toBeInTheDocument();
    expect(screen.getByText("Click and drag to reorder the plate density")).toBeInTheDocument();

    config.densityWordInPlanetWizard = false;

    render(<SortableDensities simulationStore={store} />);
    expect(screen.getByText("BELOW")).toBeInTheDocument();
    expect(screen.getByText("ABOVE")).toBeInTheDocument();
    expect(screen.getByText("Click and drag to reorder the plates")).toBeInTheDocument();
  });
});
