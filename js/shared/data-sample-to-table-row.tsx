import React from "react";
import TempToolLow from "./temp-tool/temp-tool-w-stem-low.svg";
import TempToolMed from "./temp-tool/temp-tool-w-stem-med.svg";
import TempToolHigh from "./temp-tool/temp-tool-w-stem-high.svg";
import PressureToolLow from "./pressure-tool/pressure-tool-w-needle-low.svg";
import PressureToolMed from "./pressure-tool/pressure-tool-w-needle-med.svg";
import PressureToolHigh from "./pressure-tool/pressure-tool-w-needle-high.svg";
import { RockSampleColumnName, IDataSample } from "./types";
import { rockInfo } from "./rock-info";

const TempTool = {
  Low: <TempToolLow />,
  Med: <TempToolMed />,
  High: <TempToolHigh />
};
const PressureTool = {
  Low: <PressureToolLow />,
  Med: <PressureToolMed />,
  High: <PressureToolHigh />
};

export const dataSampleToTableRow = (dataSample: IDataSample): Record<RockSampleColumnName, JSX.Element | string | undefined> => {
  const rockLabel = dataSample.rockLabel;
  const derivedInfo = rockInfo[rockLabel];
  if (!derivedInfo) throw new Error(`No rock info found for rock label: ${rockLabel}`);

  return {
    type: (
      <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
        { typeof derivedInfo.pattern === "string" ? <img src={derivedInfo.pattern} /> : derivedInfo.pattern }
        <div>{ rockLabel }</div>
      </div>
    ),
    temperatureAndPressure: (
      <div style={{ display: "inline-flex" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          { dataSample.temperature && TempTool[dataSample.temperature] }
          <div>{ dataSample.temperature }</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginLeft: "10px" }}>
          { dataSample.pressure && PressureTool[dataSample.pressure] }
          <div>{ dataSample.pressure }</div>
        </div>
      </div>
    ),
    notes: dataSample.notes,
    category: derivedInfo.category,
    ironContent: derivedInfo.ironContent,
    cooling: derivedInfo.cooling,
    metamorphicGrade: derivedInfo.metamorphicGrade,
    particlesSize: derivedInfo.particlesSize,
    magmaTemperature: derivedInfo.magmaTemperature
  };
};
