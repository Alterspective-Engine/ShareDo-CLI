import { RequestBase, ResultType, MethodType } from "../../Execution/ExecutionBase";
import { SharedoClient } from "../../sharedoClient";

/**
 * Interface for cancellation request
 */
export interface ICancelExecutionRequest {
    reason?: string;
    force?: boolean;
}

/**
 * Interface for cancellation response
 */
export interface ICancelExecutionResponse {
    cancellationId: string;
    status: 'requested' | 'in_progress' | 'completed' | 'failed';
}

/**
 * Cancel a currently executing plan
 */
export class CancelExecution extends RequestBase<ICancelExecutionResponse, ICancelExecutionRequest> {
    
    resultType: ResultType = ResultType.json;
    method: MethodType = MethodType.post;
    inputProperties: ICancelExecutionRequest = {};
    information = {
        description: "Cancel Currently Executing Plan",
        displayName: "Cancel Plan Execution",
        created: "27-Jan-2025",
        categories: "Workflow,Execution"
    };

    private planExecutionId: string = '';

    constructor(client: SharedoClient) {
        super(client);
    }

    get path(): string {
        return `/api/executionengine/plans/executing/${this.planExecutionId}/cancel`;
    }

    /**
     * Set the plan execution ID to cancel
     * @param planExecutionId The unique identifier of the plan execution to cancel
     */
    public setPlanExecutionId(planExecutionId: string): this {
        this.planExecutionId = planExecutionId;
        return this;
    }

    /**
     * Set cancellation parameters
     * @param reason Reason for cancellation
     * @param force Force cancellation even if plan is in critical state
     */
    public setCancellationParams(reason?: string, force: boolean = false): this {
        this.inputProperties = {
            reason,
            force
        };
        return this;
    }
}
