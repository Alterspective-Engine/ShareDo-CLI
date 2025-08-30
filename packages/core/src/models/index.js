"use strict";
/**
 * Core data models for ShareDo platform
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionStatus = exports.WorkflowStatus = void 0;
var WorkflowStatus;
(function (WorkflowStatus) {
    WorkflowStatus["Draft"] = "draft";
    WorkflowStatus["Active"] = "active";
    WorkflowStatus["Inactive"] = "inactive";
    WorkflowStatus["Archived"] = "archived";
})(WorkflowStatus || (exports.WorkflowStatus = WorkflowStatus = {}));
var ExecutionStatus;
(function (ExecutionStatus) {
    ExecutionStatus["Pending"] = "pending";
    ExecutionStatus["Running"] = "running";
    ExecutionStatus["Completed"] = "completed";
    ExecutionStatus["Failed"] = "failed";
    ExecutionStatus["Cancelled"] = "cancelled";
})(ExecutionStatus || (exports.ExecutionStatus = ExecutionStatus = {}));
