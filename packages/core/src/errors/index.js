"use strict";
/**
 * Error classes for ShareDo platform
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeoutError = exports.ValidationError = exports.NetworkError = exports.ApiError = exports.AuthorizationError = exports.AuthenticationError = exports.ShareDoError = void 0;
exports.isShareDoError = isShareDoError;
exports.createErrorFromResponse = createErrorFromResponse;
var ShareDoError = /** @class */ (function (_super) {
    __extends(ShareDoError, _super);
    function ShareDoError(message, code, statusCode) {
        if (code === void 0) { code = 'UNKNOWN_ERROR'; }
        var _this = _super.call(this, message) || this;
        _this.name = 'ShareDoError';
        _this.code = code;
        _this.statusCode = statusCode;
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(_this, ShareDoError);
        }
        return _this;
    }
    return ShareDoError;
}(Error));
exports.ShareDoError = ShareDoError;
var AuthenticationError = /** @class */ (function (_super) {
    __extends(AuthenticationError, _super);
    function AuthenticationError(message, statusCode) {
        if (message === void 0) { message = 'Authentication failed'; }
        var _this = _super.call(this, message, 'AUTHENTICATION_ERROR', statusCode || 401) || this;
        _this.name = 'AuthenticationError';
        return _this;
    }
    return AuthenticationError;
}(ShareDoError));
exports.AuthenticationError = AuthenticationError;
var AuthorizationError = /** @class */ (function (_super) {
    __extends(AuthorizationError, _super);
    function AuthorizationError(message, statusCode) {
        if (message === void 0) { message = 'Access denied'; }
        var _this = _super.call(this, message, 'AUTHORIZATION_ERROR', statusCode || 403) || this;
        _this.name = 'AuthorizationError';
        return _this;
    }
    return AuthorizationError;
}(ShareDoError));
exports.AuthorizationError = AuthorizationError;
var ApiError = /** @class */ (function (_super) {
    __extends(ApiError, _super);
    function ApiError(message, statusCode) {
        var _this = _super.call(this, message, 'API_ERROR', statusCode) || this;
        _this.name = 'ApiError';
        return _this;
    }
    return ApiError;
}(ShareDoError));
exports.ApiError = ApiError;
var NetworkError = /** @class */ (function (_super) {
    __extends(NetworkError, _super);
    function NetworkError(message) {
        if (message === void 0) { message = 'Network request failed'; }
        var _this = _super.call(this, message, 'NETWORK_ERROR') || this;
        _this.name = 'NetworkError';
        return _this;
    }
    return NetworkError;
}(ShareDoError));
exports.NetworkError = NetworkError;
var ValidationError = /** @class */ (function (_super) {
    __extends(ValidationError, _super);
    function ValidationError(message, field) {
        var _this = _super.call(this, message, 'VALIDATION_ERROR', 400) || this;
        _this.name = 'ValidationError';
        _this.field = field;
        return _this;
    }
    return ValidationError;
}(ShareDoError));
exports.ValidationError = ValidationError;
var TimeoutError = /** @class */ (function (_super) {
    __extends(TimeoutError, _super);
    function TimeoutError(message) {
        if (message === void 0) { message = 'Operation timed out'; }
        var _this = _super.call(this, message, 'TIMEOUT_ERROR') || this;
        _this.name = 'TimeoutError';
        return _this;
    }
    return TimeoutError;
}(ShareDoError));
exports.TimeoutError = TimeoutError;
function isShareDoError(error) {
    return error instanceof ShareDoError;
}
function createErrorFromResponse(status, message) {
    switch (status) {
        case 401:
            return new AuthenticationError(message, status);
        case 403:
            return new AuthorizationError(message, status);
        case 400:
            return new ValidationError(message);
        default:
            return new ApiError(message, status);
    }
}
