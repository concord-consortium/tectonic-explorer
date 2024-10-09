import React from "react";
import { BaseQuestionApp } from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import { ITectonicExplorerInteractiveState, rockKeyLabels } from "@concord-consortium/tecrock-shared";
import { IAuthoredState } from "../types";
import { Runtime } from "./runtime";
import { JSONSchema7 } from "json-schema";

const baseAuthoringProps = {
  schema: {
    type: "object",
    properties: {
      version: {
        type: "number",
        default: 1
      },
      prompt: {
        title: "Prompt",
        type: "string"
      },
      hint: {
        title: "Hint",
        type: "string"
      },
      checkData: {
        title: "Allow students to check data (Show Check Data button)",
        type: "boolean"
      },
      requiredRockTypes: {
        type: "array",
        title: "Required Rock Types",
        items: {
          type: "string",
          enum: rockKeyLabels
        },
        uniqueItems: true
      },
      dataSourceInteractive: {
        title: "Data Source Interactive (Tectonic Explorer)",
        type: "string",
        enum: [],
        enumNames: []
      }
    }
  } as JSONSchema7,

  uiSchema: {
    "ui:order": [
      "version", "prompt", "dataSourceInteractive", "hint", "checkData", "requiredRockTypes"
    ],
    version: {
      "ui:widget": "hidden"
    },
    prompt: {
      "ui:widget": "richtext"
    },
    hint: {
      "ui:widget": "richtext"
    },
    requiredRockTypes: {
      "ui:widget": "checkboxes"
    }
  }
};

export const App = () => (
  <BaseQuestionApp<IAuthoredState, ITectonicExplorerInteractiveState>
    Runtime={Runtime}
    baseAuthoringProps={baseAuthoringProps}
    disableAutoHeight={false}
    disableSubmitBtnRendering={true}
    linkedInteractiveProps={[ { label: "dataSourceInteractive" } ]}
  />
);
