import { RequestBase, ResultType, MethodType } from "../../Execution/ExecutionBase";
import { IFormBuilderRequestResult } from "./IFormBuilderRequestResult";

export type FormbuilderRequestInput = {
    id: string;
};

export class FormbuilderLoadRequest extends RequestBase <IFormBuilderRequestResult,FormbuilderRequestInput>
{
    resultType: ResultType = ResultType.json;
    method: MethodType = MethodType.get;
    inputProperties: FormbuilderRequestInput =
    {
        id: ""
    } ;
    information= 
    {
        description: "Get single FormBuilder and all its fields",
        displayName: "Get FormBuilder by System Name",
        created: "16-Jun-2024",
        categories: "FormBuilder"
    };
   
    override async postProcessResults(result: IFormBuilderRequestResult): Promise<IFormBuilderRequestResult> {
        return result;
    }
 
    get path()
    {
        return `/api/formbuilder/forms/${this.inputProperties.id}`;
        ///api/formbuilder/forms/1a266063-c2f6-4c1a-8068-73ad0f450ae1
    }
}

