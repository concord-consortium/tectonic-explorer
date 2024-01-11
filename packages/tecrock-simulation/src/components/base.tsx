import React from "react";
import { SimulationStore } from "../stores/simulation-store";
import { observable } from "mobx";

export interface IBaseProps {
  simulationStore?: SimulationStore;
}

export class BaseComponent<P extends IBaseProps, S> extends React.Component<P, S> {
  // Since mobx-react v7, we cannot use props in reactive context. Hence, we need to copy props.simulationStore to
  // local observable. See:
  // https://github.com/mobxjs/mobx/blob/main/packages/mobx-react/README.md#note-on-using-props-and-state-in-derivations
  @observable observableSimulationStore: SimulationStore;

  constructor(props: P) {
    super(props);
    // sync the observable from props
    this.observableSimulationStore = props.simulationStore as SimulationStore;
  }

  componentDidUpdate(prevProps: IBaseProps, prevState: any): void {
    // sync the observable from props
    this.observableSimulationStore = this.props.simulationStore as SimulationStore;
  }

  // this assumes that stores are injected by the classes that extend BaseComponent
  get simulationStore() {
    return this.observableSimulationStore;
  }
}
