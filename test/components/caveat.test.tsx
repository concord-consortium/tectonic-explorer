import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Caveat from "../../js/components/caveat-notice";

const expectedText = "The earthquakes and volcanic eruptions in this model do not represent actual frequency or duration. Because of the timescale of this model, only a very small number of these events are represented to highlight where they might occur.";

describe("Caveat component", () => {
  let store: any;
  beforeEach(() => {
    // Restore config as it can be modified by tests.
    (self as any).resetConfig();
    store = {
      model: {
        plates: []
      },
      earthquakes: false,
      volcanicEruptions: false
    };
  });

  it("contains the caveat disclaimer", () => {
    store.earthquakes = true;
    render(<Caveat simulationStore={store} />);
    expect(screen.queryByText(expectedText)).toBeInTheDocument();
  });

  it("is displayed when both `earthquakes` and `volcanicEruptions` options are enabled", () => {
    store.earthquakes = true;
    store.volcanicEruptions = true;
    render(<Caveat simulationStore={store} />);
    const elem = screen.getByText(expectedText);
    expect(elem).toHaveClass("visible");
  });

  it("is hidden displayed when neither `earthquakes` and `volcanicEruptions` options are enabled", () => {
    store.earthquakes = false;
    store.volcanicEruptions = false;
    render(<Caveat simulationStore={store} />);
    const elem = screen.getByText(expectedText);
    expect(elem).not.toHaveClass("visible");
  });

  it("is displayed when only`earthquakes` config option is enabled", () => {
    store.earthquakes = true;
    store.volcanicEruptions = false;
    render(<Caveat simulationStore={store} />);
    const elem = screen.getByText(expectedText);
    expect(elem).toHaveClass("visible");
  });

  it("is displayed when only `volcanicEruptions` config option is enabled", () => {
    store.volcanicEruptions = true;
    store.earthquakes = false;
    render(<Caveat simulationStore={store} />);
    const elem = screen.getByText(expectedText);
    expect(elem).toHaveClass("visible");
  });
});
