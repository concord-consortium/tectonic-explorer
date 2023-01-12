import { IAuthoringInteractiveMetadata, IDataset, IRuntimeInteractiveMetadata } from "@concord-consortium/lara-interactive-api";

export interface IAuthoredState extends IAuthoringInteractiveMetadata {
  version: number;
  dataSourceInteractive?: string;
}

export interface IInteractiveState extends IRuntimeInteractiveMetadata {}

// This should be kept in sync with the ITectonicExplorerInteractiveState in the tectonic-explorer repository.
export interface ITectonicExplorerInteractiveState extends IRuntimeInteractiveMetadata {
  dataset: IDataset;
  planetViewSnapshot?: string;
  crossSectionSnapshot?: string;
}
