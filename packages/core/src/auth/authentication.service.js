"use strict";
/**
 * Authentication service implementation
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationService = void 0;
var axios_1 = __importDefault(require("axios"));
var token_manager_1 = require("./token.manager");
var AuthenticationService = /** @class */ (function () {
    function AuthenticationService(tokenManager) {
        this.tokenCache = new Map();
        this.tokenManager = tokenManager || new token_manager_1.TokenManager();
    }
    /**
     * Authenticate and get access token
     */
    AuthenticationService.prototype.authenticate = function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey, cached, _a, params, response, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 5, , 6]);
                        cacheKey = this.getCacheKey(config);
                        cached = this.tokenCache.get(cacheKey);
                        _a = cached;
                        if (!_a) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.validateToken(cached.access_token)];
                    case 1:
                        _a = (_b.sent());
                        _b.label = 2;
                    case 2:
                        if (_a) {
                            return [2 /*return*/, cached];
                        }
                        params = new URLSearchParams({
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
                        return [4 /*yield*/, axios_1.default.post(config.tokenEndpoint, params, {
                                headers: {
                                    'Content-Type': 'application/x-www-form-urlencoded',
                                    'Accept': 'application/json'
                                },
                                timeout: 30000,
                                validateStatus: function (status) { return status < 500; }
                            })];
                    case 3:
                        response = _b.sent();
                        if (response.status !== 200) {
                            throw this.createAuthError("Authentication failed with status ".concat(response.status), 'AUTH_FAILED', response.status, response.data);
                        }
                        // Validate response
                        this.validateTokenResponse(response.data);
                        // Cache the token
                        this.tokenCache.set(cacheKey, response.data);
                        // Store in token manager
                        return [4 /*yield*/, this.tokenManager.setToken(cacheKey, response.data.access_token, response.data.expires_in)];
                    case 4:
                        // Store in token manager
                        _b.sent();
                        return [2 /*return*/, response.data];
                    case 5:
                        error_1 = _b.sent();
                        if (axios_1.default.isAxiosError(error_1)) {
                            throw this.handleAxiosError(error_1);
                        }
                        throw error_1;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Refresh an expired token
     */
    AuthenticationService.prototype.refreshToken = function (config) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // ShareDo uses re-authentication for token refresh
                // Simply call authenticate again with the same config
                return [2 /*return*/, this.authenticate(config)];
            });
        });
    };
    /**
     * Validate if a token is still valid
     */
    AuthenticationService.prototype.validateToken = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            var parts, payload, expirationTime, now, buffer;
            return __generator(this, function (_a) {
                if (!token)
                    return [2 /*return*/, false];
                try {
                    parts = token.split('.');
                    if (parts.length === 3) {
                        payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
                        if (payload.exp) {
                            expirationTime = payload.exp * 1000;
                            now = Date.now();
                            buffer = 60000;
                            return [2 /*return*/, expirationTime > (now + buffer)];
                        }
                    }
                    // If not a JWT or no exp claim, assume valid
                    // Could make an API call to validate if needed
                    return [2 /*return*/, true];
                }
                catch (error) {
                    console.error('Token validation error:', error);
                    return [2 /*return*/, false];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Revoke a token
     */
    AuthenticationService.prototype.revokeToken = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, _b, key, cached;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _i = 0, _a = this.tokenCache.entries();
                        _c.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        _b = _a[_i], key = _b[0], cached = _b[1];
                        if (!(cached.access_token === token)) return [3 /*break*/, 3];
                        this.tokenCache.delete(key);
                        return [4 /*yield*/, this.tokenManager.removeToken(key)];
                    case 2:
                        _c.sent();
                        _c.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Clear all cached tokens
     */
    AuthenticationService.prototype.clearCache = function () {
        this.tokenCache.clear();
    };
    /**
     * Generate cache key for token storage
     */
    AuthenticationService.prototype.getCacheKey = function (config) {
        var parts = [
            config.clientId,
            config.impersonateUser || 'default',
            config.impersonateProvider || 'default'
        ];
        return parts.join(':');
    };
    /**
     * Validate token response structure
     */
    AuthenticationService.prototype.validateTokenResponse = function (response) {
        if (!response.access_token) {
            throw this.createAuthError('Invalid token response: missing access_token', 'AUTH_FAILED');
        }
        if (!response.token_type) {
            throw this.createAuthError('Invalid token response: missing token_type', 'AUTH_FAILED');
        }
        if (response.expires_in === undefined) {
            throw this.createAuthError('Invalid token response: missing expires_in', 'AUTH_FAILED');
        }
    };
    /**
     * Handle Axios errors
     */
    AuthenticationService.prototype.handleAxiosError = function (error) {
        if (error.response) {
            var status_1 = error.response.status;
            var data = error.response.data;
            if (status_1 === 401) {
                return this.createAuthError('Invalid credentials', 'INVALID_CREDENTIALS', status_1, data);
            }
            if (status_1 === 400) {
                return this.createAuthError('Bad request: ' + (data === null || data === void 0 ? void 0 : data.error_description) || 'Invalid request', 'AUTH_FAILED', status_1, data);
            }
            return this.createAuthError("Authentication failed: ".concat(error.message), 'AUTH_FAILED', status_1, data);
        }
        if (error.request) {
            return this.createAuthError('Network error: No response from server', 'NETWORK_ERROR');
        }
        return this.createAuthError("Authentication error: ".concat(error.message), 'AUTH_FAILED');
    };
    /**
     * Create auth error
     */
    AuthenticationService.prototype.createAuthError = function (message, code, statusCode, details) {
        var error = new Error(message);
        error.code = code;
        error.statusCode = statusCode;
        error.details = details;
        return error;
    };
    return AuthenticationService;
}());
exports.AuthenticationService = AuthenticationService;
