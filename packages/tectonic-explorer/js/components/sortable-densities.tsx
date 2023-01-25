import React from "react";
import { inject, observer } from "mobx-react";
import { SortableContainer, SortableContainerProps, SortableElement, SortableElementProps, SortableHandle } from "react-sortable-hoc";
import { arrayMoveImmutable } from "array-move";
import FontIcon from "react-toolbox/lib/font_icon";
import config from "../config";
import { BaseComponent, IBaseProps } from "./base";
import PlateStore from "../stores/plate-store";
import { log } from "../log";
import { hueToColor } from "../colors/utils";

import "../../css/sortable-densities.scss";

const DragHandle = SortableHandle(() => <FontIcon value="menu" className="hamburger-menu" />);

type PlateInfo = { hue: number, label: string };

interface ISortableItemProps extends SortableElementProps {
  plateInfo: PlateInfo;
}

const SortableItem: React.ComponentClass<ISortableItemProps> = SortableElement(({ plateInfo }: ISortableItemProps) =>
  <li data-test="density-button" className="density-button-container" style={{ backgroundColor: hueToColor(plateInfo.hue, "base") }}>
    <div className="shading-box">
      <DragHandle />
      <div className="density-button">
        { plateInfo.label }
      </div>
    </div>
  </li>
);

interface ISortableListProps extends SortableContainerProps {
  plateInfos: PlateInfo[];
}

const SortableList: React.ComponentClass<ISortableListProps> = SortableContainer(({ plateInfos }: ISortableListProps) => {
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

    log({ action: "PlateDensitiesUpdated", data: { value: newPlateInfos.map((p: any) => p.label) } });
  }

  onSortEnd({ oldIndex, newIndex }: { oldIndex: number, newIndex: number }) {
    this.updateDensities(arrayMoveImmutable(this.plateInfos, oldIndex, newIndex));
  }

  render() {
    return (
      <div>
        <div className="densities">
          <span>{ config.densityWordInPlanetWizard ? "LOW" : "ABOVE" }</span>
          <SortableList plateInfos={this.plateInfos} onSortEnd={this.onSortEnd} useDragHandle={false} helperClass="dragging-active" />
          <span>{ config.densityWordInPlanetWizard ? "HIGH" : "BELOW" }</span>
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
