import { TreeNode } from "../treeprovider";
import { ElementTypes } from "../enums";
import * as vscode from "vscode";
import { IExecutingPlanEnhanced, ISubProcess } from "../Request/ExecutionEngine/GetExecutingPlans";
import { IAdvisorIssue } from "../Request/ExecutionEngine/GetAdvisorIssues";

/**
 * Generate tree nodes for execution engine monitoring
 */
export function generateExecutionMonitoringTreeNodes(element: TreeNode): TreeNode[] {
    let returnValue: TreeNode[] = [];

    // Add Execution Overview section
    returnValue.push(new TreeNode(
        "📊 Execution Overview",
        vscode.TreeItemCollapsibleState.Expanded,
        ElementTypes.executionOverview,
        async () => await generateExecutionOverviewNodes(element),
        element.sharedoClient,
        element,
        undefined,
        undefined,
        "dashboard"
    ));

    // Add Currently Executing section
    returnValue.push(new TreeNode(
        "▶️ Currently Executing",
        vscode.TreeItemCollapsibleState.Expanded,
        ElementTypes.executingPlans,
        async () => await generateCurrentlyExecutingNodes(element),
        element.sharedoClient,
        element,
        undefined,
        undefined,
        "play-circle"
    ));

    // Add Advisor Issues section
    returnValue.push(new TreeNode(
        "⚠️ Advisor Issues",
        vscode.TreeItemCollapsibleState.Collapsed,
        ElementTypes.advisorIssues,
        async () => await generateAdvisorIssuesNodes(element),
        element.sharedoClient,
        element,
        undefined,
        undefined,
        "warning"
    ));

    return returnValue;
}

/**
 * Generate execution overview statistics nodes
 */
async function generateExecutionOverviewNodes(element: TreeNode): Promise<TreeNode[]> {
    let returnValue: TreeNode[] = [];

    try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('API call timeout')), 10000); // 10 second timeout
        });

        // Get executing plans for statistics with timeout
        const executingPlans = await Promise.race([
            element.sharedoClient.getExecutingPlansEnhanced(100, 0),
            timeoutPromise
        ]);
        
        if (executingPlans) {
            const stats = calculateExecutionStatistics(executingPlans.plans);
            
            returnValue.push(new TreeNode(
                `📈 Total Plans: ${stats.totalPlans}`,
                vscode.TreeItemCollapsibleState.None,
                ElementTypes.executionStat,
                undefined,
                element.sharedoClient,
                element,
                undefined,
                undefined,
                "graph"
            ));

            returnValue.push(new TreeNode(
                `▶️ Currently Running: ${stats.running}`,
                vscode.TreeItemCollapsibleState.None,
                ElementTypes.executionStat,
                undefined,
                element.sharedoClient,
                element,
                undefined,
                undefined,
                stats.running > 0 ? "play-circle" : "circle"
            ));

            returnValue.push(new TreeNode(
                `⏸️ Paused: ${stats.paused}`,
                vscode.TreeItemCollapsibleState.None,
                ElementTypes.executionStat,
                undefined,
                element.sharedoClient,
                element,
                undefined,
                undefined,
                "pause-circle"
            ));

            returnValue.push(new TreeNode(
                `✅ Completed: ${stats.completed}`,
                vscode.TreeItemCollapsibleState.None,
                ElementTypes.executionStat,
                undefined,
                element.sharedoClient,
                element,
                undefined,
                undefined,
                "check-circle"
            ));

            returnValue.push(new TreeNode(
                `❌ Failed: ${stats.failed}`,
                vscode.TreeItemCollapsibleState.None,
                ElementTypes.executionStat,
                undefined,
                element.sharedoClient,
                element,
                undefined,
                undefined,
                stats.failed > 0 ? "error" : "circle"
            ));
        }

    } catch (error) {
        console.error('Error loading execution statistics:', error);
        
        const errorMessage = error instanceof Error && error.message === 'API call timeout' 
            ? "⏱️ Timeout loading execution statistics"
            : "❌ Error loading execution statistics";
            
        returnValue.push(new TreeNode(
            errorMessage,
            vscode.TreeItemCollapsibleState.None,
            ElementTypes.error,
            undefined,
            element.sharedoClient,
            element,
            undefined,
            error instanceof Error ? error.message : String(error)
        ));
    }

    return returnValue;
}

/**
 * Generate currently executing plans nodes
 */
async function generateCurrentlyExecutingNodes(element: TreeNode): Promise<TreeNode[]> {
    let returnValue: TreeNode[] = [];

    try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('API call timeout')), 10000); // 10 second timeout
        });

        const executingPlans = await Promise.race([
            element.sharedoClient.getExecutingPlansEnhanced(50, 0),
            timeoutPromise
        ]);
        
        if (executingPlans && executingPlans.plans.length > 0) {
            for (const plan of executingPlans.plans) {
                const statusIcon = getStatusIcon(plan.status);
                const duration = calculateDuration(plan.startTime);
                
                const planNode = new TreeNode(
                    `${statusIcon} ${plan.planTitle || plan.planName}`,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    ElementTypes.executingPlan,
                    async () => await generateExecutingPlanDetails(element, plan),
                    element.sharedoClient,
                    element,
                    undefined,
                    undefined,
                    "pulse",
                    plan
                );

                // Add context for commands
                planNode.contextValue = `executingPlan,${plan.status}`;
                returnValue.push(planNode);
            }
        } else {
            returnValue.push(new TreeNode(
                "✨ No plans currently executing",
                vscode.TreeItemCollapsibleState.None,
                ElementTypes.info,
                undefined,
                element.sharedoClient,
                element,
                undefined,
                undefined,
                "check"
            ));
        }

    } catch (error) {
        console.error('Error loading executing plans:', error);
        
        const errorMessage = error instanceof Error && error.message === 'API call timeout' 
            ? "⏱️ Timeout loading executing plans"
            : "❌ Error loading executing plans";
            
        returnValue.push(new TreeNode(
            errorMessage,
            vscode.TreeItemCollapsibleState.None,
            ElementTypes.error,
            undefined,
            element.sharedoClient,
            element,
            undefined,
            error instanceof Error ? error.message : String(error)
        ));
    }

    return returnValue;
}

/**
 * Generate detailed view of an executing plan
 */
async function generateExecutingPlanDetails(element: TreeNode, plan: IExecutingPlanEnhanced): Promise<TreeNode[]> {
    let returnValue: TreeNode[] = [];

    // Plan details
    returnValue.push(new TreeNode(
        `📋 Plan ID: ${plan.planId}`,
        vscode.TreeItemCollapsibleState.None,
        ElementTypes.planDetail,
        undefined,
        element.sharedoClient,
        element,
        undefined,
        undefined,
        undefined,
        plan
    ));

    returnValue.push(new TreeNode(
        `🏷️ System Name: ${plan.planSystemName}`,
        vscode.TreeItemCollapsibleState.None,
        ElementTypes.planDetail,
        undefined,
        element.sharedoClient,
        element,
        undefined,
        undefined,
        undefined,
        plan
    ));

    returnValue.push(new TreeNode(
        `⏰ Started: ${formatDateTime(plan.startTime)}`,
        vscode.TreeItemCollapsibleState.None,
        ElementTypes.planDetail,
        undefined,
        element.sharedoClient,
        element,
        undefined,
        undefined,
        undefined,
        plan
    ));

    const duration = calculateDuration(plan.startTime);
    returnValue.push(new TreeNode(
        `⏱️ Duration: ${duration}`,
        vscode.TreeItemCollapsibleState.None,
        ElementTypes.planDetail,
        undefined,
        element.sharedoClient,
        element,
        undefined,
        undefined,
        undefined,
        plan
    ));

    if (plan.sharedoTitle) {
        returnValue.push(new TreeNode(
            `📄 Sharedo: ${plan.sharedoTitle}`,
            vscode.TreeItemCollapsibleState.None,
            ElementTypes.planDetail,
            undefined,
            element.sharedoClient,
            element,
            undefined,
            undefined,
            undefined,
            plan
        ));
    }

    // Sub-processes
    if (plan.subProcesses && plan.subProcesses.length > 0) {
        returnValue.push(new TreeNode(
            `🔧 Sub-Processes (${plan.subProcesses.length})`,
            vscode.TreeItemCollapsibleState.Collapsed,
            ElementTypes.subProcesses,
            async () => generateSubProcessNodes(element, plan.subProcesses!),
            element.sharedoClient,
            element,
            undefined,
            undefined,
            undefined,
            plan.subProcesses
        ));
    }

    return returnValue;
}

/**
 * Generate sub-process nodes
 */
async function generateSubProcessNodes(element: TreeNode, subProcesses: ISubProcess[]): Promise<TreeNode[]> {
    let returnValue: TreeNode[] = [];

    for (const subProcess of subProcesses) {
        const icon = subProcess.entryPoint ? "arrow-right" : 
                    subProcess.endState ? "stop-circle" : 
                    subProcess.optimalPath ? "check" : "circle";
        
        const flags = [];
        if (subProcess.entryPoint) { flags.push("Entry"); }
        if (subProcess.endState) { flags.push("End"); }
        if (subProcess.optimalPath) { flags.push("Optimal"); }
        if (subProcess.debug) { flags.push("Debug"); }
        
        const flagsStr = flags.length > 0 ? ` [${flags.join(', ')}]` : '';
        
        returnValue.push(new TreeNode(
            `${subProcess.name}${flagsStr}`,
            vscode.TreeItemCollapsibleState.None,
            ElementTypes.subProcess,
            undefined,
            element.sharedoClient,
            element,
            undefined,
            undefined,
            icon,
            subProcess
        ));
    }

    return returnValue;
}

/**
 * Generate advisor issues nodes
 */
async function generateAdvisorIssuesNodes(element: TreeNode): Promise<TreeNode[]> {
    let returnValue: TreeNode[] = [];

    try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('API call timeout')), 10000); // 10 second timeout
        });

        const issues = await Promise.race([
            element.sharedoClient.getAdvisorIssues(),
            timeoutPromise
        ]);
        
        if (issues && issues.length > 0) {
            // Group by severity
            const grouped = groupIssuesBySeverity(issues);
            
            for (const [severity, severityIssues] of Object.entries(grouped)) {
                if (severityIssues.length > 0) {
                    const severityIcon = getSeverityIcon(severity as any);
                    const severityNode = new TreeNode(
                        `${severityIcon} ${severity.toUpperCase()} (${severityIssues.length})`,
                        vscode.TreeItemCollapsibleState.Collapsed,
                        ElementTypes.issueGroup,
                        async () => generateIssueNodes(element, severityIssues),
                        element.sharedoClient,
                        element,
                        undefined,
                        undefined,
                        undefined,
                        severityIssues
                    );
                    returnValue.push(severityNode);
                }
            }
        } else {
            returnValue.push(new TreeNode(
                "✅ No advisor issues found",
                vscode.TreeItemCollapsibleState.None,
                ElementTypes.info,
                undefined,
                element.sharedoClient,
                element
            ));
        }

    } catch (error) {
        console.error('Error loading advisor issues:', error);
        
        const errorMessage = error instanceof Error && error.message === 'API call timeout' 
            ? "⏱️ Timeout loading advisor issues"
            : "❌ Error loading advisor issues";
            
        returnValue.push(new TreeNode(
            errorMessage,
            vscode.TreeItemCollapsibleState.None,
            ElementTypes.error,
            undefined,
            element.sharedoClient,
            element,
            undefined,
            error instanceof Error ? error.message : String(error)
        ));
    }

    return returnValue;
}

/**
 * Generate individual issue nodes
 */
async function generateIssueNodes(element: TreeNode, issues: IAdvisorIssue[]): Promise<TreeNode[]> {
    let returnValue: TreeNode[] = [];

    for (const issue of issues) {
        const issueNode = new TreeNode(
            issue.title,
            vscode.TreeItemCollapsibleState.None,
            ElementTypes.advisorIssue,
            undefined,
            element.sharedoClient,
            element,
            undefined,
            undefined,
            "info",
            issue
        );
        
        issueNode.tooltip = `${issue.description}\\n\\nRecommendation: ${issue.recommendation}`;
        returnValue.push(issueNode);
    }

    return returnValue;
}

/**
 * Calculate execution statistics from plans
 */
function calculateExecutionStatistics(plans: IExecutingPlanEnhanced[]) {
    return {
        totalPlans: plans.length,
        running: plans.filter(p => p.status === 'running').length,
        paused: plans.filter(p => p.status === 'paused').length,
        completed: plans.filter(p => p.status === 'completed').length,
        failed: plans.filter(p => p.status === 'failed').length,
        queued: plans.filter(p => p.status === 'queued').length,
        cancelled: plans.filter(p => p.status === 'cancelled').length
    };
}

/**
 * Get status icon for plan state
 */
function getStatusIcon(status: string): string {
    switch (status) {
        case 'running': return '▶️';
        case 'paused': return '⏸️';
        case 'completed': return '✅';
        case 'failed': return '❌';
        case 'queued': return '⏳';
        case 'cancelled': return '🚫';
        default: return '❓';
    }
}

/**
 * Get severity icon for advisor issues
 */
function getSeverityIcon(severity: 'info' | 'warning' | 'error' | 'critical'): string {
    switch (severity) {
        case 'critical': return '🔴';
        case 'error': return '🟠';
        case 'warning': return '🟡';
        case 'info': return '🔵';
        default: return '⚪';
    }
}

/**
 * Group issues by severity
 */
function groupIssuesBySeverity(issues: IAdvisorIssue[]): Record<string, IAdvisorIssue[]> {
    return issues.reduce((acc, issue) => {
        if (!acc[issue.severity]) {
            acc[issue.severity] = [];
        }
        acc[issue.severity].push(issue);
        return acc;
    }, {} as Record<string, IAdvisorIssue[]>);
}

/**
 * Calculate duration from start time
 */
function calculateDuration(startTime: string): string {
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
        return `${diffHours}h ${diffMinutes}m`;
    } else {
        return `${diffMinutes}m`;
    }
}

/**
 * Format date time for display
 */
function formatDateTime(dateTime: string): string {
    const date = new Date(dateTime);
    return date.toLocaleString();
}
