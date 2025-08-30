import { RequestBase, ResultType, MethodType } from "../../Execution/ExecutionBase";
import { SharedoClient } from "../../sharedoClient";

/**
 * Interface for executing plan details (enhanced version)
 */
export interface IExecutingPlanEnhanced {
    executionId: string;
    planId: string;
    planName: string;
    planTitle: string;
    planDescription: string;
    status: 'queued' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
    state: string;
    startTime: string;
    endTime?: string;
    estimatedCompletion?: string;
    progress?: {
        percentage: number;
        currentStep: string;
        totalSteps: number;
    };
    sharedoTitle?: string;
    sharedoReference?: string;
    sharedoTypeSystemName?: string;
    sharedoId?: string;
    planType: string;
    planSystemName: string;
    subProcesses?: ISubProcess[];
    lastErrored?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    meta?: any;
    parentPlanExecutionId?: string;
}

export interface ISubProcess {
    systemName: string;
    name: string;
    description?: string;
    optimalPath: boolean;
    endState: boolean;
    debug: boolean;
    entryPoint: boolean;
}

/**
 * Interface for the executing plans response with pagination
 */
export interface IExecutingPlansResponse {
    plans: IExecutingPlanEnhanced[];
    totalCount: number;
}

/**
 * Enhanced version of executing plans request with additional functionality
 * Extends the existing workflow executing request with monitoring capabilities
 */
export class GetExecutingPlansEnhanced extends RequestBase<IExecutingPlansResponse, { limit?: number; offset?: number }> {
    
    resultType: ResultType = ResultType.json;
    method: MethodType = MethodType.get;
    inputProperties: { limit?: number; offset?: number } = {};
    information = {
        description: "Get Enhanced List of Executing Event Engine Plans with Monitoring",
        displayName: "Get Enhanced Executing Event Engine Plans",
        created: "27-Jan-2025",
        categories: "Workflow,Monitoring"
    };

    constructor(client: SharedoClient) {
        super(client);
    }

    get path(): string {
        const params = new URLSearchParams();
        if (this.inputProperties?.limit) {
            params.append('limit', this.inputProperties.limit.toString());
        }
        if (this.inputProperties?.offset) {
            params.append('offset', this.inputProperties.offset.toString());
        }
        
        const queryString = params.toString();
        return queryString ? `/api/executionengine/plans/executing?${queryString}` : `/api/executionengine/plans/executing`;
    }

    /**
     * Set pagination parameters
     * @param limit Maximum number of results (default: 50)
     * @param offset Number of results to skip (default: 0)
     */
    public setPagination(limit: number = 50, offset: number = 0): this {
        this.inputProperties = { limit, offset };
        return this;
    }
}
