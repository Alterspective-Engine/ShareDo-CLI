import { IExecutionBaseResult } from "../../Execution/IExecutionBaseResult";
import { SharedoClient } from "../../sharedoClient";
import { IListViewFilterItem } from "./IListViewInput";
import { ListViewRequest } from "./listViewRequest";

// Utility function for logging
function logInfo(func: string, message: string, context?: any) {
    console.log(`[INFO] [ListViewRequestHelper::${func}] ${message}`, context || '');
}

function logError(func: string, message: string, error?: any) {
    const errorDetails = error?.stack || error?.message || error;
    console.error(`[ERROR] [ListViewRequestHelper::${func}] ${message}`, errorDetails);
}

export async function getListViewAsIExecutionBaseResult<T>(sharedoClient: SharedoClient, listViewSystemName: string, contextId?: string, filter?: IListViewFilterItem[]): Promise<IExecutionBaseResult<T[]>> {
    logInfo('getListViewAsIExecutionBaseResult', 'Starting execution', { listViewSystemName, contextId, filter });

    try {
        let exec = new ListViewRequest<T>(sharedoClient);
        exec.inputProperties.listView = listViewSystemName;

        if (contextId) {
            exec.inputProperties.contextId = contextId;
        }

        if (filter) {
            exec.inputProperties.filters = filter;
        }

        let r = await exec.execute();

        if (!r) {
            const errorMessage = "No result returned from execute";
            logError('getListViewAsIExecutionBaseResult', errorMessage);
            throw new Error(errorMessage);
        }

        logInfo('getListViewAsIExecutionBaseResult', 'Execution result received', { resultLength: r.result?.rows.length, resultTotal: r.result?.resultCount });

        if (r.success !== true) {
            logError('getListViewAsIExecutionBaseResult', 'Execution was not successful', { success: r.success, error: r.error });
        }

        let resultsData = r.result?.rows.map((row) => row.data);

        let result: IExecutionBaseResult<T[]> = {
            success: r.success,
            error: r.error,
            result: resultsData,
            freindlyError: r.freindlyError,
            executionTime: r.executionTime
        };

        logInfo('getListViewAsIExecutionBaseResult', 'Returning processed result', result);
        return result;

    } catch (error) {
        logError('getListViewAsIExecutionBaseResult', 'An error occurred during execution', error);
        throw error;
    }
}