"use strict";
/**
 * Configuration management abstraction
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationSeverity = exports.ConfigurationTarget = void 0;
var ConfigurationTarget;
(function (ConfigurationTarget) {
    /**
     * User-specific settings
     */
    ConfigurationTarget["User"] = "user";
    /**
     * Workspace/project settings
     */
    ConfigurationTarget["Workspace"] = "workspace";
    /**
     * Machine-specific settings
     */
    ConfigurationTarget["Machine"] = "machine";
    /**
     * Default/built-in settings
     */
    ConfigurationTarget["Default"] = "default";
})(ConfigurationTarget || (exports.ConfigurationTarget = ConfigurationTarget = {}));
var ValidationSeverity;
(function (ValidationSeverity) {
    ValidationSeverity["Error"] = "error";
    ValidationSeverity["Warning"] = "warning";
    ValidationSeverity["Info"] = "info";
})(ValidationSeverity || (exports.ValidationSeverity = ValidationSeverity = {}));
