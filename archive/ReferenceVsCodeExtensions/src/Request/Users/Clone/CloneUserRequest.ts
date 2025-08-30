import { RequestBase, ResultType, MethodType } from "../../../Execution/ExecutionBase";
import { ICloneUserInput } from "./ICloneUserInput";
import { ICloneUserResponse } from "./ICloneUserResponse";

export class CloneUserRequest extends RequestBase <ICloneUserResponse,ICloneUserInput>
{
    resultType: ResultType = ResultType.json;
    method: MethodType = MethodType.post;
    inputProperties={
        userToCloneId: "",
        email: "",
        expirePassword: false,
        firstName: "",
        identityClaim: "",
        identityProvider: "",
        password: "",
        surname: ""
    };
    information= 
    {
        description: "Create a new user based on an existing user",
        displayName: "Clone User",
        created: "2023-May-4",
        categories: "Users",
        note:"The ID returned is not the ID of the new user"
    };
 
    get path()
    {
        return `/api/security/users/${this.inputProperties.userToCloneId}/_clone`;
    }
    
      
    override get body() 
    {
        return {
            email: this.inputProperties.email,
            expirePassword: this.inputProperties.expirePassword,
            firstName: this.inputProperties.firstName,
            identityClaim: this.inputProperties.identityClaim,
            identityProvider: this.inputProperties.identityProvider,
            password: this.inputProperties.password,
            surname: this.inputProperties.surname            
        };
    }
}
