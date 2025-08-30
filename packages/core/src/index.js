"use strict";
/**
 * @sharedo/core - Core utilities and interfaces for ShareDo platform
 *
 * This package provides shared functionality used across all ShareDo applications:
 * - Authentication services
 * - API clients
 * - Data models
 * - Common utilities
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
// Authentication
__exportStar(require("./auth"), exports);
// API Clients
__exportStar(require("./api"), exports);
// Data Models
__exportStar(require("./models"), exports);
// Utilities
__exportStar(require("./utils"), exports);
// Constants
__exportStar(require("./constants"), exports);
// Errors
__exportStar(require("./errors"), exports);
