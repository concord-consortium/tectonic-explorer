import React from "react";
import { inject, observer } from "mobx-react";
import { SortableContainer, SortableElement, SortableHandle } from "react-sortable-hoc";
import arrayMove from "array-move";
import { hsv } from "d3-hsv";
import FontIcon from "react-toolbox/lib/font_icon";
import config from "../config";
import { BaseComponent, IBaseProps } from "./base";
import PlateStore from "../stores/plate-store";

import "../../css/sortable-densities.less";

function hueToBackground(hue: any) {
  const rgb = hsv(hue, 1, 0.4).rgb();
  return { backgroundColor: "rgb(" + Math.floor(rgb.r) + ", " + Math.floor(rgb.g) + ", " + Math.floor(rgb.b) + ")" };
}

const DragHandle = SortableHandle(() => <FontIcon value="menu" className="hamburger-menu" />);

const SortableItem = SortableElement(({ plateInfo }: any) =>
  <li data-test="density-button" className="density-button-container" style={hueToBackground(plateInfo.hue)}>
    <div className="shading-box">
      <DragHandle />
      <div className="density-button">
        { plateInfo.label }
      </div>
    </div>
  </li>
);

const SortableList = SortableContainer(({ plateInfos }: any) => {
  return (
    <ul>
      { plateInfos.map((plateInfo: any, index: any) => (<SortableItem key={`item-${index}`} index={index} plateInfo={plateInfo} />)) }
    </ul>
  );
});

interface IState {}

@inject("simulationStore")
@observer
export default class SortableDensities extends BaseComponent<IBaseProps, IState> {
  constructor(props: any) {
    super(props);
    this.onSortEnd = this.onSortEnd.bind(this);
    this.updateDensities = this.updateDensities.bind(this);
  }

  get plateInfos() {
    // Convert props into an array of object that works with react-sortable component.
    return this.props.simulationStore?.model.sortedPlates.map((plate: PlateStore) => ({
      id: plate.id,
      hue: plate.hue,
      density: plate.density,
      label: "Plate " + (plate.id + 1)
    })) || [];
  }

  updateDensities(newPlateInfos: any) {
    const newDensities: Record<string, any> = {};
    newPlateInfos.forEach((plateInfo: any, index: number) => {
      newDensities[plateInfo.id] = index;
    });
    this.simulationStore.setDensities(newDensities);
  }

  onSortEnd({ oldIndex, newIndex }: { oldIndex: number, newIndex: number }) {
    this.updateDensities(arrayMove(this.plateInfos, oldIndex, newIndex));
  }

  render() {
    return (
      <div>
        <div className="densities">
          { config.densityWordInPlanetWizard ? "LOW" : "ABOVE" }
          <SortableList plateInfos={this.plateInfos} onSortEnd={this.onSortEnd} useDragHandle={false} />
          { config.densityWordInPlanetWizard ? "HIGH" : "BELOW" }
        </div>
        <div className="helper-text">
          { 
            config.densityWordInPlanetWizard
              ? "Click and drag to reorder the plate density"
              : "Click and drag to reorder the plates" 
          }
        </div>
      </div>
    );
  }
}
