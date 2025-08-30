"use strict";
/**
 * Base API client implementation with retry logic and error handling
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
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
exports.BaseApiClient = void 0;
var axios_1 = __importDefault(require("axios"));
var errors_1 = require("../errors");
var BaseApiClient = /** @class */ (function () {
    function BaseApiClient(config) {
        this.retryCount = new Map();
        this.config = __assign({ timeout: 30000, maxRetries: 3, retryDelay: 1000 }, config);
        this.authService = config.authService;
        this.axiosInstance = axios_1.default.create({
            baseURL: config.baseUrl,
            timeout: this.config.timeout,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        this.setupInterceptors();
    }
    BaseApiClient.prototype.setupInterceptors = function () {
        var _this = this;
        // Request interceptor for authentication
        this.axiosInstance.interceptors.request.use(function (config) { return __awaiter(_this, void 0, void 0, function () {
            var token, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(!config.headers['Authorization'] && !config.headers['skipAuth'])) return [3 /*break*/, 4];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.getAccessToken()];
                    case 2:
                        token = _a.sent();
                        config.headers['Authorization'] = "Bearer ".concat(token);
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        console.error('Failed to get access token:', error_1);
                        throw error_1;
                    case 4:
                        delete config.headers['skipAuth'];
                        return [2 /*return*/, config];
                }
            });
        }); }, function (error) { return Promise.reject(error); });
        // Response interceptor for error handling and retry
        this.axiosInstance.interceptors.response.use(function (response) { return response; }, function (error) { return __awaiter(_this, void 0, void 0, function () {
            var originalRequest, requestKey, retryCount, token, refreshError_1, retryAfter, delay;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        originalRequest = error.config;
                        if (!originalRequest) {
                            return [2 /*return*/, Promise.reject(error)];
                        }
                        requestKey = "".concat(originalRequest.method, ":").concat(originalRequest.url);
                        retryCount = this.retryCount.get(requestKey) || 0;
                        if (!(((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) === 401 && !originalRequest._retry)) return [3 /*break*/, 4];
                        originalRequest._retry = true;
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.refreshToken()];
                    case 2:
                        token = _c.sent();
                        originalRequest.headers = originalRequest.headers || {};
                        originalRequest.headers['Authorization'] = "Bearer ".concat(token);
                        return [2 /*return*/, this.axiosInstance(originalRequest)];
                    case 3:
                        refreshError_1 = _c.sent();
                        return [2 /*return*/, Promise.reject(refreshError_1)];
                    case 4:
                        if (!(((_b = error.response) === null || _b === void 0 ? void 0 : _b.status) === 429 && retryCount < this.config.maxRetries)) return [3 /*break*/, 6];
                        retryAfter = this.getRetryAfter(error.response);
                        this.retryCount.set(requestKey, retryCount + 1);
                        return [4 /*yield*/, this.delay(retryAfter)];
                    case 5:
                        _c.sent();
                        return [2 /*return*/, this.axiosInstance(originalRequest)];
                    case 6:
                        if (!(error.response && error.response.status >= 500 && retryCount < this.config.maxRetries)) return [3 /*break*/, 8];
                        this.retryCount.set(requestKey, retryCount + 1);
                        delay = this.config.retryDelay * Math.pow(2, retryCount);
                        return [4 /*yield*/, this.delay(delay)];
                    case 7:
                        _c.sent();
                        return [2 /*return*/, this.axiosInstance(originalRequest)];
                    case 8:
                        // Clear retry count on final failure
                        this.retryCount.delete(requestKey);
                        return [2 /*return*/, Promise.reject(this.transformError(error))];
                }
            });
        }); });
    };
    BaseApiClient.prototype.getAccessToken = function () {
        return __awaiter(this, void 0, void 0, function () {
            var tokenResponse;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.authService.authenticate({
                            tokenEndpoint: "".concat(this.config.baseUrl, "/api/authorize"),
                            clientId: this.config.clientId,
                            clientSecret: this.config.clientSecret,
                            scope: 'sharedo'
                        })];
                    case 1:
                        tokenResponse = _a.sent();
                        return [2 /*return*/, tokenResponse.access_token];
                }
            });
        });
    };
    BaseApiClient.prototype.refreshToken = function () {
        return __awaiter(this, void 0, void 0, function () {
            var tokenResponse;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.authService.refreshToken({
                            tokenEndpoint: "".concat(this.config.baseUrl, "/api/authorize"),
                            clientId: this.config.clientId,
                            clientSecret: this.config.clientSecret
                        })];
                    case 1:
                        tokenResponse = _a.sent();
                        return [2 /*return*/, tokenResponse.access_token];
                }
            });
        });
    };
    BaseApiClient.prototype.getRetryAfter = function (response) {
        var retryAfter = response.headers['retry-after'];
        if (retryAfter) {
            var retryAfterSeconds = parseInt(retryAfter, 10);
            if (!isNaN(retryAfterSeconds)) {
                return retryAfterSeconds * 1000;
            }
        }
        return this.config.retryDelay * 2;
    };
    BaseApiClient.prototype.delay = function (ms) {
        return new Promise(function (resolve) { return setTimeout(resolve, ms); });
    };
    BaseApiClient.prototype.transformError = function (error) {
        if (error.response) {
            var data = error.response.data;
            return new errors_1.ShareDoError((data === null || data === void 0 ? void 0 : data.message) || error.message, (data === null || data === void 0 ? void 0 : data.code) || 'API_ERROR', error.response.status);
        }
        else if (error.request) {
            return new errors_1.ShareDoError('No response from server', 'NETWORK_ERROR');
        }
        else {
            return new errors_1.ShareDoError(error.message, 'REQUEST_ERROR');
        }
    };
    // Public API methods
    BaseApiClient.prototype.get = function (endpoint, options) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.axiosInstance.get(endpoint, {
                            headers: __assign(__assign({}, options === null || options === void 0 ? void 0 : options.headers), { skipAuth: (options === null || options === void 0 ? void 0 : options.skipAuth) ? 'true' : undefined }),
                            params: options === null || options === void 0 ? void 0 : options.params,
                            timeout: options === null || options === void 0 ? void 0 : options.timeout
                        })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                }
            });
        });
    };
    BaseApiClient.prototype.post = function (endpoint, data, options) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.axiosInstance.post(endpoint, data, {
                            headers: __assign(__assign({}, options === null || options === void 0 ? void 0 : options.headers), { skipAuth: (options === null || options === void 0 ? void 0 : options.skipAuth) ? 'true' : undefined }),
                            params: options === null || options === void 0 ? void 0 : options.params,
                            timeout: options === null || options === void 0 ? void 0 : options.timeout
                        })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                }
            });
        });
    };
    BaseApiClient.prototype.put = function (endpoint, data, options) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.axiosInstance.put(endpoint, data, {
                            headers: __assign(__assign({}, options === null || options === void 0 ? void 0 : options.headers), { skipAuth: (options === null || options === void 0 ? void 0 : options.skipAuth) ? 'true' : undefined }),
                            params: options === null || options === void 0 ? void 0 : options.params,
                            timeout: options === null || options === void 0 ? void 0 : options.timeout
                        })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                }
            });
        });
    };
    BaseApiClient.prototype.delete = function (endpoint, options) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.axiosInstance.delete(endpoint, {
                            headers: __assign(__assign({}, options === null || options === void 0 ? void 0 : options.headers), { skipAuth: (options === null || options === void 0 ? void 0 : options.skipAuth) ? 'true' : undefined }),
                            params: options === null || options === void 0 ? void 0 : options.params,
                            timeout: options === null || options === void 0 ? void 0 : options.timeout
                        })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                }
            });
        });
    };
    BaseApiClient.prototype.patch = function (endpoint, data, options) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.axiosInstance.patch(endpoint, data, {
                            headers: __assign(__assign({}, options === null || options === void 0 ? void 0 : options.headers), { skipAuth: (options === null || options === void 0 ? void 0 : options.skipAuth) ? 'true' : undefined }),
                            params: options === null || options === void 0 ? void 0 : options.params,
                            timeout: options === null || options === void 0 ? void 0 : options.timeout
                        })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                }
            });
        });
    };
    return BaseApiClient;
}());
exports.BaseApiClient = BaseApiClient;
