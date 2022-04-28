import { observer } from "mobx-react";
import React, { CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import TempPressureToolBackSvg from "../../images/temp-pressure-tool-back.svg";
import PressureToolSvg from "../../images/pressure-tool.svg";
import PressureToolNeedleSvg from "../../images/pressure-tool-needle.svg";
import TemperatureToolSvg from "../../images/temp-tool.svg";
import TemperaturePressureCursor from "../../images/temp-pressure-cursor.png";
import { SimulationStore } from "../stores/simulation-store";
import { useAnimationFrame } from "./use-animation-frame";
import { TempPressureValue } from "../plates-model/get-temp-and-pressure";

import "../../css/temp-pressure-overlay.less";

interface ICursorPosition {
  x: number;
  y: number;
}

interface IProps {
  simulationStore: SimulationStore;
}
export const TempPressureOverlay = observer(({ simulationStore }: IProps) => {
  const { isCursorOverCrossSection: showCursor, measuredPressure, measuredTemperature } = simulationStore;
  const cursorPosition = useRef<ICursorPosition>();
  const [overlayPosition, setOverlayPosition] = useState<CSSProperties | undefined>();
  const showTempPressure = (measuredPressure != null) && (measuredTemperature != null) && (overlayPosition != null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    cursorPosition.current = ({ x: e.clientX, y: e.clientY });
  }, []);

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove, true);
    return () => document.removeEventListener("mousemove", handleMouseMove, true);
  }, [handleMouseMove]);

  useAnimationFrame(useCallback(() => {
    const { x, y } = cursorPosition.current || {};
    if (x != null && y != null) {
      setOverlayPosition({ left: x + 12, top: y - 33 });
    }
  }, []));

  const overlayStyle: CSSProperties = {
    display: showCursor || showTempPressure ? "block" : "none",
    ...overlayPosition
  };
  const tempPressureStyle: CSSProperties = {
    display: showTempPressure ? "block" : "none"
  };
  const tempPressureGridStyle: CSSProperties = {
    display: showTempPressure ? "grid" : "none"
  };

  return (
    <div className="temp-pressure-overlay" style={overlayStyle}>
      <img className="temp-pressure-cursor" src={TemperaturePressureCursor} />
      <TempPressureToolBackSvg style={tempPressureStyle}/>
      <div className="temp-pressure-grid" style={tempPressureGridStyle}>
        <TemperatureTool value={measuredTemperature} />
        <PressureTool value={measuredPressure} />
        <div>{ measuredTemperature }</div>
        <div>{ measuredPressure }</div>
      </div>
    </div>
  );
});

interface IToolProps {
  value: TempPressureValue | null;
}
const TemperatureTool = ({ value }: IToolProps) => {
  const stemStyle: CSSProperties = (value === null) ? { display: "none" } : {};

  return (
    <div className="tool-container temperature">
      <TemperatureToolSvg/>
      <div className={`temperature-stem ${value}`} style={stemStyle} />
    </div>
  );
};
const PressureTool = ({ value }: IToolProps) => {
  const needleStyle: CSSProperties = (value === null) ? { display: "none" } : {};

  return (
    <div className="tool-container pressure">
      <PressureToolSvg/>
      <PressureToolNeedleSvg className={`pressure-needle ${value}`} style={needleStyle} />
    </div>
  );
};
