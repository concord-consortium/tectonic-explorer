import { observer } from "mobx-react";
import * as React from "react";
import { DraggableDialog } from "./draggable-dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContentText from "@mui/material/DialogContentText";
import { BoundaryOrientation, BoundaryType, IBoundaryInfo, IVector2 } from "../types";
import { plateHues } from "../plates-model/plate";
import BoundarySvg from "../assets/boundary.svg";
import PlateArrow from "../assets/plate-arrow.svg";

import css from "./boundary-config-dialog.scss";

interface IProps {
  boundary: IBoundaryInfo | null;
  offset: IVector2;
  getPlateHue: (plateId?: number) => number | undefined;
  onAssign: (type: BoundaryType) => void;
  onClose: () => void;
}
// patterned after https://mui.com/components/dialogs/#draggable-dialog
const BoundaryConfigDialog = ({ boundary, offset, getPlateHue, onAssign, onClose }: IProps) => {
  return (boundary &&
    <DraggableDialog
      offset={offset}
      onClose={onClose}
      backdrop={false}
      title="Plate Boundary Type"
    >
      <div className={css.boundaryConfigDialog}>
        <DialogActions>
          <BoundaryOption boundary={boundary} type="convergent" getPlateHue={getPlateHue} onAssign={onAssign}/>
          <BoundaryOption boundary={boundary} type="divergent" getPlateHue={getPlateHue} onAssign={onAssign}/>
        </DialogActions>
      </div>
    </DraggableDialog>
  );
};
export default BoundaryConfigDialog;

// The spec contains a mapping from plate color to arrow color.
// The code determines the plate color from the plate's hue value and its elevation.
// For this purpose we statically map the spec's plate colors to hue using https://htmlcolors.com/hex-to-hsl.
// Then in code we find the entry with the hue closest to the plate's hue.
// The entry index is then turned into a color class so that the actual arrow colors are in the .less file.
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
