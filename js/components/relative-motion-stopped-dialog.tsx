import * as React from "react";
import { DraggableDialog } from "./draggable-dialog";

import css from "../../css-modules/relative-motion-stopped-dialog.less";

interface IProps {
  onClose: () => void;
}

// patterned after https://mui.com/components/dialogs/#draggable-dialog
export const RelativeMotionStoppedDialog = ({ onClose }: IProps) => {
  return (
    <DraggableDialog
      title="Model Stopped"
      onClose={onClose}
      backdrop={false}
      initialPosition={{ vertical: "center", horizontal: "left" }}
    >
      <div className={css.relativeMotionStoppedDialogContent}>
        <p> All tectonic plate interactions have reached their endpoint.<br/>No more plate movement is possible.</p>
        <br/>
        <p>Use the buttons in the toolbar to continue to explore this model or click <b>Reset Plates</b> to design a new model.</p>
      </div>
    </DraggableDialog>
  );
};
