import React from "react";
import { PressureTool, TemperatureTool } from "../components/temp-pressure-overlay";
import { IDataSample } from "../types";
import { rockInfo } from "./rock-info";
import { RockSampleColumnName } from "./types";

export const dataSampleToTableRow = (dataSample: IDataSample): Record<RockSampleColumnName, JSX.Element | string | undefined> => {
  const rockLabel = dataSample.rockLabel;
  const derivedInfo = rockInfo[rockLabel];
  if (!derivedInfo) throw new Error(`No rock info found for rock label: ${rockLabel}`);

  return {
    type: (
      <div>
        <img src={derivedInfo.pattern} />
        <div>{ rockLabel }</div>
      </div>
    ),
    temperatureAndPressure: (
      <div>
        <div>
          <TemperatureTool value={dataSample.temperature} />
          <div>{ dataSample.temperature }</div>
        </div>
        <div>
          <PressureTool value={dataSample.temperature} />
          <div>{ dataSample.pressure }</div>
        </div>
      </div>
    ),
    category: derivedInfo.category,
    ironContent: derivedInfo.ironContent,
    cooling: derivedInfo.cooling,
    metamorphicGrade: derivedInfo.metamorphicGrade
  };
};
