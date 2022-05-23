import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import SortableDensities from "../../js/components/sortable-densities";
import config from "../../js/config";

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
    expect(screen.queryByText("HIGH")).toBeInTheDocument();
    expect(screen.queryByText("Click and drag to reorder the plate density")).toBeInTheDocument();

    config.densityWordInPlanetWizard = false;

    render(<SortableDensities simulationStore={store} />);
    expect(screen.queryByText("BELOW")).toBeInTheDocument();
    expect(screen.queryByText("ABOVE")).toBeInTheDocument();
    expect(screen.queryByText("Click and drag to reorder the plates")).toBeInTheDocument();
  });
});
