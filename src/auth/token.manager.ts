import { ITokenResponse } from './interfaces';

export class TokenManager {
  private token?: ITokenResponse;
  private tokenExpiry?: Date;

  setToken(token: ITokenResponse): void {
    this.token = token;
    this.tokenExpiry = new Date(Date.now() + (token.expires_in * 1000));
  }

  getToken(): ITokenResponse | undefined {
    if (this.isTokenExpired()) {
      this.clearToken();
      return undefined;
    }
    return this.token;
  }

  clearToken(): void {
    this.token = undefined;
    this.tokenExpiry = undefined;
  }

  isTokenExpired(): boolean {
    if (!this.tokenExpiry) {
      return true;
    }
    
    const now = new Date();
    const bufferTime = 60 * 1000; // 1 minute buffer before actual expiry
    
    return now.getTime() > (this.tokenExpiry.getTime() - bufferTime);
  }

  hasValidToken(): boolean {
    return !!this.token && !this.isTokenExpired();
  }

  getAccessToken(): string | undefined {
    const token = this.getToken();
    return token?.access_token;
  }

  getTokenType(): string | undefined {
    const token = this.getToken();
    return token?.token_type;
  }

  getExpiresIn(): number | undefined {
    const token = this.getToken();
    return token?.expires_in;
  }

  getTokenExpiry(): Date | undefined {
    return this.tokenExpiry;
  }

  getRemainingTime(): number {
    if (!this.tokenExpiry) {
      return 0;
    }
    
    const now = new Date();
    const remaining = this.tokenExpiry.getTime() - now.getTime();
    
    return Math.max(0, remaining);
  }
}