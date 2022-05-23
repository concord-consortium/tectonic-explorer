import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MapTypeButton } from "../../js/components/map-type-button";

const mockSetColorMap = jest.fn();

describe("Map Type button", () => {

  beforeEach(() => {
    mockSetColorMap.mockReset();
  });

  it("displays by default", () => {
    render(
      <MapTypeButton colorMap="topo" onSetColorMap={mockSetColorMap} />
    );
    expect(screen.queryByTestId("map-type-button")).toBeInTheDocument();
    expect(screen.queryByTestId("prev-map-type-button")).toBeInTheDocument();
    expect(screen.queryByTestId("next-map-type-button")).toBeInTheDocument();
  });

  it("can navigate color maps", () => {
    render(
      <MapTypeButton colorMap="topo" onSetColorMap={mockSetColorMap} />
    );

    fireEvent.click(screen.getByTestId("next-map-type-button"));
    expect(mockSetColorMap).toHaveBeenCalledTimes(1);
    expect(mockSetColorMap).toHaveBeenLastCalledWith("plate");
    fireEvent.click(screen.getByTestId("prev-map-type-button"));
    expect(mockSetColorMap).toHaveBeenCalledTimes(2);
    expect(mockSetColorMap).toHaveBeenLastCalledWith("rock");
  });
});
