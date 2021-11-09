import React from "react";
import { inject, observer } from "mobx-react";
import { Button } from "react-toolbox/lib/button";
import FontIcon from "react-toolbox/lib/font_icon";
import { BaseComponent, IBaseProps } from "./base";

import "../../css/interaction-selector.less";

const ICON: Record<string, string> = {
  "none": "3d_rotation",
  // "crossSection": "border_color",
  "continentDrawing": "blur_on",
  "continentErasing": "blur_off",
  "force": "vertical_align_center",
  "assignBoundary": "vertical_align_center"
};

export const INTERACTION_LABELS: Record<string, string> = {
  "none": "Rotate Camera",
  // "crossSection": "Draw Cross-section",
  "continentDrawing": "Draw Continents",
  "continentErasing": "Erase Continents",
  "force": "Draw Force Vectors",
  "assignBoundary": "Assign Boundary Types"
};

const TEST_LABELS: Record<string, string> = {
  "none": "rotate-camera",
  // "crossSection": "draw-cross-section",
  "continentDrawing": "draw-continents",
  "continentErasing": "erase-continents",
  "force": "draw-force-vectors",
  "assignBoundary": "assign-boundary-type"
};

interface IState {}

@inject("simulationStore")
@observer
export default class InteractionSelector extends BaseComponent<IBaseProps, IState> {
  renderInteractionButton(targetInteraction: any) {
    const { interaction, setInteraction } = this.simulationStore;
    const activeClass = targetInteraction === interaction ? "active" : "";
    const handler = () => {
      setInteraction(targetInteraction);
    };
    return (
      <Button key={targetInteraction} className={`large-button ${activeClass}`} data-test={TEST_LABELS[targetInteraction]} onClick={handler}>
        <FontIcon value={ICON[targetInteraction]} />
        <div className="label">{ INTERACTION_LABELS[targetInteraction] }</div>
      </Button>
    );
  }

  render() {
    const { selectableInteractions } = this.simulationStore;
    return (
      <div className="interaction-selector" data-test="interaction-selector">
        { selectableInteractions.map((name: any) => this.renderInteractionButton(name)) }
      </div>
    );
  }
}
