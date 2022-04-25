import React, { useEffect, useMemo, useState } from "react";
import throttle from "lodash/throttle";
import TempPressureToolBackSvg from "../../images/temp-pressure-tool-back.svg";
import PressureToolSvg from "../../images/pressure-tool.svg";
import PressureToolNeedleSvg from "../../images/pressure-tool-needle.svg";
import TemperatureToolSvg from "../../images/temp-tool.svg";
import TemperaturePressureCursor from "../../images/temp-pressure-cursor.png";
import { SimulationStore } from "../stores/simulation-store";

import "../../css/temp-pressure-overlay.less";

interface ICursorPosition {
  x: number;
  y: number;
}

interface IProps {
  simulationStore: SimulationStore;
}
export const TempPressureOverlay = ({ simulationStore }: IProps) => {
  const { isCursorOverCrossSection: showCursor, measuredPressure, measuredTemperature } = simulationStore;
  const [position, setPosition] = useState<ICursorPosition | undefined>();
  const showTempPressure = (measuredPressure != null) && (measuredTemperature != null) && (position != null);

  const handleMouseMove = useMemo(() => throttle((e: MouseEvent) => {
    setPosition({ x: e.clientX, y: e.clientY });
  }, 17), []);

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove, true);
    return () => document.removeEventListener("mousemove", handleMouseMove, true);
  }, [handleMouseMove]);

  const overlayStyle: React.CSSProperties = {
    display: showCursor || showTempPressure ? "block" : "none",
    left: position ? position.x + 12 : -9999,
    top: position ? position.y - 33 : -9999
  };
  const tempPressureStyle: React.CSSProperties = {
    display: showTempPressure ? "block" : "none"
  };
  const tempPressureGridStyle: React.CSSProperties = {
    display: showTempPressure ? "grid" : "none"
  };

  const temperatureValue = valueToString(measuredTemperature);
  const pressureValue = valueToString(measuredPressure);

  return (
    <div className="temp-pressure-overlay" style={overlayStyle}>
      <img className="temp-pressure-cursor" src={TemperaturePressureCursor} />
      <TempPressureToolBackSvg style={tempPressureStyle}/>
      <div className="temp-pressure-grid" style={tempPressureGridStyle}>
        <TemperatureTool value={temperatureValue} />
        <PressureTool value={pressureValue} />
        <div>{ temperatureValue }</div>
        <div>{ pressureValue }</div>
      </div>
    </div>
  );
};

function valueToString(value: number | null) {
  if (value == null) return "";
  if (value <= 0.50) return "Low";
  if (value <= 0.75) return "Med";
  return "High";
}

interface IToolProps {
  value: string;
}
const TemperatureTool = ({ value }: IToolProps) => {
  const stemStyle: React.CSSProperties = (value === "") ? { display: "none" } : {};

  return (
    <div className="tool-container temperature">
      <TemperatureToolSvg/>
      <div className={`temperature-stem ${value}`} style={stemStyle} />
    </div>
  );
};
const PressureTool = ({ value }: IToolProps) => {
  const needleStyle: React.CSSProperties = (value === "") ? { display: "none" } : {};

  return (
    <div className="tool-container pressure">
      <PressureToolSvg/>
      <PressureToolNeedleSvg className={`pressure-needle ${value}`} style={needleStyle} />
    </div>
  );
};
