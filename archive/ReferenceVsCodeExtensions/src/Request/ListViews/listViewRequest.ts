import { RequestBase, MethodType, ResultType } from "../../Execution/ExecutionBase";
import { IListViewResult } from "./IListView";
import { IListViewFilter, IListViewFilterItem } from "./IListViewInput";




export class ListViewRequest<TListViewData> extends RequestBase <IListViewResult<TListViewData>,IListViewFilter>
{
    resultType: ResultType = ResultType.json;
    method: MethodType = MethodType.post;
    inputProperties:IListViewFilter={
        additionalParameters: {},
        listView: "",
        contextId:"",
        sortColumn: "username",
        rows: 1000,
        page: 1,
        filters: new Array<IListViewFilterItem>()
    } ;

    
    information= 
    {
        description: "Get List View",
        displayName: "List View",
        created: "2023-Apr-27",
        categories: "ListView"
    };
    
    get path()
    {
        //example /api/listview/core-admin-sharedo-type-create-permissions/20/1/subject/asc/?view=table&withCounts=1&contextId=matter

        return `/api/listview/${this.inputProperties.listView}/${this.inputProperties.rows}/${this.inputProperties.page}/${this.inputProperties.sortColumn}/asc/?view=table&withCounts=1&contextId=${this.inputProperties.contextId}`;

    }

    get body()
    {
        return this.inputProperties;
    }

    override async postProcessResults<T>(result: IListViewResult<T>): Promise<IListViewResult<T>> {
        return result;
    }      
}

