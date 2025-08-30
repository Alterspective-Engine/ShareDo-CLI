/**
 * Authentication service implementation
 */
import { IAuthConfig, ITokenResponse, IAuthenticationService } from './interfaces';
import { TokenManager } from './token.manager';
export declare class AuthenticationService implements IAuthenticationService {
    private tokenManager;
    private tokenCache;
    constructor(tokenManager?: TokenManager);
    /**
     * Authenticate and get access token
     */
    authenticate(config: IAuthConfig): Promise<ITokenResponse>;
    /**
     * Refresh an expired token
     */
    refreshToken(config: IAuthConfig): Promise<ITokenResponse>;
    /**
     * Validate if a token is still valid
     */
    validateToken(token: string): Promise<boolean>;
    /**
     * Revoke a token
     */
    revokeToken(token: string): Promise<void>;
    /**
     * Clear all cached tokens
     */
    clearCache(): void;
    /**
     * Generate cache key for token storage
     */
    private getCacheKey;
    /**
     * Validate token response structure
     */
    private validateTokenResponse;
    /**
     * Handle Axios errors
     */
    private handleAxiosError;
    /**
     * Create auth error
     */
    private createAuthError;
}
