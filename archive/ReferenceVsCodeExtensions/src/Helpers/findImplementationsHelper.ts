/**
 * Find Implementations Helper for ShareDo VS Code Extension
 *
 * Provides functions to locate and process implementations of IDE items (such as workflows) on the server.
 * Used for dynamic tree generation and workflow analysis.
 */


import { ElementTypes } from "../enums";
import { SharedoClient } from "../sharedoClient";
import * as JSON5 from 'json5';
import { TreeNode } from "../treeprovider";
import * as vscode from 'vscode';
import { SharedoIDETemplateResponse } from "../Request/IDETemplates/IIDETemplate";
import { IPostProcessedSharedoIDEItem, SharedoIDEType } from "../Request/IDE/ISharedoIDERequestResult";
import { downloadIDEFile } from "../Request/File/ExtensionHelpers/fileDownloading";
import { SharedoWorkflowRequestInput } from "../Request/Workflows/workflowRequest";
import { SharedoWFStep } from "../Request/Workflows/IWorkflow";
/**
   * Reads an object and create TreeNodes of its properties 
   * This is to dynamically render object details
   * @param element 
   */
export async function findIDEItemImplementations(systemName: string, server: SharedoClient) {


   
    
    let foundImplementations = new Array<{ workflowId: string; steps: SharedoWFStep[]; }>();

     let workflows = await server.getWorkflows();
        if(!workflows)
        {
            throw new Error("Could not find any workflows");
          
        }

    for(let i = 0; i < workflows.rows.length; i++) {
        let workflow = workflows.rows[i];
     
        try{
        let workflowItem = await server.getWorkflow({systemName: workflow.id});
        if(!workflowItem)
        {
            continue;
        }

        //workflowItem.steps[0].actions[0].actionSystemName
        //check if workflowItem has an action with the same systemName
        //let foundImplementationsSteps = workflowItem.steps.filter(s => s.actions.filter(a => a.actionSystemName === systemName));

        //search for the systemName in the workflowItem steps actions 
        let foundImplementationsSteps = new Array<SharedoWFStep>();
        for(let j = 0; j < workflowItem.steps.length; j++) {
            let step = workflowItem.steps[j];
            for(let k = 0; k < step.actions.length; k++) {
                let action = step.actions[k];
                if(action.actionSystemName === systemName)
                {
                    foundImplementationsSteps.push(step);
                }
            }
        }



        if(foundImplementationsSteps.length > 0)
        {
            foundImplementations.push({workflowId: workflow.id, steps: foundImplementationsSteps});
        }    
    }
        catch(e)
        {
            console.log(e);
            //ignore
        }        
    
    }


    return foundImplementations;
    

}
export async function getSystemNameFromManifestItem(ideItem: IPostProcessedSharedoIDEItem, server: SharedoClient) {
    
    //find the workflow WfActionManifest
    let foundManifest = ideItem.children?.find(c => c.type === SharedoIDEType.wfActionManifest);
    if (!foundManifest) {
        foundManifest = ideItem.parent?.children?.find(c => c.type === SharedoIDEType.wfActionManifest);
    }
    if (!foundManifest) {
        throw new Error("Could not find the manifest for this item");

    }

    let ideItemContents = await server.getIDEFile(foundManifest);
    if (!ideItemContents) {
        throw new Error("Could not find the contents for this item");

    }

    let mf: SharedoWFActionManifest = JSON5.parse(ideItemContents.content);

    let systemName = mf.systemName;
    return  systemName ;
}

