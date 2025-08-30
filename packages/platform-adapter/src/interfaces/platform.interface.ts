/**
 * Main platform interface that all implementations must provide
 */

import { IUserInterface } from './ui.interface';
import { IFileSystem } from './filesystem.interface';
import { IConfiguration } from './configuration.interface';
import { ISecretStorage } from './secrets.interface';
import { IProcessManager } from './process.interface';

export interface IPlatform {
  /**
   * Platform name (cli, vscode, mcp)
   */
  readonly name: string;
  
  /**
   * Platform version
   */
  readonly version: string;
  
  /**
   * User interface operations
   */
  readonly ui: IUserInterface;
  
  /**
   * File system operations
   */
  readonly fs: IFileSystem;
  
  /**
   * Configuration management
   */
  readonly config: IConfiguration;
  
  /**
   * Secret storage operations
   */
  readonly secrets: ISecretStorage;
  
  /**
   * Process execution manager
   */
  readonly process: IProcessManager;
  
  /**
   * Initialize the platform
   */
  initialize(): Promise<void>;
  
  /**
   * Cleanup resources
   */
  dispose(): Promise<void>;
  
  /**
   * Check if a feature is supported
   */
  isFeatureSupported(feature: PlatformFeature): boolean;
}

export enum PlatformFeature {
  FileWatching = 'fileWatching',
  SecretStorage = 'secretStorage',
  ProcessExecution = 'processExecution',
  RichUI = 'richUI',
  Notifications = 'notifications',
  TreeViews = 'treeViews',
  WebViews = 'webViews',
  StatusBar = 'statusBar'
}