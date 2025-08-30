export interface ITokenResponse {
  access_token: string;
  expires_in: number;
  token_type: 'Bearer';
  scope?: string;
  refresh_token?: string;
}

export interface IImpersonationOptions {
  user?: string;
  provider?: string;
}

export interface IAuthenticationOptions {
  tokenEndpoint: string;
  clientId: string;
  clientSecret: string;
  impersonationOptions?: IImpersonationOptions;
  rejectUnauthorized?: boolean;
}

export interface IAuthenticatedUser {
  username: string;
  email?: string;
  roles?: string[];
  permissions?: string[];
}

export interface IAuthenticationResult {
  token: ITokenResponse;
  user?: IAuthenticatedUser;
}

export interface IRefreshTokenOptions {
  refreshToken: string;
  clientId?: string;
  clientSecret?: string;
}