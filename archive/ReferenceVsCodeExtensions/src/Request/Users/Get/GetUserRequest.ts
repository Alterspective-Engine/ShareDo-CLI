import { RequestBase, ResultType, MethodType } from "../../../Execution/ExecutionBase";
import { IGetUserInput } from "./IGetUserInput";
import { IGetUserResponse } from "./IGetUserResponse";

export class GetUserRequest extends RequestBase <IGetUserResponse,IGetUserInput>
{
    resultType: ResultType = ResultType.json;
    method: MethodType = MethodType.get;
    inputProperties={
        userId: ""       
    };
    information= 
    {
        description: "Get User",
        displayName: "Get User",
        created: "2023-May-6",
        categories: "Users",
        note:""
    };
 
    get path()
    {
        return `/api/aspects/ods/user/${this.inputProperties.userId}`;
    }
    
      
    // override get body() 
    // {
    //     return {
    //         email: this.inputProperties.email,
    //         expirePassword: this.inputProperties.expirePassword,
    //         firstName: this.inputProperties.firstName,
    //         identityClaim: this.inputProperties.identityClaim,
    //         identityProvider: this.inputProperties.identityProvider,
    //         password: this.inputProperties.password,
    //         surname: this.inputProperties.surname            
    //     };
    // }
}
