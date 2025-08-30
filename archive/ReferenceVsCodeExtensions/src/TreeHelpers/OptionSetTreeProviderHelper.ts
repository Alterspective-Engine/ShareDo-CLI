import { findOptionSetOptionById } from "../Helpers/optionSetHelpers";
import { generateObjectKeysInfoTreeNodes } from "../Helpers/treeProviderHelper";
import { IOptionsSet } from "../Request/OptionSets/GetOptionsSetsRequest";
import { showOutputInFile } from "../Utilities/fileManagement";
import { ElementTypes } from "../enums";
import { TreeNode } from "../treeprovider";
import * as vscode from 'vscode';
import { generateReportOutput } from "./ReportHelper";
import { Guid } from "guid-typescript";

export async function generateOptionSets(element: TreeNode): Promise<TreeNode[]> {
    let returnValue: TreeNode[] = [];
    let optionSets = await element.sharedoClient.getOptionSets();
    if (optionSets) {

        for(let i = 0; i < optionSets.length; i++)
        {
            let optionSet = optionSets[i];
            let newNode: TreeNode = new TreeNode(optionSet.name, vscode.TreeItemCollapsibleState.Collapsed, ElementTypes.optionSet, generateOptionSet, element.sharedoClient, element, undefined, undefined, "fa-house", optionSet);
            
            let id = newNode.id;

            //check if this option set has already been added
            // let existingNode = returnValue.filter(x => x.id === id);
            // if(existingNode.length > 0)
            // {
            //     //if it has, then add the option set to the existing node
            //     //existingNode.additionalData.push(optionSet);
            //     let newGuid = Guid.create();
            //     newNode.id = newGuid.toString();
            //     //  continue;
            // }
            
            returnValue.push(newNode);
        }

        // for (const optionSet of optionSets) {
            
        //     let newNode: TreeNode = new TreeNode(optionSet.name, vscode.TreeItemCollapsibleState.Collapsed, ElementTypes.optionSet, generateOptionSet, element.sharedoClient, element, undefined, undefined, "fa-house", optionSet);
        //     returnValue.push(newNode);
        // }
    }
    return returnValue;
}

async function generateOptionSet(element: TreeNode): Promise<TreeNode[]> {
    let returnValue: TreeNode[] = [];
    
    let optionSet: IOptionsSet = element.additionalData;
    let optionSetInfo = await element.sharedoClient.getOptionSetInfo(optionSet.optionSetName);

    let optionSetDataKeysInfo = await generateObjectKeysInfoTreeNodes(optionSetInfo?.optionSetProperty, element);
    let optionSetOptions = await generateObjectKeysInfoTreeNodes(optionSetInfo?.optionSetValueProperties, element);
    returnValue.push(...optionSetDataKeysInfo);
    returnValue.push(...optionSetOptions);
    return returnValue;
}

export async function findOptionSetOptionByIdTreeCommand(node: TreeNode)
{

    let id = await vscode.window.showInputBox(
        { prompt: "Enter OptionSet Option Id to search for", value: "" });
    
    
        if(!id)
        {
            return;
        }

        let optionSet = await findOptionSetOptionById(parseInt(id), node.sharedoClient);

        
        generateReportOutput(node.sharedoClient, "findOptionSetOptionById", optionSet);
        

}