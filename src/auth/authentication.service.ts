import axios, { AxiosInstance } from 'axios';
import * as https from 'https';
import { IAuthenticationOptions, ITokenResponse, IImpersonationOptions } from './interfaces';
import { TokenManager } from './token.manager';
import { SecureStorage } from './secure-storage';
import { TokenRefreshManager } from './token-refresh-manager';
import { validateUrl, validateClientId, sanitizeErrorMessage } from '../utils/input-validator';

export class AuthenticationService {
  private tokenManager: TokenManager;
  private secureStorage: SecureStorage;
  private refreshManager: TokenRefreshManager;
  private axiosInstance: AxiosInstance;
  private tokenEndpoint: string;
  private clientId: string;
  private clientSecret: string;
  private impersonationOptions?: IImpersonationOptions;

  constructor(options: IAuthenticationOptions) {
    // Validate inputs
    this.tokenEndpoint = validateUrl(options.tokenEndpoint);
    this.clientId = validateClientId(options.clientId);
    this.clientSecret = options.clientSecret; // Note: Should be from secure source
    this.impersonationOptions = options.impersonationOptions;
    
    this.tokenManager = new TokenManager();
    this.secureStorage = new SecureStorage();
    this.refreshManager = new TokenRefreshManager();
    
    this.axiosInstance = axios.create({
      baseURL: this.tokenEndpoint,
      httpsAgent: new https.Agent({
        rejectUnauthorized: options.rejectUnauthorized ?? true
      })
    });
  }

  private get authenticationHeader(): string {
    return 'Basic ' + Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
  }

  async authenticate(): Promise<ITokenResponse> {
    const params = new URLSearchParams();
    params.append('grant_type', 'Impersonate.Specified');
    params.append('scope', 'sharedo');
    
    if (this.impersonationOptions?.user) {
      params.append('impersonate_user', this.impersonationOptions.user);
    }
    
    if (this.impersonationOptions?.provider) {
      params.append('impersonate_provider', this.impersonationOptions.provider);
    }

    try {
      const response = await this.axiosInstance.post<ITokenResponse>(
        this.tokenEndpoint,
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': this.authenticationHeader
          }
        }
      );

      this.validateTokenResponse(response.data);
      this.tokenManager.setToken(response.data);
      this.secureStorage.storeToken(response.data);
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = `Authentication failed: ${error.response?.status} - ${error.response?.statusText}`;
        throw new Error(sanitizeErrorMessage(message));
      }
      throw error;
    }
  }

  async getAccessToken(): Promise<string> {
    const token = this.tokenManager.getToken();
    
    if (!token || this.tokenManager.isTokenExpired()) {
      const newToken = await this.authenticate();
      return newToken.access_token;
    }
    
    return token.access_token;
  }

  async refreshToken(): Promise<ITokenResponse> {
    return this.refreshManager.executeRefresh(() => this.authenticate());
  }

  isAuthenticated(): boolean {
    return this.tokenManager.hasValidToken();
  }

  clearAuthentication(): void {
    this.tokenManager.clearToken();
  }

  private validateTokenResponse(response: ITokenResponse): void {
    if (!response.access_token) {
      throw new Error('No access token in response');
    }
    if (!response.expires_in) {
      throw new Error('No expires_in in response');
    }
    if (!response.token_type) {
      throw new Error('No token_type in response');
    }
  }
}