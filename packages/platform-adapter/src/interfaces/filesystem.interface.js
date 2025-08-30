"use strict";
/**
 * File system operations abstraction
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileChangeType = void 0;
var FileChangeType;
(function (FileChangeType) {
    FileChangeType["Created"] = "created";
    FileChangeType["Modified"] = "modified";
    FileChangeType["Deleted"] = "deleted";
    FileChangeType["Renamed"] = "renamed";
})(FileChangeType || (exports.FileChangeType = FileChangeType = {}));
