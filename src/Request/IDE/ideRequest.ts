import { RequestBase, ResultType, MethodType } from "../ExecutionBase";
import { IPostProcessedSharedoIDERequestResult, ISharedoIDERequestResult, ISharedoIDEItem, IPostProcessedSharedoIDEItem } from "./IIDE";

export class IDERequest extends RequestBase <IPostProcessedSharedoIDERequestResult,undefined>
{
    resultType: ResultType = ResultType.json;
    method: MethodType = MethodType.get;
    inputProperties= undefined ;
    information= 
    {
        description: "Get the IDE",
        displayName: "IDE",
        created: "2018-01-01",
        categories: "IDE"
    };
    path= "/api/ide";

    override async postProcessResults(result: ISharedoIDERequestResult): Promise<IPostProcessedSharedoIDERequestResult> {
         let retValue : IPostProcessedSharedoIDERequestResult = [];

        result.forEach((item) => {
            retValue.push(this.buildTree(item));
        });

        return retValue;
    }
    buildTree(item: ISharedoIDEItem, parent?: IPostProcessedSharedoIDEItem): IPostProcessedSharedoIDEItem {

        let result: IPostProcessedSharedoIDEItem = {
            id: item.id,
            name: item.name,
            parent: parent,
            type: item.type,
            children: []
        };

        if(item.children === undefined)
        {
            return result;
        }

        
        for (let i = 0; i < item.children.length; i++) {
            let child = item.children[i] as IPostProcessedSharedoIDEItem;
            if(result.children === undefined){result.children = [];}
            result.children.push(this.buildTree(child, result));
        }

        return result;
    }
    
}
