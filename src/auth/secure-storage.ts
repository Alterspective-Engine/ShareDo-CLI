import * as crypto from 'crypto';
import { ITokenResponse } from './interfaces';

/**
 * SecureStorage provides encrypted storage for sensitive data like tokens
 * Uses AES-256-GCM encryption with a derived key
 */
export class SecureStorage {
  private encryptionKey: Buffer;
  private cache: Map<string, { data: string; expiry?: Date }> = new Map();
  
  constructor(masterKey?: string) {
    // In production, this should come from environment variable or secure key management
    const key = masterKey || process.env.SHAREDO_MASTER_KEY || 'default-key-change-in-production';
    // Derive a proper encryption key from the master key
    this.encryptionKey = crypto.scryptSync(key, 'salt', 32);
  }

  /**
   * Encrypts and stores sensitive data
   */
  store(key: string, data: any, ttlSeconds?: number): void {
    const jsonData = JSON.stringify(data);
    const encrypted = this.encrypt(jsonData);
    
    const expiry = ttlSeconds 
      ? new Date(Date.now() + ttlSeconds * 1000)
      : undefined;
    
    this.cache.set(key, { data: encrypted, expiry });
  }

  /**
   * Retrieves and decrypts sensitive data
   */
  retrieve<T>(key: string): T | null {
    const stored = this.cache.get(key);
    
    if (!stored) {
      return null;
    }
    
    // Check expiry
    if (stored.expiry && stored.expiry < new Date()) {
      this.cache.delete(key);
      return null;
    }
    
    try {
      const decrypted = this.decrypt(stored.data);
      return JSON.parse(decrypted) as T;
    } catch (error) {
      // If decryption fails, remove the corrupted data
      this.cache.delete(key);
      return null;
    }
  }

  /**
   * Removes data from storage
   */
  remove(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clears all stored data
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Encrypts data using AES-256-GCM
   */
  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Combine iv, authTag, and encrypted data
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypts data using AES-256-GCM
   */
  private decrypt(encryptedData: string): string {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Securely stores a token
   */
  storeToken(token: ITokenResponse): void {
    // Store with TTL slightly less than token expiry to ensure freshness
    const ttl = token.expires_in ? token.expires_in - 60 : 3600;
    this.store('current_token', token, ttl);
    
    if (token.refresh_token) {
      // Refresh tokens typically have longer TTL
      this.store('refresh_token', token.refresh_token, 86400 * 30); // 30 days
    }
  }

  /**
   * Retrieves the stored token
   */
  getToken(): ITokenResponse | null {
    return this.retrieve<ITokenResponse>('current_token');
  }

  /**
   * Retrieves the refresh token
   */
  getRefreshToken(): string | null {
    return this.retrieve<string>('refresh_token');
  }
}