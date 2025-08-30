import { RequestBase, MethodType, ResultType } from "../../../Execution/ExecutionBase";
import { IListViewResult } from "../../ListViews/IListView";
import { IListViewFilterItem } from "../../ListViews/IListViewInput";
import { IGetTemplateInput } from "./IGetTemplateInput";
import { IShareDoTemplate } from "../IShareDoTemplate";

export class GetTemplate extends RequestBase <IShareDoTemplate,IGetTemplateInput>
{
    resultType: ResultType = ResultType.json;
    method: MethodType = MethodType.get;
    inputProperties={
       systemName: ""
    } ;
    information= 
    {
        description: "Get Template",
        displayName: "Get Template",
        created: "2023-May-10",
        categories: "Templates"
    };
    
    get path()
    {
        return `/api/admin/docGen/templates/${this.inputProperties.systemName}`;  
    }

 

        
}
