/**
 * @sharedo/platform-adapter - Platform abstraction interfaces
 */

// Main platform interface
export { IPlatform } from './interfaces/platform.interface';

// Sub-interfaces
export { IFileSystem } from './interfaces/file-system.interface';
export { IUserInterface, IProgress } from './interfaces/user-interface.interface';
export { ILogger } from './interfaces/logger.interface';
export { IStorage } from './interfaces/storage.interface';

// Types
export * from './types';
