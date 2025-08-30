import { RequestBase, ResultType, MethodType } from "../../Execution/ExecutionBase";
import { SharedoClient } from "../../sharedoClient";

/**
 * Interface for advisor issue
 */
export interface IAdvisorIssue {
    id: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    category: string;
    title: string;
    description: string;
    recommendation: string;
    planId?: string;
    stepId?: string;
    detected: string;
    resolved: boolean;
}

/**
 * Get workflow advisor issues and recommendations
 */
export class GetAdvisorIssues extends RequestBase<IAdvisorIssue[], { severity?: string; category?: string }> {
    
    resultType: ResultType = ResultType.json;
    method: MethodType = MethodType.get;
    inputProperties: { severity?: string; category?: string } = {};
    information = {
        description: "Get Workflow Advisor Issues and Recommendations",
        displayName: "Get Workflow Advisor Issues",
        created: "27-Jan-2025",
        categories: "Workflow,Monitoring,Advisor"
    };

    constructor(client: SharedoClient) {
        super(client);
    }

    get path(): string {
        const params = new URLSearchParams();
        if (this.inputProperties?.severity) {
            params.append('severity', this.inputProperties.severity);
        }
        if (this.inputProperties?.category) {
            params.append('category', this.inputProperties.category);
        }
        
        const queryString = params.toString();
        return queryString ? `/api/executionengine/visualmodeller/advisorIssues?${queryString}` : `/api/executionengine/visualmodeller/advisorIssues`;
    }

    /**
     * Set filter parameters
     * @param severity Filter by issue severity
     * @param category Filter by issue category
     */
    public setFilters(severity?: 'info' | 'warning' | 'error' | 'critical', category?: string): this {
        this.inputProperties = { severity, category };
        return this;
    }
}
