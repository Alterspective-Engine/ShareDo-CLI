export type PlatformType = 'cli' | 'vscode' | 'mcp';

export interface PlatformConfig {
  name: string;
  version: string;
  type: PlatformType;
}
