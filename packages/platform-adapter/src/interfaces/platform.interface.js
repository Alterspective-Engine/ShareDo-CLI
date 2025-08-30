"use strict";
/**
 * Main platform interface that all implementations must provide
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformFeature = void 0;
var PlatformFeature;
(function (PlatformFeature) {
    PlatformFeature["FileWatching"] = "fileWatching";
    PlatformFeature["SecretStorage"] = "secretStorage";
    PlatformFeature["ProcessExecution"] = "processExecution";
    PlatformFeature["RichUI"] = "richUI";
    PlatformFeature["Notifications"] = "notifications";
    PlatformFeature["TreeViews"] = "treeViews";
    PlatformFeature["WebViews"] = "webViews";
    PlatformFeature["StatusBar"] = "statusBar";
})(PlatformFeature = exports.PlatformFeature || (exports.PlatformFeature = {}));
