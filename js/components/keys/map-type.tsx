import React from "react";
import { inject, observer } from "mobx-react";
import { CrustAgeKey } from "./crust-age-key";
import { ElevationKey } from "./elevation-key";
import { PlateColorKey } from "./plate-color-key";
import { BaseComponent, IBaseProps } from "../base";

interface IState {}

@inject("simulationStore")
@observer
export class MapType extends BaseComponent<IBaseProps, IState> {

  render() {
    const { colormap, model } = this.simulationStore;

    switch (colormap) {
    case "age": return <CrustAgeKey/>;
    case "topo": return <ElevationKey/>;
    case "plate": return <PlateColorKey model={model} />;
    }

    return null;
  }
}
