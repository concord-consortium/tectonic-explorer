import React from "react";
import { Provider } from "mobx-react";
import { mount } from "enzyme";
import ColorKey from "../../js/components/color-key";

describe("Color Key component", () => {
  let store: any;
  beforeEach(() => {
    (global as any).resetConfig();
    store = {
      model: {
        plates: []
      },
      earthquakes: false,
      volcanicEruptions: false,
      crossSectionVisible: false,
      key: true,
      setOption: jest.fn()
    };
  });

  it("displays by default", () => {
    const wrapper = mount(
      <Provider simulationStore={store}>
        <ColorKey />
      </Provider>
    );
    expect(wrapper.html()).toEqual(expect.stringContaining('data-test="color-key-plates"'));
  });
  it("can toggle the key", () => {
    const wrapper = mount(
      <Provider simulationStore={store}>
        <ColorKey />
      </Provider>
    );
    wrapper.find('[data-test="key-close-button"]').at(0).simulate("click");
    expect(store.setOption).toHaveBeenLastCalledWith("key", false);
  });
  it("can display earthquake key", () => {
    store.key = true;
    store.earthquakes = true;
    const wrapper = mount(
      <Provider simulationStore={store}>
        <ColorKey />
      </Provider>
    );
    expect(wrapper.html()).toEqual(expect.stringContaining('data-test="color-key-earthquakes"'));
  });
  it("can display volcano key", () => {
    store.key = true;
    store.volcanicEruptions = true;
    const wrapper = mount(
      <Provider simulationStore={store}>
        <ColorKey />
      </Provider>
    );
    expect(wrapper.html()).toEqual(expect.stringContaining('data-test="color-key-volcanic-eruptions"'));
  });
  it("can display cross-section key", () => {
    store.key = true;
    store.crossSectionVisible = true;
    const wrapper = mount(
      <Provider simulationStore={store}>
        <ColorKey />
      </Provider>
    );
    expect(wrapper.html()).toEqual(expect.stringContaining('data-test="color-key"'));
  });
});
