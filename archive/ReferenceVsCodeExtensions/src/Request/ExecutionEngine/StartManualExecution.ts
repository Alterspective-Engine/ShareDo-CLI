import { RequestBase, ResultType, MethodType } from "../../Execution/ExecutionBase";
import { SharedoClient } from "../../sharedoClient";

/**
 * Interface for manual execution request
 */
export interface IManualExecutionRequest {
    planId: string;
    context: any;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    timeout?: number;
    parameters?: any;
}

/**
 * Interface for manual execution response
 */
export interface IManualExecutionResponse {
    executionId: string;
    status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
    startedAt: string;
}

/**
 * Start manual execution of a workflow plan
 */
export class StartManualExecution extends RequestBase<IManualExecutionResponse, IManualExecutionRequest> {
    
    resultType: ResultType = ResultType.json;
    method: MethodType = MethodType.post;
    inputProperties: IManualExecutionRequest = {
        planId: '',
        context: {}
    };
    information = {
        description: "Start Manual Execution of Workflow Plan",
        displayName: "Start Manual Workflow Execution",
        created: "27-Jan-2025",
        categories: "Workflow,Execution"
    };

    constructor(client: SharedoClient) {
        super(client);
    }

    get path(): string {
        return `/api/executionengine/manualExecution`;
    }

    /**
     * Set execution parameters
     * @param planId ID of the plan to execute
     * @param context Execution context and parameters
     * @param priority Execution priority (default: normal)
     * @param timeout Execution timeout in seconds
     * @param parameters Plan-specific parameters
     */
    public setExecutionParams(
        planId: string, 
        context: any, 
        priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal',
        timeout?: number,
        parameters?: any
    ): this {
        this.inputProperties = {
            planId,
            context,
            priority,
            timeout,
            parameters
        };
        return this;
    }
}
