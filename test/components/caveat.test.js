import React from "react";
import { mount } from "enzyme";
import Caveat from "../../js/components/caveat-notice";

describe("Caveat component", () => {
  let store;
  beforeEach(() => {
    // Restore config as it can be modified by tests.
    global.resetConfig();
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
    const wrapper = mount(<Caveat simulationStore={store} />);
    expect(wrapper.html()).toEqual(expect.stringContaining("The earthquakes and volcanic eruptions "));
  });

  it("is displayed when both `earthquakes` and `volcanicEruptions` options are enabled", () => {
    store.earthquakes = true;
    store.volcanicEruptions = true;
    const wrapper = mount(<Caveat simulationStore={store} />);
    expect(wrapper.find("div").at(0).hasClass("visible")).toEqual(true);
  });

  it("is hidden displayed when neither `earthquakes` and `volcanicEruptions` options are enabled", () => {
    store.earthquakes = false;
    store.volcanicEruptions = false;
    const wrapper = mount(<Caveat simulationStore={store} />);
    expect(wrapper.find("div").at(0).hasClass("visible")).toEqual(false);
  });

  it("is displayed when only`earthquakes` config option is enabled", () => {
    store.earthquakes = true;
    store.volcanicEruptions = false;
    const wrapper = mount(<Caveat simulationStore={store} />);
    expect(wrapper.find("div").at(0).hasClass("visible")).toEqual(true);
  });

  it("is displayed when only `volcanicEruptions` config option is enabled", () => {
    store.volcanicEruptions = true;
    store.earthquakes = false;
    const wrapper = mount(<Caveat simulationStore={store} />);
    expect(wrapper.find("div").at(0).hasClass("visible")).toEqual(true);
  });
});
