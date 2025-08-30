import axios from 'axios';
import { AuthenticationService } from '../../src/auth/authentication.service';
import { TokenManager } from '../../src/auth/token.manager';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AuthenticationService', () => {
  let authService: AuthenticationService;
  let tokenManager: TokenManager;

  beforeEach(() => {
    tokenManager = new TokenManager();
    authService = new AuthenticationService(tokenManager);
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should authenticate with client credentials', async () => {
      const mockTokenResponse = {
        access_token: 'test-token',
        token_type: 'Bearer',
        expires_in: 3600
      };

      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: mockTokenResponse
      });

      const result = await authService.authenticate({
        tokenEndpoint: 'https://api.sharedo.com/api/authorize',
        clientId: 'test-client',
        clientSecret: 'test-secret'
      });

      expect(result).toEqual(mockTokenResponse);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.sharedo.com/api/authorize',
        expect.any(URLSearchParams),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/x-www-form-urlencoded'
          })
        })
      );
    });

    it('should authenticate with impersonation', async () => {
      const mockTokenResponse = {
        access_token: 'impersonated-token',
        token_type: 'Bearer',
        expires_in: 3600
      };

      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: mockTokenResponse
      });

      const result = await authService.authenticate({
        tokenEndpoint: 'https://api.sharedo.com/api/authorize',
        clientId: 'test-client',
        impersonateUser: 'user@example.com',
        impersonateProvider: 'ShareDo'
      });

      expect(result).toEqual(mockTokenResponse);
      const callArgs = mockedAxios.post.mock.calls[0];
      const params = callArgs[1] as URLSearchParams;
      expect(params.get('grant_type')).toBe('Impersonate.Specified');
      expect(params.get('impersonate_user')).toBe('user@example.com');
    });

    it('should use cached token if valid', async () => {
      const mockTokenResponse = {
        access_token: 'cached-token',
        token_type: 'Bearer',
        expires_in: 3600
      };

      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: mockTokenResponse
      });

      // First call - should hit API
      await authService.authenticate({
        tokenEndpoint: 'https://api.sharedo.com/api/authorize',
        clientId: 'test-client'
      });

      // Second call - should use cache
      const result = await authService.authenticate({
        tokenEndpoint: 'https://api.sharedo.com/api/authorize',
        clientId: 'test-client'
      });

      expect(result).toEqual(mockTokenResponse);
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    });

    it('should handle authentication failure', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        status: 401,
        data: { error: 'invalid_client' }
      });

      await expect(
        authService.authenticate({
          tokenEndpoint: 'https://api.sharedo.com/api/authorize',
          clientId: 'invalid-client'
        })
      ).rejects.toThrow('Authentication failed');
    });

    it('should handle network errors', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(false);

      await expect(
        authService.authenticate({
          tokenEndpoint: 'https://api.sharedo.com/api/authorize',
          clientId: 'test-client'
        })
      ).rejects.toThrow('Network error');
    });
  });

  describe('validateToken', () => {
    it('should validate JWT token with expiration', async () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const payload = { exp: futureExp };
      const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
      const validToken = `header.${encodedPayload}.signature`;

      const result = await authService.validateToken(validToken);
      expect(result).toBe(true);
    });

    it('should reject expired JWT token', async () => {
      const pastExp = Math.floor(Date.now() / 1000) - 3600;
      const payload = { exp: pastExp };
      const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
      const expiredToken = `header.${encodedPayload}.signature`;

      const result = await authService.validateToken(expiredToken);
      expect(result).toBe(false);
    });

    it('should handle non-JWT tokens', async () => {
      const result = await authService.validateToken('not-a-jwt-token');
      expect(result).toBe(true);
    });

    it('should return false for empty token', async () => {
      const result = await authService.validateToken('');
      expect(result).toBe(false);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token by re-authenticating', async () => {
      const mockTokenResponse = {
        access_token: 'refreshed-token',
        token_type: 'Bearer',
        expires_in: 3600
      };

      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: mockTokenResponse
      });

      const result = await authService.refreshToken({
        tokenEndpoint: 'https://api.sharedo.com/api/authorize',
        clientId: 'test-client'
      });

      expect(result).toEqual(mockTokenResponse);
    });
  });

  describe('revokeToken', () => {
    it('should remove token from cache', async () => {
      const mockTokenResponse = {
        access_token: 'token-to-revoke',
        token_type: 'Bearer',
        expires_in: 3600
      };

      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: mockTokenResponse
      });

      await authService.authenticate({
        tokenEndpoint: 'https://api.sharedo.com/api/authorize',
        clientId: 'test-client'
      });

      await authService.revokeToken('token-to-revoke');

      // Try to authenticate again - should hit API, not cache
      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: mockTokenResponse
      });

      await authService.authenticate({
        tokenEndpoint: 'https://api.sharedo.com/api/authorize',
        clientId: 'test-client'
      });

      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    });
  });

  describe('clearCache', () => {
    it('should clear all cached tokens', async () => {
      const mockTokenResponse = {
        access_token: 'cached-token',
        token_type: 'Bearer',
        expires_in: 3600
      };

      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: mockTokenResponse
      });

      await authService.authenticate({
        tokenEndpoint: 'https://api.sharedo.com/api/authorize',
        clientId: 'test-client'
      });

      authService.clearCache();

      // Should hit API again after cache clear
      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: mockTokenResponse
      });

      await authService.authenticate({
        tokenEndpoint: 'https://api.sharedo.com/api/authorize',
        clientId: 'test-client'
      });

      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    });
  });
});