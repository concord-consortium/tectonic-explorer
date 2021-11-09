import React from "react";
import { mount } from "enzyme";
import { MapTypeButton } from "../../js/components/map-type-button";

const mockSetColorMap = jest.fn();

describe("Map Type button", () => {

  beforeEach(() => {
    mockSetColorMap.mockReset();
  });

  it("displays by default", () => {
    const wrapper = mount(
      <MapTypeButton colorMap="topo" onSetColorMap={mockSetColorMap} />
    );
    expect(wrapper.html()).toEqual(expect.stringContaining('data-test="map-type-button"'));
    expect(wrapper.html()).toEqual(expect.stringContaining('data-test="prev-map-type-button"'));
    expect(wrapper.html()).toEqual(expect.stringContaining('data-test="next-map-type-button"'));
  });
  it("can navigate color maps", () => {
    const wrapper = mount(
      <MapTypeButton colorMap="topo" onSetColorMap={mockSetColorMap} />
    );
    wrapper.find('[data-test="next-map-type-button"]').at(0).simulate("click");
    expect(mockSetColorMap).toHaveBeenCalledTimes(1);
    expect(mockSetColorMap).toHaveBeenLastCalledWith("plate");
    wrapper.find('[data-test="prev-map-type-button"]').at(0).simulate("click");
    expect(mockSetColorMap).toHaveBeenCalledTimes(2);
    expect(mockSetColorMap).toHaveBeenLastCalledWith("rock");
  });
});
