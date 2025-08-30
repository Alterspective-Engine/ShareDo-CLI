/**
 * Secure Token Manager
 * 
 * Handles authentication tokens securely without exposing them in logs or errors
 */

import * as vscode from 'vscode';
import { Inform } from '../Utilities/inform';

export class SecureTokenManager {
    private static instance: SecureTokenManager;
    private tokenStore: Map<string, string> = new Map();
    private tokenMask = '***REDACTED***';
    
    private constructor() {
        // Clear tokens on extension deactivation
        this.setupCleanup();
    }
    
    public static getInstance(): SecureTokenManager {
        if (!SecureTokenManager.instance) {
            SecureTokenManager.instance = new SecureTokenManager();
        }
        return SecureTokenManager.instance;
    }
    
    /**
     * Store a token securely
     */
    public storeToken(key: string, token: string): void {
        if (!token || token.length === 0) {
            return;
        }
        
        // Never log the actual token
        Inform.writeInfo(`🔐 Token stored for key: ${key} (length: ${token.length})`);
        
        this.tokenStore.set(key, token);
        
        // Set expiration timer (tokens expire after 1 hour)
        setTimeout(() => {
            this.clearToken(key);
        }, 3600000); // 1 hour
    }
    
    /**
     * Retrieve a token
     */
    public getToken(key: string): string | undefined {
        const token = this.tokenStore.get(key);
        
        if (token) {
            // Never log the actual token
            Inform.writeInfo(`🔐 Token retrieved for key: ${key}`);
        }
        
        return token;
    }
    
    /**
     * Clear a specific token
     */
    public clearToken(key: string): void {
        if (this.tokenStore.has(key)) {
            const token = this.tokenStore.get(key);
            this.tokenStore.delete(key);
            
            // Overwrite the token in memory
            if (token) {
                this.overwriteString(token);
            }
            
            Inform.writeInfo(`🔐 Token cleared for key: ${key}`);
        }
    }
    
    /**
     * Clear all tokens
     */
    public clearAllTokens(): void {
        // Overwrite all tokens in memory before clearing
        for (const [key, token] of this.tokenStore.entries()) {
            this.overwriteString(token);
        }
        
        this.tokenStore.clear();
        Inform.writeInfo(`🔐 All tokens cleared`);
    }
    
    /**
     * Sanitize error messages to remove tokens
     */
    public sanitizeError(error: any): string {
        let errorMessage = String(error);
        
        // Replace any tokens in the error message
        for (const [_, token] of this.tokenStore.entries()) {
            if (token && errorMessage.includes(token)) {
                errorMessage = errorMessage.replace(new RegExp(token, 'g'), this.tokenMask);
            }
        }
        
        // Also look for common token patterns
        errorMessage = this.sanitizeCommonTokenPatterns(errorMessage);
        
        return errorMessage;
    }
    
    /**
     * Sanitize log messages to remove tokens
     */
    public sanitizeLog(message: string): string {
        let sanitized = message;
        
        // Replace any stored tokens
        for (const [_, token] of this.tokenStore.entries()) {
            if (token && sanitized.includes(token)) {
                sanitized = sanitized.replace(new RegExp(token, 'g'), this.tokenMask);
            }
        }
        
        // Also sanitize common patterns
        sanitized = this.sanitizeCommonTokenPatterns(sanitized);
        
        return sanitized;
    }
    
    /**
     * Create secure headers with token
     */
    public createSecureHeaders(key: string): Record<string, string> {
        const token = this.getToken(key);
        const headers: Record<string, string> = {};
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    }
    
    /**
     * Validate token format (basic validation)
     */
    public isValidToken(token: string): boolean {
        if (!token || token.length < 10) {
            return false;
        }
        
        // Check for common invalid patterns
        if (token === 'undefined' || token === 'null' || token === this.tokenMask) {
            return false;
        }
        
        // Basic JWT format check (three parts separated by dots)
        if (token.includes('.')) {
            const parts = token.split('.');
            if (parts.length === 3) {
                return true;
            }
        }
        
        // Accept other token formats (API keys, etc.)
        return true;
    }
    
    /**
     * Sanitize common token patterns
     */
    private sanitizeCommonTokenPatterns(text: string): string {
        // JWT tokens
        text = text.replace(/eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g, this.tokenMask);
        
        // Bearer tokens in headers
        text = text.replace(/Bearer\s+[A-Za-z0-9-_\.]+/gi, `Bearer ${this.tokenMask}`);
        
        // API keys (common patterns)
        text = text.replace(/api[_-]?key["\s:=]+["']?[A-Za-z0-9-_]{20,}["']?/gi, `api_key="${this.tokenMask}"`);
        text = text.replace(/token["\s:=]+["']?[A-Za-z0-9-_]{20,}["']?/gi, `token="${this.tokenMask}"`);
        
        // URLs with tokens
        text = text.replace(/(\?|&)(token|api_key|auth)=[A-Za-z0-9-_]+/gi, `$1$2=${this.tokenMask}`);
        
        return text;
    }
    
    /**
     * Overwrite string in memory (best effort)
     */
    private overwriteString(str: string): void {
        try {
            // This is a best-effort approach to overwrite the string in memory
            // JavaScript doesn't guarantee this will work, but it's better than nothing
            const buffer = Buffer.from(str);
            buffer.fill(0);
        } catch {
            // Ignore errors - this is best effort
        }
    }
    
    /**
     * Setup cleanup handlers
     */
    private setupCleanup(): void {
        // Clear tokens when extension is deactivated
        const disposable = new vscode.Disposable(() => {
            this.clearAllTokens();
        });
        
        // Register for disposal
        if (vscode.extensions.getExtension('sharedo.sharedo-vscode-extension')) {
            vscode.extensions.getExtension('sharedo.sharedo-vscode-extension')?.exports?.subscriptions?.push(disposable);
        }
        
        // Also clear on process exit
        process.on('exit', () => {
            this.clearAllTokens();
        });
        
        process.on('SIGINT', () => {
            this.clearAllTokens();
            process.exit(0);
        });
        
        process.on('SIGTERM', () => {
            this.clearAllTokens();
            process.exit(0);
        });
    }
}