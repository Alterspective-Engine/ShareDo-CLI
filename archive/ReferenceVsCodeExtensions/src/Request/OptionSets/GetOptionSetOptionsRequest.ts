
import { RequestBase, ResultType, MethodType } from "../../Execution/ExecutionBase";
import { IOptionSetInfo } from "./IOptionSet";

export type GetOptionSetOptionsRequestInput = {
    optionSetSystemName: string;
};

export class GetOptionSetOptionsRequest extends RequestBase <IOptionSetInfo,GetOptionSetOptionsRequestInput>
{
    resultType: ResultType = ResultType.json;
    method: MethodType = MethodType.get;
    inputProperties={
        optionSetSystemName    : ""
    } ;
    information= 
    {
        description: "Get Option Set Info and Values",
        displayName: "Get Option Set",
        created: "10-Aug-2023",
        categories: "OptionSets"
    };
 
    get path()
    {
        return `api/admin/ods/OptionSets/${this.inputProperties.optionSetSystemName}`;
        ///api/admin/ods/OptionSets/billing-frequency
    }

    
}

