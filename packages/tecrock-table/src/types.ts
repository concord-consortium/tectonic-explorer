import { IAuthoringInteractiveMetadata } from "@concord-consortium/lara-interactive-api";

export interface IAuthoredState extends IAuthoringInteractiveMetadata {
  version: number;
  dataSourceInteractive?: string;
  hint?: string;
  checkData?: boolean;
  requiredRockTypes?: string[];
}
