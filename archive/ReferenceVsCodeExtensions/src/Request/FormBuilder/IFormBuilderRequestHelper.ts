// import { IExecutionBaseResult } from "../../Execution/IExecutionBaseResult";
// import { SharedoClient } from "../../sharedoClient";
// import { IFormBuilderRequestResult } from "./IFormBuilderRequestResult";
// import { FormbuilderListRequest } from "./formbuilderListRequest";


// export async function getFormBuilderAsIExecutionBaseResult(sharedoClient : SharedoClient, listViewSystemName:string,contextId?:string): Promise<IExecutionBaseResult<IFormBuilderRequestResult>> {
//     let exec = new FormbuilderListRequest(sharedoClient);
    
//     let r = await exec.execute();
//     if(!r)
//     {
//         throw new Error("No result");
//     }
//     if (r.success !== true) {
//         console.log("Result Success :", r.success);
//         console.log("Result Error :", r.error);
//     }
   
    
//     let result: IExecutionBaseResult<IFormBuilderRequestResult> = {
//         success: r.success,
//         error: r.error,
//         result: r.result,
//         freindlyError: r.freindlyError,
//         executionTime: r.executionTime
//     };
//     return result;

// }

export {};