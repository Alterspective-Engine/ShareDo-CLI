/**
 * Secret storage abstraction for secure credential management
 */

export interface ISecretStorage {
  /**
   * Get a secret value
   */
  get(key: string): Promise<string | undefined>;
  
  /**
   * Store a secret value
   */
  set(key: string, value: string): Promise<void>;
  
  /**
   * Delete a secret
   */
  delete(key: string): Promise<void>;
  
  /**
   * Check if a secret exists
   */
  has(key: string): Promise<boolean>;
  
  /**
   * Get all secret keys (not values)
   */
  keys(): Promise<string[]>;
  
  /**
   * Clear all secrets
   */
  clear(): Promise<void>;
  
  /**
   * Store multiple secrets
   */
  setMultiple(secrets: Record<string, string>): Promise<void>;
  
  /**
   * Get multiple secrets
   */
  getMultiple(keys: string[]): Promise<Record<string, string | undefined>>;
  
  /**
   * Delete multiple secrets
   */
  deleteMultiple(keys: string[]): Promise<void>;
  
  /**
   * Check if secret storage is available
   */
  isAvailable(): boolean;
  
  /**
   * Get storage provider name
   */
  getProvider(): string;
}