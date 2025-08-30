import { IExecutionBaseResult } from "../../Execution/IExecutionBaseResult";
import { CloneUserRequest } from "../../Request/Users/Clone/CloneUserRequest";
import { ICloneUserInput } from "../../Request/Users/Clone/ICloneUserInput";
import { ICloneUserResponse } from "../../Request/Users/Clone/ICloneUserResponse";
import { SharedoClient } from "../../sharedoClient";


export async function cloneUsers(sharedoClient: SharedoClient, input: ICloneUserInput[] ) 
{

    let response : IExecutionBaseResult<ICloneUserResponse>[] = [];
    //loop though the input array and call the clone user request for each item
    input.forEach((item) => {
        
        let executeItem = new CloneUserRequest(sharedoClient);
        executeItem.inputProperties = item;

        executeItem.execute().then((result) => {            
            response.push(result);
        }).catch((error) => {
            console.log(error);
        });
    });
    

}