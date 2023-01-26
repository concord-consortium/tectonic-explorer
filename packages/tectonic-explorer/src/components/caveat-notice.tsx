import React from "react";
import { inject, observer } from "mobx-react";
import { IBaseProps, BaseComponent } from "./base";

import css from "./caveat-notice.scss";

interface IState {}

@inject("simulationStore")
@observer
export default class Caveat extends BaseComponent<IBaseProps, IState> {
  render() {
    const { earthquakes, volcanicEruptions } = this.simulationStore;
    const caveatDisplay = earthquakes || volcanicEruptions ? css.caveat + " " + css.visible : css.caveat;
    return (
      <div className={caveatDisplay}>
        The earthquakes and volcanic eruptions in this model do not represent actual frequency or duration.
        Because of the timescale of this model, only a very small number of these events are represented to
        highlight where they might occur.
      </div>
    );
  }
}
