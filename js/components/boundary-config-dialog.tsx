import { observer } from "mobx-react";
import * as React from "react";
import Draggable from "react-draggable";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Paper, { PaperProps } from "@mui/material/Paper";
import { BoundaryOrientation, BoundaryType, IBoundaryInfo, IEventCoords } from "../types";
import CloseIcon from "../../images/rock-key/svg/close-icon.svg";
import BoundarySvg from "../../images/boundary.svg";
import PlateArrow from "../../images/plate-arrow.svg";

import css from "../../css-modules/boundary-config-dialog.less";

interface IProps {
  boundary: IBoundaryInfo | null;
  offset: IEventCoords;
  getPlateHue: (plateId?: number) => number | undefined;
  onAssign: (type: BoundaryType) => void;
  onClose: () => void;
}
// patterned after https://mui.com/components/dialogs/#draggable-dialog
const BoundaryConfigDialog = ({ boundary, offset, getPlateHue, onAssign, onClose }: IProps) => {

  function PaperComponent(props: PaperProps) {
    return (
      <Draggable
        defaultPosition={offset}
        bounds=".planet-wizard"
        handle="#draggable-dialog-title"
        cancel={'[class*="MuiDialogContent-root"]'}
      >
        <Paper {...props} />
      </Draggable>
    );
  }

  return (boundary &&
    <Dialog
      className={css.boundaryConfigDialog}
      open={!!boundary}
      onClose={onClose}
      PaperComponent={PaperComponent}
      aria-labelledby="draggable-dialog-title"
    >
      <DialogTitle style={{ cursor: "move" }} id="draggable-dialog-title">
        Plate Boundary Type
        <CloseIcon onClick={onClose} />
      </DialogTitle>
      <div className={css.dividerLine} />
      <DialogActions>
        <BoundaryOption boundary={boundary} type="convergent" getPlateHue={getPlateHue} onAssign={onAssign}/>
        <BoundaryOption boundary={boundary} type="divergent" getPlateHue={getPlateHue} onAssign={onAssign}/>
      </DialogActions>
    </Dialog>
  );
};
export default BoundaryConfigDialog;

// The spec contains a mapping from plate color to arrow color.
// The code determines the plate color from the plate's hue value and its elevation.
// For this purpose we statically map the spec's plate colors to hue using https://htmlcolors.com/hex-to-hsl.
// Then in code we find the entry with the hue closest to the plate's hue.
// The entry index is then turned into a color class so that the actual arrow colors are in the .less file.
const plateHues = [322, 126, 30, 263, 199, 34, 162, 69, 210, 301];

export function getArrowColorClassFromPlateHue(plateHue: number) {
  let hueIndex = 0;
  let minHueDistance = 180;
  plateHues.forEach((hue, index) => {
    let hueDistance = Math.abs(hue - plateHue);
    (hueDistance > 180) && (hueDistance -= 180);
    if (hueDistance < minHueDistance) {
      hueIndex = index;
      minHueDistance = hueDistance;
    }
  });
  return `arrow-color-${hueIndex}`;
}

type ArrowLocation = "top" | "bottom" | "left" | "right";
type ArrowDirection = "up" | "down" | "left" | "right";
interface IForceArrowProps {
  type: BoundaryType;
  location: ArrowLocation;
  plateHue: number;
}
const ForceArrow = ({ type, location, plateHue }: IForceArrowProps): JSX.Element | null => {
  const convergentDirectionMap: Record<ArrowLocation, ArrowDirection> =
          { left: "right", right: "left", top: "down", bottom: "up" };
  const divergentDirectionMap: Record<ArrowLocation, ArrowDirection> =
          { left: "left", right: "right", top: "up", bottom: "down" };
  const direction = (type === "convergent" ? convergentDirectionMap : divergentDirectionMap)[location];
  const colorClass = getArrowColorClassFromPlateHue(plateHue);
  return <PlateArrow className={`${css.arrow} ${css[direction]} ${css[colorClass]} ${location}`}/>;
};

interface IBoundaryImageProps {
  orientation: BoundaryOrientation;
  location: "top" | "bottom" | "middle";
}
const BoundaryImage = ({ orientation, location }: IBoundaryImageProps): JSX.Element | null => {
  return <BoundarySvg className={`${css.boundary} ${css[orientation]} ${location}`}/>;
};

interface IBoundaryOption {
  boundary: IBoundaryInfo;
  type: BoundaryType;
  getPlateHue: (plateId?: number) => number | undefined;
  onAssign: (type: BoundaryType) => void;
}
// observer so it updates when boundary type changes; if we pass a new boundary prop instead
// the entire dialog rerenders and the dialog reverts to its default position.
const BoundaryOption = observer(({ boundary, type, getPlateHue, onAssign }: IBoundaryOption) => {
  const selectedClass = type === boundary.type ? css.selected : "";
  const plate0Hue = getPlateHue(boundary.fields?.[0].plate.id) ?? plateHues[0];
  const plate1Hue = getPlateHue(boundary.fields?.[1].plate.id) ?? plateHues[1];
  return (
    <div className={`${css.boundaryOption} ${selectedClass}`} onClick={() => onAssign(type)}>
      <DialogContentText>
        { type === "convergent" ? "Convergent" : "Divergent" }
      </DialogContentText>
      {
        boundary.orientation === "northern-latitudinal" &&
          <>
            <ForceArrow type={type} plateHue={plate0Hue} location="top"/>
            <BoundaryImage orientation={boundary.orientation} location="bottom"/>
          </>
      }
      {
        boundary.orientation === "longitudinal" &&
          <div className={css.longitudinalContainer}>
            <ForceArrow type={type} plateHue={plate0Hue} location="left"/>
            <BoundaryImage orientation={boundary.orientation} location="middle"/>
            <ForceArrow type={type} plateHue={plate1Hue} location="right"/>
          </div>
      }
      {
        boundary.orientation === "southern-latitudinal" &&
          <>
            <BoundaryImage orientation={boundary.orientation} location="top" />
            <ForceArrow type={type} plateHue={plate1Hue} location="bottom"/>
          </>
      }
    </div>
  );
});
