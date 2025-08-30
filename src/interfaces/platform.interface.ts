import { IFileSystem } from './file-system.interface';
import { IUserInterface } from './user-interface.interface';
import { ILogger } from './logger.interface';
import { IStorage } from './storage.interface';

export interface IPlatform {
  fs: IFileSystem;
  ui: IUserInterface;
  logger: ILogger;
  storage: IStorage;
  
  getWorkspaceRoot(): string;
  getExtensionPath(): string;
  getPlatformName(): 'cli' | 'vscode' | 'mcp';
  getVersion(): string;
}
