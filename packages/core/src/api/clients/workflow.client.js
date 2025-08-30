"use strict";
/**
 * Workflow API client
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowApiClient = void 0;
var base_client_1 = require("../base.client");
var WorkflowApiClient = /** @class */ (function (_super) {
    __extends(WorkflowApiClient, _super);
    function WorkflowApiClient(config) {
        return _super.call(this, config) || this;
    }
    /**
     * Get all workflows with optional filtering
     */
    WorkflowApiClient.prototype.getWorkflows = function (filter) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.get('/api/public/workflow', {
                        params: filter ? this.buildFilterParams(filter) : undefined
                    })];
            });
        });
    };
    /**
     * Get a specific workflow by name
     */
    WorkflowApiClient.prototype.getWorkflow = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.get("/api/public/workflow/".concat(encodeURIComponent(name)))];
            });
        });
    };
    /**
     * Download workflow as JSON
     */
    WorkflowApiClient.prototype.downloadWorkflow = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.get("/api/public/workflow/".concat(encodeURIComponent(name), "/download"))];
            });
        });
    };
    /**
     * Upload a workflow
     */
    WorkflowApiClient.prototype.uploadWorkflow = function (workflow, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.post('/api/public/workflow/upload', workflow, {
                        params: options
                    })];
            });
        });
    };
    /**
     * Validate a workflow without saving
     */
    WorkflowApiClient.prototype.validateWorkflow = function (workflow) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.post('/api/public/workflow/validate', workflow)];
            });
        });
    };
    /**
     * Delete a workflow
     */
    WorkflowApiClient.prototype.deleteWorkflow = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.delete("/api/public/workflow/".concat(encodeURIComponent(name)))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Compare two workflows
     */
    WorkflowApiClient.prototype.compareWorkflows = function (workflow1, workflow2) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.get('/api/public/workflow/compare', {
                        params: { workflow1: workflow1, workflow2: workflow2 }
                    })];
            });
        });
    };
    /**
     * Get workflow execution history
     */
    WorkflowApiClient.prototype.getWorkflowHistory = function (name, limit) {
        if (limit === void 0) { limit = 10; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.get("/api/public/workflow/".concat(encodeURIComponent(name), "/history"), {
                        params: { limit: limit }
                    })];
            });
        });
    };
    /**
     * Execute a workflow
     */
    WorkflowApiClient.prototype.executeWorkflow = function (name, input) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.post("/api/public/workflow/".concat(encodeURIComponent(name), "/execute"), input)];
            });
        });
    };
    /**
     * Get workflow execution status
     */
    WorkflowApiClient.prototype.getExecutionStatus = function (executionId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.get("/api/public/workflow/execution/".concat(executionId))];
            });
        });
    };
    WorkflowApiClient.prototype.buildFilterParams = function (filter) {
        var params = {};
        if (filter.name)
            params.name = filter.name;
        if (filter.workType)
            params.workType = filter.workType;
        if (filter.status)
            params.status = filter.status;
        if (filter.modifiedAfter)
            params.modifiedAfter = filter.modifiedAfter.toISOString();
        if (filter.modifiedBefore)
            params.modifiedBefore = filter.modifiedBefore.toISOString();
        return params;
    };
    return WorkflowApiClient;
}(base_client_1.BaseApiClient));
exports.WorkflowApiClient = WorkflowApiClient;
