/**
 * Token manager for secure token storage
 */

import { ITokenManager } from './interfaces';

export class TokenManager implements ITokenManager {
    private tokens: Map<string, { token: string; expiresAt?: number }> = new Map();
    private cleanupInterval?: ReturnType<typeof setInterval>;

    constructor() {
        // Cleanup expired tokens every 5 minutes
        this.cleanupInterval = setInterval(() => this.cleanupExpired(), 300000);
    }

    /**
     * Cleanup expired tokens to prevent memory leak
     */
    private cleanupExpired(): void {
        const now = Date.now();
        for (const [key, stored] of this.tokens.entries()) {
            if (stored.expiresAt && stored.expiresAt < now) {
                this.tokens.delete(key);
            }
        }
    }

    /**
     * Get stored token
     */
    async getToken(key: string): Promise<string | null> {
        const stored = this.tokens.get(key);
        
        if (!stored) {
            return null;
        }

        // Check expiration
        if (stored.expiresAt && stored.expiresAt < Date.now()) {
            this.tokens.delete(key);
            return null;
        }

        return stored.token;
    }

    /**
     * Store token with optional expiration
     */
    async setToken(key: string, token: string, expiresIn?: number): Promise<void> {
        const stored: { token: string; expiresAt?: number } = { token };
        
        if (expiresIn) {
            stored.expiresAt = Date.now() + (expiresIn * 1000);
        }

        this.tokens.set(key, stored);
    }

    /**
     * Remove token
     */
    async removeToken(key: string): Promise<void> {
        this.tokens.delete(key);
    }

    /**
     * Check if token is valid (not expired)
     */
    isTokenValid(token: string): boolean {
        try {
            // Check if JWT
            const parts = token.split('.');
            if (parts.length === 3) {
                const payload = JSON.parse(
                    Buffer.from(parts[1], 'base64').toString('utf8')
                );
                
                if (payload.exp) {
                    return payload.exp * 1000 > Date.now();
                }
            }
            
            // If not JWT or no exp, assume valid
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Clear all tokens
     */
    clear(): void {
        this.tokens.clear();
    }

    /**
     * Destroy the token manager and cleanup resources
     */
    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = undefined;
        }
        this.tokens.clear();
    }
}