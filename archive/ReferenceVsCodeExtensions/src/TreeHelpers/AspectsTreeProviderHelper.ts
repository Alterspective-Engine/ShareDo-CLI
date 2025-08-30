
import { IModellerAspectInfo, IGetWorkTypeAspectsRequestResult } from "../Request/Aspects/IGetWorkTypeAspectsRequest";
import { TreeNode } from "../treeprovider";
import { TNodeWorkType, TNodeWorkTypeCreatePermission } from "./WorkTypesTreeProviderHelper";
import { ElementTypes } from "../enums";
import * as vscode from 'vscode';
import { generateObjectKeysInfoTreeNodes } from "../Helpers/treeProviderHelper";

export type TNodeWorkTypeAspectSection = {
    workType: TNodeWorkType,
    aspects: IModellerAspectInfo[]
};

export async function generateWorkTypeAspectsSections(element: TreeNode): Promise<TreeNode[]> {
    let returnValue: TreeNode[] = [];
    let workType : TNodeWorkType = element.additionalData as TNodeWorkType;

    let workTypeAspects =await element.sharedoClient.getWorkTypeAspectsSections(workType.systemName);
    if (workTypeAspects === undefined) {
        return [];
    }

    //loop though arrays in workTypeAspects
    for (const [key, value] of Object.entries(workTypeAspects)) {
        let modellerAspectInfo = value as IModellerAspectInfo[];
        let passDownData:TNodeWorkTypeAspectSection = 
        {
            workType: workType,
            aspects: modellerAspectInfo
        };
        let newNode: TreeNode = new TreeNode(key, vscode.TreeItemCollapsibleState.Collapsed, ElementTypes.workTypeAspectSection, generateAspectSection, element.sharedoClient, element, undefined, undefined, "fa-house", passDownData);
        returnValue.push(newNode);
    };
    return returnValue;
  }

  export type TNodeWorkTypeAspect = {
    workType: TNodeWorkType,
    aspect: IModellerAspectInfo
};

/**
 * Generate the aspect section for the work type aspects tree
 * 
 * @param element 
 * @returns 
 */
    export async function generateAspectSection(element: TreeNode): Promise<TreeNode[]> {
        let returnValue: TreeNode[] = [];
        let aspectSection : TNodeWorkTypeAspectSection = element.additionalData as TNodeWorkTypeAspectSection;
        let workType : TNodeWorkType = aspectSection.workType;
        let aspects : IModellerAspectInfo[] = aspectSection.aspects;
         for (const aspect of aspects) {
            let passDownData : TNodeWorkTypeAspect =
            {
                workType: workType,
                aspect: aspect

            };

            let label = aspect.displayName;
            if(aspect.widgetTitle)
            {
                label = `${aspect.widgetTitle} - (${aspect.displayName})`;
            }


            let newNode: TreeNode = new TreeNode(label, vscode.TreeItemCollapsibleState.Collapsed, ElementTypes.workTypeAspect, generateWorkTypeAspect, element.sharedoClient, element, undefined, undefined, "fa-house", passDownData);
            returnValue.push(newNode);
        };
        return returnValue;
    }


    export async function generateWorkTypeAspect(element:TreeNode)
    {
        let aspect : TNodeWorkTypeAspect = element.additionalData as TNodeWorkTypeAspect;
        let workType : TNodeWorkType = aspect.workType;
        let aspectInfo : IModellerAspectInfo = aspect.aspect;
        let returnValue: TreeNode[] = [];

        let retValue = await generateObjectKeysInfoTreeNodes(aspectInfo,element,false);

        //remove Config from the tree
        retValue = retValue.filter(x => x.label !== "Config");

        if(aspectInfo.config)
        {
            try
            {   
                let configAsData = JSON.parse(aspectInfo.config);
                let configSection = new TreeNode("Config",vscode.TreeItemCollapsibleState.Collapsed,ElementTypes.info,configAsData,element.sharedoClient,element,undefined,undefined,"fa-info_sign");
                retValue.push(configSection);

            }
            catch
            {}
        }

      return retValue;
    }



