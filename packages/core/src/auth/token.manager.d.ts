/**
 * Token manager for secure token storage
 */
import { ITokenManager } from './interfaces';
export declare class TokenManager implements ITokenManager {
    private tokens;
    /**
     * Get stored token
     */
    getToken(key: string): Promise<string | null>;
    /**
     * Store token with optional expiration
     */
    setToken(key: string, token: string, expiresIn?: number): Promise<void>;
    /**
     * Remove token
     */
    removeToken(key: string): Promise<void>;
    /**
     * Check if token is valid (not expired)
     */
    isTokenValid(token: string): boolean;
    /**
     * Clear all tokens
     */
    clear(): void;
}
