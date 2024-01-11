import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AdvancedOptions } from "../../src/components/advanced-options";
import config from "../../src/config";

describe("AdvancedOptions component", () => {
  let store: any;
  beforeEach(() => {
    // Restore config as it can be modified by tests.
    (self as any).resetConfig();
    store = {
      model: {
        plates: []
      },
      setOption: jest.fn()
    };
  });

  const allOptions = [
    ["interactions", "Interaction"],
    ["timestep", "Model Speed"],
    ["latLongLines", "Latitude and Longitude Lines"],
    ["plateLabels", "Plate Labels"],
    ["velocityArrows", "Velocity Arrows"],
    ["forceArrows", "Force Arrows"],
    ["eulerPoles", "Euler Poles"],
    ["boundaries", "Plate Boundaries"],
    ["wireframe", "Wireframe"],
    ["save", "Share Model"]
  ];

  it("respects `sidebar` config option and renders only chosen components - case 1", () => {
    config.sidebar = allOptions.map(e => e[0]);
    render(<AdvancedOptions simulationStore={store} />);
    allOptions.map(e => e[1]).forEach(label => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it("respects `sidebar` config option and renders only chosen components - case 2", () => {
    const sliceIdx = 5;
    const enabledOptions = allOptions.slice(0, sliceIdx);
    const hiddenOptions = allOptions.slice(sliceIdx);
    config.sidebar = enabledOptions.map(e => e[0]);
    render(<AdvancedOptions simulationStore={store} />);
    enabledOptions.map(e => e[1]).forEach(label => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
    hiddenOptions.map(e => e[1]).forEach(label => {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    });
  });

  it("lets user toggle checkbox-based options", () => {
    render(<AdvancedOptions simulationStore={store} />);
    const checkboxOptions = [
      ["Wireframe", "wireframe"],
      ["Velocity Arrows", "renderVelocities"],
      ["Force Arrows", "renderForces"],
      ["Plate Boundaries", "renderBoundaries"],
      ["Euler Poles", "renderEulerPoles"],
      ["Latitude and Longitude Lines", "renderLatLongLines"],
      ["Plate Labels", "renderPlateLabels"]
    ];
    checkboxOptions.forEach(opt => {
      fireEvent.click(screen.getByText(opt[0]));
      expect(store.setOption).toHaveBeenLastCalledWith(opt[1], true);
    });
  });
});
