/**
 * Authentication interfaces
 */
export interface IAuthConfig {
    tokenEndpoint: string;
    clientId: string;
    clientSecret?: string;
    scope?: string;
    impersonateUser?: string;
    impersonateProvider?: string;
}
export interface ITokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token?: string;
    scope?: string;
}
export interface IAuthenticationService {
    authenticate(config: IAuthConfig): Promise<ITokenResponse>;
    refreshToken(config: IAuthConfig): Promise<ITokenResponse>;
    validateToken(token: string): Promise<boolean>;
    revokeToken(token: string): Promise<void>;
}
export interface ITokenManager {
    getToken(key: string): Promise<string | null>;
    setToken(key: string, token: string, expiresIn?: number): Promise<void>;
    removeToken(key: string): Promise<void>;
    isTokenValid(token: string): boolean;
}
export interface IAuthError extends Error {
    code: 'AUTH_FAILED' | 'TOKEN_EXPIRED' | 'INVALID_CREDENTIALS' | 'NETWORK_ERROR';
    statusCode?: number;
    details?: any;
}
