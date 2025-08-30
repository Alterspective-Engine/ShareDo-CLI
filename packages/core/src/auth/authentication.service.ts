/**
 * Authentication service implementation
 */

import axios, { AxiosError } from 'axios';
import { IAuthConfig, ITokenResponse, IAuthenticationService, IAuthError } from './interfaces';
import { TokenManager } from './token.manager';

export class AuthenticationService implements IAuthenticationService {
    private tokenManager: TokenManager;
    private tokenCache: Map<string, ITokenResponse> = new Map();

    constructor(tokenManager?: TokenManager) {
        this.tokenManager = tokenManager || new TokenManager();
    }

    /**
     * Authenticate and get access token
     */
    async authenticate(config: IAuthConfig): Promise<ITokenResponse> {
        try {
            // Check cache first
            const cacheKey = this.getCacheKey(config);
            const cached = this.tokenCache.get(cacheKey);
            if (cached && await this.validateToken(cached.access_token)) {
                return cached;
            }

            // Build OAuth2 parameters
            const params = new URLSearchParams({
                grant_type: config.impersonateUser ? 'Impersonate.Specified' : 'client_credentials',
                scope: config.scope || 'sharedo',
                client_id: config.clientId
            });

            if (config.clientSecret) {
                params.append('client_secret', config.clientSecret);
            }

            if (config.impersonateUser) {
                params.append('impersonate_user', config.impersonateUser);
            }

            if (config.impersonateProvider) {
                params.append('impersonate_provider', config.impersonateProvider);
            }

            // Make token request
            const response = await axios.post<ITokenResponse>(
                config.tokenEndpoint,
                params,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json'
                    },
                    timeout: 30000,
                    validateStatus: (status) => status < 500
                }
            );

            if (response.status !== 200) {
                throw this.createAuthError(
                    `Authentication failed with status ${response.status}`,
                    'AUTH_FAILED',
                    response.status,
                    response.data
                );
            }

            // Validate response
            this.validateTokenResponse(response.data);

            // Cache the token
            this.tokenCache.set(cacheKey, response.data);

            // Store in token manager
            await this.tokenManager.setToken(
                cacheKey,
                response.data.access_token,
                response.data.expires_in
            );

            return response.data;

        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw this.handleAxiosError(error);
            }
            throw error;
        }
    }

    /**
     * Refresh an expired token
     */
    async refreshToken(config: IAuthConfig): Promise<ITokenResponse> {
        // ShareDo uses re-authentication for token refresh
        // Simply call authenticate again with the same config
        return this.authenticate(config);
    }

    /**
     * Validate if a token is still valid
     */
    async validateToken(token: string): Promise<boolean> {
        if (!token) return false;

        try {
            // Check if token is a JWT and validate expiration
            const parts = token.split('.');
            if (parts.length === 3) {
                const payload = JSON.parse(
                    Buffer.from(parts[1], 'base64').toString('utf8')
                );
                
                if (payload.exp) {
                    const expirationTime = payload.exp * 1000;
                    const now = Date.now();
                    const buffer = 60000; // 1 minute buffer
                    
                    return expirationTime > (now + buffer);
                }
            }

            // If not a JWT or no exp claim, assume valid
            // Could make an API call to validate if needed
            return true;

        } catch (error) {
            console.error('Token validation error:', error);
            return false;
        }
    }

    /**
     * Revoke a token
     */
    async revokeToken(token: string): Promise<void> {
        // Clear from cache
        for (const [key, cached] of this.tokenCache.entries()) {
            if (cached.access_token === token) {
                this.tokenCache.delete(key);
                await this.tokenManager.removeToken(key);
            }
        }

        // TODO: Call revocation endpoint if ShareDo supports it
    }

    /**
     * Clear all cached tokens
     */
    clearCache(): void {
        this.tokenCache.clear();
    }

    /**
     * Generate cache key for token storage
     */
    private getCacheKey(config: IAuthConfig): string {
        const parts = [
            config.clientId,
            config.impersonateUser || 'default',
            config.impersonateProvider || 'default'
        ];
        return parts.join(':');
    }

    /**
     * Validate token response structure
     */
    private validateTokenResponse(response: any): void {
        if (!response.access_token) {
            throw this.createAuthError(
                'Invalid token response: missing access_token',
                'AUTH_FAILED'
            );
        }

        if (!response.token_type) {
            throw this.createAuthError(
                'Invalid token response: missing token_type',
                'AUTH_FAILED'
            );
        }

        if (response.expires_in === undefined) {
            throw this.createAuthError(
                'Invalid token response: missing expires_in',
                'AUTH_FAILED'
            );
        }
    }

    /**
     * Handle Axios errors
     */
    private handleAxiosError(error: AxiosError): IAuthError {
        if (error.response) {
            const status = error.response.status;
            const data = error.response.data;

            if (status === 401) {
                return this.createAuthError(
                    'Invalid credentials',
                    'INVALID_CREDENTIALS',
                    status,
                    data
                );
            }

            if (status === 400) {
                return this.createAuthError(
                    'Bad request: ' + (data as any)?.error_description || 'Invalid request',
                    'AUTH_FAILED',
                    status,
                    data
                );
            }

            return this.createAuthError(
                `Authentication failed: ${error.message}`,
                'AUTH_FAILED',
                status,
                data
            );
        }

        if (error.request) {
            return this.createAuthError(
                'Network error: No response from server',
                'NETWORK_ERROR'
            );
        }

        return this.createAuthError(
            `Authentication error: ${error.message}`,
            'AUTH_FAILED'
        );
    }

    /**
     * Create auth error
     */
    private createAuthError(
        message: string,
        code: IAuthError['code'],
        statusCode?: number,
        details?: any
    ): IAuthError {
        const error = new Error(message) as IAuthError;
        error.code = code;
        error.statusCode = statusCode;
        error.details = details;
        return error;
    }
}