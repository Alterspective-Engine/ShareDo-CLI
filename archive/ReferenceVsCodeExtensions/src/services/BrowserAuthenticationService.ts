/**
 * Browser Authentication Service
 * 
 * Handles browser-based authentication for ShareDo export operations.
 * Opens a browser window for login and captures authentication tokens/cookies.
 */

import * as vscode from 'vscode';
import { SecureTokenManager } from './SecureTokenManager';
import { Inform } from '../Utilities/inform';
import { SharedoClient } from '../sharedoClient';

export interface IBrowserAuthResult {
    success: boolean;
    token?: string;
    cookies?: string;
    error?: string;
}

export interface IBrowserAuthOptions {
    showBrowser?: boolean;
    timeout?: number;
    credentials?: {
        username?: string;
        password?: string;
    };
}

export class BrowserAuthenticationService {
    private static instance: BrowserAuthenticationService;
    private secureTokenManager: SecureTokenManager;
    private authCache = new Map<string, IBrowserAuthResult>();
    
    private constructor() {
        this.secureTokenManager = SecureTokenManager.getInstance();
    }
    
    public static getInstance(): BrowserAuthenticationService {
        if (!BrowserAuthenticationService.instance) {
            BrowserAuthenticationService.instance = new BrowserAuthenticationService();
        }
        return BrowserAuthenticationService.instance;
    }
    
    /**
     * Authenticate using browser login for export operations
     */
    public async authenticateForExport(
        client: SharedoClient,
        options: IBrowserAuthOptions = {}
    ): Promise<IBrowserAuthResult> {
        const cacheKey = this.getCacheKey(client.url);
        
        try {
            // Check if we have a cached valid authentication
            const cached = this.getCachedAuth(cacheKey);
            if (cached && await this.isAuthValid(cached, client)) {
                Inform.writeInfo('🔐 Using cached authentication for export');
                return cached;
            }
            
            // Check if we already have a valid token from the client
            const existingToken = await client.getBearer();
            if (existingToken && await this.isTokenValid(existingToken)) {
                const result: IBrowserAuthResult = {
                    success: true,
                    token: existingToken
                };
                
                // Cache the result
                this.authCache.set(cacheKey, result);
                return result;
            }
            
            // Need to get fresh authentication
            Inform.writeInfo('🌐 Opening browser for ShareDo authentication...');
            
            return await this.performBrowserLogin(client, options);
            
        } catch (error) {
            Inform.writeError('Browser authentication failed', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    
    /**
     * Perform browser-based login
     */
    private async performBrowserLogin(
        client: SharedoClient,
        options: IBrowserAuthOptions
    ): Promise<IBrowserAuthResult> {
        return new Promise(async (resolve) => {
            try {
                // Dynamically import playwright
                const playwright = await this.importPlaywright();
                if (!playwright) {
                    throw new Error('Playwright not available. Please install it: npm install playwright');
                }
                
                // Launch browser
                const browser = await playwright.chromium.launch({
                    headless: options.showBrowser === false,
                    timeout: options.timeout || 60000
                });
                
                const context = await browser.newContext({
                    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                });
                
                const page = await context.newPage();
                
                let capturedAuth: IBrowserAuthResult | null = null;
                
                // Set up token capture from requests
                page.on('request', (request: any) => {
                    if (!capturedAuth) {
                        const headers = request.headers();
                        if (headers.authorization && headers.authorization.startsWith('Bearer ')) {
                            const token = headers.authorization.substring(7);
                            capturedAuth = {
                                success: true,
                                token: token
                            };
                            
                            Inform.writeInfo('✅ Authentication token captured from request');
                            this.finalizeBrowserAuth(browser, capturedAuth, resolve, client.url);
                        }
                    }
                });
                
                // Set up token capture from OAuth responses
                page.on('response', async (response: any) => {
                    if (!capturedAuth && (response.url().includes('/oauth/token') || response.url().includes('/connect/token'))) {
                        try {
                            const body = await response.json();
                            if (body.access_token) {
                                capturedAuth = {
                                    success: true,
                                    token: body.access_token
                                };
                                
                                Inform.writeInfo('✅ Authentication token captured from OAuth response');
                                this.finalizeBrowserAuth(browser, capturedAuth, resolve, client.url);
                            }
                        } catch (e) {
                            // Response is not JSON, ignore
                        }
                    }
                });
                
                // Navigate to ShareDo login page
                await page.goto(client.url);
                
                // If credentials provided, attempt automatic login
                if (options.credentials?.username && options.credentials?.password) {
                    await this.performAutomaticLogin(page, {
                        username: options.credentials.username,
                        password: options.credentials.password
                    });
                }
                
                // Show progress message
                const progressMessage = options.credentials?.username 
                    ? 'Attempting automatic login...'
                    : 'Please complete the login in the browser window';
                    
                vscode.window.showInformationMessage(
                    `🔐 ${progressMessage}`,
                    'Cancel'
                ).then(selection => {
                    if (selection === 'Cancel') {
                        browser.close();
                        resolve({
                            success: false,
                            error: 'User cancelled authentication'
                        });
                    }
                });
                
                // Set timeout
                setTimeout(() => {
                    if (!capturedAuth) {
                        browser.close();
                        resolve({
                            success: false,
                            error: 'Authentication timed out'
                        });
                    }
                }, options.timeout || 180000); // 3 minutes default
                
            } catch (error) {
                resolve({
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
    }
    
    /**
     * Attempt automatic login if credentials are provided
     */
    private async performAutomaticLogin(page: any, credentials: { username: string; password: string }) {
        try {
            // Wait a moment for page to load
            await page.waitForTimeout(2000);
            
            // Look for and click "Client Login" button if present
            const clientLoginSelectors = [
                'button:has-text("Client Login")',
                'a:has-text("Client Login")',
                'button[value="local"]',
                'input[type="button"][value="Client Login"]'
            ];
            
            for (const selector of clientLoginSelectors) {
                try {
                    const element = await page.$(selector);
                    if (element) {
                        await element.click();
                        Inform.writeInfo('✓ Clicked Client Login option');
                        await page.waitForTimeout(1000);
                        break;
                    }
                } catch (e) {
                    // Try next selector
                }
            }
            
            // Fill in username
            const usernameSelectors = [
                'input[name="username"]',
                'input[name="Username"]',
                'input[type="email"]',
                'input[name="email"]',
                '#username',
                '#Username'
            ];
            
            for (const selector of usernameSelectors) {
                try {
                    await page.fill(selector, credentials.username);
                    Inform.writeInfo('✓ Username filled');
                    break;
                } catch (e) {
                    // Try next selector
                }
            }
            
            // Fill in password
            const passwordSelectors = [
                'input[name="password"]',
                'input[name="Password"]',
                'input[type="password"]',
                '#password',
                '#Password'
            ];
            
            for (const selector of passwordSelectors) {
                try {
                    await page.fill(selector, credentials.password);
                    Inform.writeInfo('✓ Password filled');
                    break;
                } catch (e) {
                    // Try next selector
                }
            }
            
            // Submit the form
            const submitSelectors = [
                'button[type="submit"]',
                'input[type="submit"]',
                'button:has-text("Sign in")',
                'button:has-text("Login")',
                'button:has-text("Log in")'
            ];
            
            for (const selector of submitSelectors) {
                try {
                    await page.click(selector);
                    Inform.writeInfo('✓ Login form submitted');
                    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 });
                    break;
                } catch (e) {
                    // Try next selector or navigation failed
                }
            }
            
        } catch (error) {
            Inform.writeError('Automatic login failed', error);
            // Continue with manual login
        }
    }
    
    /**
     * Finalize browser authentication and cleanup
     */
    private async finalizeBrowserAuth(
        browser: any,
        authResult: IBrowserAuthResult,
        resolve: (value: IBrowserAuthResult) => void,
        serverUrl: string
    ) {
        try {
            // Store token securely
            if (authResult.success && authResult.token) {
                const tokenKey = this.getTokenKey(serverUrl);
                this.secureTokenManager.storeToken(tokenKey, authResult.token);
                
                // Cache the authentication result
                const cacheKey = this.getCacheKey(serverUrl);
                this.authCache.set(cacheKey, authResult);
            }
            
            // Close browser
            await browser.close();
            
            // Resolve with result
            resolve(authResult);
            
        } catch (error) {
            resolve({
                success: false,
                error: `Failed to finalize authentication: ${error}`
            });
        }
    }
    
    /**
     * Check if authentication is still valid
     */
    private async isAuthValid(auth: IBrowserAuthResult, client: SharedoClient): Promise<boolean> {
        if (!auth.success || !auth.token) {
            return false;
        }
        
        return await this.isTokenValid(auth.token);
    }
    
    /**
     * Check if a token is still valid
     */
    private async isTokenValid(token: string): Promise<boolean> {
        try {
            // Basic JWT validation
            if (!token || token.length < 10) {
                return false;
            }
            
            // Check if it's a JWT and validate expiry
            if (token.includes('.')) {
                const parts = token.split('.');
                if (parts.length === 3) {
                    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
                    const exp = payload.exp;
                    if (exp) {
                        const expiryTime = exp * 1000;
                        const now = Date.now();
                        const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
                        
                        return now < (expiryTime - bufferTime);
                    }
                }
            }
            
            // For non-JWT tokens, assume valid (we'll catch errors when using it)
            return true;
            
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Get cached authentication
     */
    private getCachedAuth(cacheKey: string): IBrowserAuthResult | null {
        return this.authCache.get(cacheKey) || null;
    }
    
    /**
     * Clear authentication cache for a server
     */
    public clearAuthCache(serverUrl: string): void {
        const cacheKey = this.getCacheKey(serverUrl);
        this.authCache.delete(cacheKey);
        
        const tokenKey = this.getTokenKey(serverUrl);
        this.secureTokenManager.clearToken(tokenKey);
        
        Inform.writeInfo(`🗑️ Cleared authentication cache for ${serverUrl}`);
    }
    
    /**
     * Clear all authentication caches
     */
    public clearAllAuthCaches(): void {
        this.authCache.clear();
        this.secureTokenManager.clearAllTokens();
        Inform.writeInfo('🗑️ Cleared all authentication caches');
    }
    
    /**
     * Get cache key for server
     */
    private getCacheKey(serverUrl: string): string {
        return `auth_${serverUrl}`;
    }
    
    /**
     * Get token key for secure storage
     */
    private getTokenKey(serverUrl: string): string {
        return `export_token_${serverUrl}`;
    }
    
    /**
     * Dynamically import playwright to avoid startup errors
     */
    private async importPlaywright(): Promise<any> {
        try {
            // Use require instead of import to avoid compile-time dependency
            return require('playwright');
        } catch (error) {
            Inform.writeError('Playwright not available for browser automation', error);
            return null;
        }
    }
    
    /**
     * Get stored token for export operations
     */
    public getStoredToken(serverUrl: string): string | undefined {
        const tokenKey = this.getTokenKey(serverUrl);
        return this.secureTokenManager.getToken(tokenKey);
    }
    
    /**
     * Store authentication result for future use
     */
    public storeAuthResult(serverUrl: string, authResult: IBrowserAuthResult): void {
        if (authResult.success && authResult.token) {
            const tokenKey = this.getTokenKey(serverUrl);
            this.secureTokenManager.storeToken(tokenKey, authResult.token);
            
            const cacheKey = this.getCacheKey(serverUrl);
            this.authCache.set(cacheKey, authResult);
        }
    }
}
