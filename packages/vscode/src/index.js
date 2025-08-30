"use strict";
/**
 * @sharedo/vscode - VS Code Extension for ShareDo platform
 *
 * Provides VS Code integration for ShareDo functionality:
 * - Tree view providers
 * - Commands and context menus
 * - Workflow visualization
 * - Template management
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
var vscode = __importStar(require("vscode"));
function activate(context) {
    var _a;
    console.log('ShareDo VS Code extension is now active');
    // Register commands
    var commands = [
        vscode.commands.registerCommand('sharedo.authenticate', handleAuthenticate),
        vscode.commands.registerCommand('sharedo.refreshWorkflows', handleRefreshWorkflows),
        vscode.commands.registerCommand('sharedo.exportWorkflow', handleExportWorkflow),
        vscode.commands.registerCommand('sharedo.openTemplate', handleOpenTemplate)
    ];
    // Register tree data providers
    var workflowProvider = new WorkflowTreeProvider();
    vscode.window.createTreeView('sharedo.workflows', {
        treeDataProvider: workflowProvider,
        showCollapseAll: true
    });
    var templateProvider = new TemplateTreeProvider();
    vscode.window.createTreeView('sharedo.templates', {
        treeDataProvider: templateProvider,
        showCollapseAll: true
    });
    (_a = context.subscriptions).push.apply(_a, commands);
}
function deactivate() {
    console.log('ShareDo VS Code extension is now deactivated');
}
function handleAuthenticate() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            vscode.window.showInformationMessage('Authentication - coming soon');
            return [2 /*return*/];
        });
    });
}
function handleRefreshWorkflows() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            vscode.window.showInformationMessage('Refresh workflows - coming soon');
            return [2 /*return*/];
        });
    });
}
function handleExportWorkflow() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            vscode.window.showInformationMessage('Export workflow - coming soon');
            return [2 /*return*/];
        });
    });
}
function handleOpenTemplate() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            vscode.window.showInformationMessage('Open template - coming soon');
            return [2 /*return*/];
        });
    });
}
var WorkflowTreeProvider = /** @class */ (function () {
    function WorkflowTreeProvider() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    WorkflowTreeProvider.prototype.getTreeItem = function (element) {
        return element;
    };
    WorkflowTreeProvider.prototype.getChildren = function (element) {
        if (!element) {
            // Return root items
            return Promise.resolve([
                new WorkflowTreeItem('Sample Workflow', vscode.TreeItemCollapsibleState.None)
            ]);
        }
        return Promise.resolve([]);
    };
    WorkflowTreeProvider.prototype.refresh = function () {
        this._onDidChangeTreeData.fire();
    };
    return WorkflowTreeProvider;
}());
var TemplateTreeProvider = /** @class */ (function () {
    function TemplateTreeProvider() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    TemplateTreeProvider.prototype.getTreeItem = function (element) {
        return element;
    };
    TemplateTreeProvider.prototype.getChildren = function (element) {
        if (!element) {
            // Return root items
            return Promise.resolve([
                new TemplateTreeItem('Sample Template', vscode.TreeItemCollapsibleState.None)
            ]);
        }
        return Promise.resolve([]);
    };
    TemplateTreeProvider.prototype.refresh = function () {
        this._onDidChangeTreeData.fire();
    };
    return TemplateTreeProvider;
}());
var WorkflowTreeItem = /** @class */ (function (_super) {
    __extends(WorkflowTreeItem, _super);
    function WorkflowTreeItem(label, collapsibleState) {
        var _this = _super.call(this, label, collapsibleState) || this;
        _this.label = label;
        _this.collapsibleState = collapsibleState;
        _this.tooltip = "Workflow: ".concat(_this.label);
        _this.contextValue = 'workflow';
        return _this;
    }
    return WorkflowTreeItem;
}(vscode.TreeItem));
var TemplateTreeItem = /** @class */ (function (_super) {
    __extends(TemplateTreeItem, _super);
    function TemplateTreeItem(label, collapsibleState) {
        var _this = _super.call(this, label, collapsibleState) || this;
        _this.label = label;
        _this.collapsibleState = collapsibleState;
        _this.tooltip = "Template: ".concat(_this.label);
        _this.contextValue = 'template';
        return _this;
    }
    return TemplateTreeItem;
}(vscode.TreeItem));
