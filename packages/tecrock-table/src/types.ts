import { IAuthoringInteractiveMetadata } from "@concord-consortium/lara-interactive-api";
import { ITectonicExplorerInteractiveState, RockKeyLabelArray } from "@concord-consortium/tecrock-shared";

export interface IAuthoredState extends IAuthoringInteractiveMetadata {
  version: number;
  dataSourceInteractive?: string;
  hint?: string;
  checkData?: boolean;
  requiredRockTypes?: RockKeyLabelArray;
}

export interface IInteractiveTableState {
  version: 1;
  linkedStateHash?: string;
  checkDataHash?: string;
  checkData?: boolean;
  requiredRockTypes?: RockKeyLabelArray;
}

export interface IInteractiveState extends ITectonicExplorerInteractiveState {
  tableState: IInteractiveTableState;
}
