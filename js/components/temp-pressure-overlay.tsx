import React, { useEffect, useMemo, useState } from "react";
import throttle from "lodash/throttle";
import TempPressureToolBackSvg from "../../images/temp-pressure-tool-back.svg";
import PressureToolSvg from "../../images/pressure-tool.svg";
import PressureToolNeedleSvg from "../../images/pressure-tool-needle.svg";
import TemperatureToolSvg from "../../images/temp-tool.svg";
import { SimulationStore } from "../stores/simulation-store";

import "../../css/temp-pressure-overlay.less";

interface ICursorPosition {
  x: number;
  y: number;
}

interface IProps {
  parentRef: React.RefObject<HTMLDivElement>;
  simulationStore: SimulationStore;
}
export const TempPressureOverlay = ({ parentRef, simulationStore }: IProps) => {
  const { measuredPressure, measuredTemperature } = simulationStore;
  const [position, setPosition] = useState<ICursorPosition | undefined>();
  const showOverlay = (measuredPressure != null) && (measuredTemperature != null) && (position != null);

  const handleMouseMove = useMemo(() => throttle((e: MouseEvent) => {
    setPosition({ x: e.clientX, y: e.clientY });
  }, 17), []);

  useEffect(() => {
    const parent = parentRef.current;
    parent?.addEventListener("mousemove", handleMouseMove, true);
    return () => parent?.removeEventListener("mousemove", handleMouseMove, true);
  }, [handleMouseMove, parentRef]);

  const style: React.CSSProperties = {
    display: showOverlay ? "block" : "none",
    left: position ? position.x + 12 : -9999,
    top: position ? position.y - 33 : -9999
  };

  const temperatureValue = valueToString(measuredTemperature);
  const pressureValue = valueToString(measuredPressure);

  return (
    <div className="temp-pressure-overlay" style={style}>
      <TempPressureToolBackSvg />
      <div className="temp-pressure-grid">
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
