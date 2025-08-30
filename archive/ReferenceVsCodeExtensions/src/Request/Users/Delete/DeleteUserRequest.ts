import { RequestBase, ResultType, MethodType } from "../../../Execution/ExecutionBase";
import { IDeleteUserInput } from "./IDeleteUserInput";

export class DeleteUserRequest extends RequestBase <undefined,IDeleteUserInput>
{
    resultType: ResultType = ResultType.json;
    method: MethodType = MethodType.delete;
    inputProperties={
        userToDeleteId: ""
    };
    information= 
    {
        description: "Delete existing user",
        displayName: "Delete User",
        created: "2023-May-6",
        categories: "Users"
    };
 
    get path()
    {
        return `/api/user/${this.inputProperties.userToDeleteId}`;

    }
    
}
