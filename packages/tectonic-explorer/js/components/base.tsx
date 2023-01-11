import React from "react";
import { SimulationStore } from "../stores/simulation-store";

export interface IBaseProps {
  simulationStore?: SimulationStore;
}

export class BaseComponent<P extends IBaseProps, S> extends React.Component<P, S> {
  // this assumes that stores are injected by the classes that extend BaseComponent
  get simulationStore() {
    return this.props.simulationStore as SimulationStore;
  }
}
