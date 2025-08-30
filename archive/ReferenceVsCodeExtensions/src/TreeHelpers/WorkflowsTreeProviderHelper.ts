
import { TreeNode } from "../treeprovider";
import * as vscode from 'vscode';
import { ElementTypes } from "../enums";
import { SharedoWorkflowRow } from "../Request/Workflows/IWorkflows";
import { SharedoWFAction, SharedoWFConfig, SharedoWFStep, SharedoWorkflowRequestResult } from "../Request/Workflows/IWorkflow";
import { generateObjectKeysInfoTreeNodes } from "../Helpers/treeProviderHelper";

  /**
   * When ever a folder is opened get all the child folders and child items 
   * then for each child items that is a WorkItem pre-fetch the WorkItem details 
   * @param element  
   */
  export async function generateWorkflowsTreeNodes(element: TreeNode): Promise<TreeNode[]> {
    let returnValue: TreeNode[] = [];
    let folder: any = element.data;


    //element.children = [];


    return element.sharedoClient.getWorkflows().then(async workflowResult => {
      
      if(workflowResult === undefined)
      {
         return[];
      }

      element.sharedoClient.workflows = workflowResult.rows;
        
      for(let i = 0; i <  element.sharedoClient.workflows.length; i++)
      {
        let newWorkflow =  element.sharedoClient.workflows[i];
        
        let newNode : TreeNode = new TreeNode(newWorkflow.data.name, vscode.TreeItemCollapsibleState.Collapsed, ElementTypes.workflow, newWorkflow, element.sharedoClient, element);
        returnValue.push(newNode);
      }

      return returnValue;
    });

    //let res = Promise.resolve(TreeNode.sortByLabel(returnValue));

  }

  

  export async function generateWorkflowTreeNodes(element: TreeNode): Promise<TreeNode[]> {
    let returnValue: TreeNode[] = [];
    let row: SharedoWorkflowRow = element.data;


    element.children = [];
    returnValue.push(new TreeNode("Name: " + row.data.name, vscode.TreeItemCollapsibleState.None, ElementTypes.info, row, element.sharedoClient, element));
    returnValue.push(new TreeNode("Description: " + row.data.description, vscode.TreeItemCollapsibleState.None, ElementTypes.info, row, element.sharedoClient, element));
    returnValue.push(new TreeNode("InstanceCount: " + row.data.instanceCount, vscode.TreeItemCollapsibleState.None, ElementTypes.info, row, element.sharedoClient, element));

    let workflowDefinition =  element.sharedoClient.getWorkflow({systemName:row.data.systemName});

    returnValue.push(new TreeNode("Definition", vscode.TreeItemCollapsibleState.Collapsed, ElementTypes.workflowDefinition, workflowDefinition, element.sharedoClient, element));

    return returnValue;
  }

  export async function generateWorkflowDefinitionTreeNodes(element: TreeNode): Promise<TreeNode[]> {
    let returnValue: TreeNode[] = [];
    let definitionPromise: Promise<SharedoWorkflowRequestResult | undefined> = element.data;


    let definition = await definitionPromise;

    if(definition === undefined)
    {
      return [];
    }

  //   export interface SharedoWorkflowRequestResult {
  //     systemName:                          string;
  //     name:                                string;
  //     description:                         string;
  //     overrideNotifications:               boolean;
  //     exceptionNotifications:              boolean;
  //     exceptionNotificationEmailAddresses: null;
  //     variables:                           SharedoWFVariable[];
  //     steps:                               SharedoWFStep[];
  // }
    
    // returnValue.push(new TreeNode("System Name: " + definition.systemName, vscode.TreeItemCollapsibleState.None, ElementTypes.info, definition, element.sharedoClient, element));
    // returnValue.push(new TreeNode("Name: " + definition.name, vscode.TreeItemCollapsibleState.None, ElementTypes.info, definition, element.sharedoClient, element));
    // returnValue.push(new TreeNode("Description: " + definition.description, vscode.TreeItemCollapsibleState.None, ElementTypes.info, definition, element.sharedoClient, element));
   
    return generateObjectKeysInfoTreeNodes(definition, element);
   
    // returnValue.push(new TreeNode("Exception Notification To: " + definition.exceptionNotificationEmailAddresses, vscode.TreeItemCollapsibleState.None, ElementTypes.info, definition, element.sharedoClient, element));
    // returnValue.push(new TreeNode("Override Notifications: " + definition.overrideNotifications, vscode.TreeItemCollapsibleState.None, ElementTypes.info, definition, element.sharedoClient, element));
    // returnValue.push(new TreeNode("Exception Notifications: " + definition.exceptionNotifications, vscode.TreeItemCollapsibleState.None, ElementTypes.info, definition, element.sharedoClient, element));
    
    // returnValue.push(new TreeNode("Steps", vscode.TreeItemCollapsibleState.Collapsed, ElementTypes.infos, definition.steps, element.sharedoClient, element));
    // returnValue.push(new TreeNode("Variables", vscode.TreeItemCollapsibleState.Collapsed, ElementTypes.infos, definition.variables, element.sharedoClient, element));


    // return returnValue;

  }

  export async function generateWorkflowStepsTreeNodes(element: TreeNode): Promise<TreeNode[]> {
    
    
    let returnValue: TreeNode[] = [];
    let sharedoWFStep: SharedoWFStep[] | undefined = element.data;

    return generateObjectKeysInfoTreeNodes(sharedoWFStep, element);
    
    // if(sharedoWFStep === undefined)
    // {
    //   return [];
    // }

    // for(let i = 0; i < sharedoWFStep.length; i++)
    // {
    //   let step = sharedoWFStep[i];
    //   let newNode : TreeNode = new TreeNode(step.name, vscode.TreeItemCollapsibleState.None, ElementTypes.workflowStep, step, element.sharedoClient, element);
    //   returnValue.push(newNode);
    // }

    // return returnValue;
  }

  export async function generateWorkflowStepTreeNodes(element: TreeNode): Promise<TreeNode[]> {
    let returnValue: TreeNode[] = [];
    let sharedoWFStep: SharedoWFStep | undefined = element.data;

    if(sharedoWFStep === undefined)
    {
      return [];
    }

  //   export interface SharedoWFStep {
  //     ideData:     SharedoWFIDEData;
  //     actions:     SharedoWFAction[];
  //     systemName:  string;
  //     name:        string;
  //     description: null | string;
  //     isStart:     boolean;
  //     isEnd:       boolean;
  //     isOptimal:   boolean;
  // }

    returnValue.push(new TreeNode("System Name: " + sharedoWFStep.systemName, vscode.TreeItemCollapsibleState.None, ElementTypes.info, sharedoWFStep, element.sharedoClient, element));
    returnValue.push(new TreeNode("Name: " + sharedoWFStep.name, vscode.TreeItemCollapsibleState.None, ElementTypes.info, sharedoWFStep, element.sharedoClient, element));
    returnValue.push(new TreeNode("Description: " + sharedoWFStep.description, vscode.TreeItemCollapsibleState.None, ElementTypes.info, sharedoWFStep, element.sharedoClient, element));
    returnValue.push(new TreeNode("Is Start: " + sharedoWFStep.isStart, vscode.TreeItemCollapsibleState.None, ElementTypes.info, sharedoWFStep, element.sharedoClient, element));
    returnValue.push(new TreeNode("Is End: " + sharedoWFStep.isEnd, vscode.TreeItemCollapsibleState.None, ElementTypes.info, sharedoWFStep, element.sharedoClient, element));
    returnValue.push(new TreeNode("Is Optimal: " + sharedoWFStep.isOptimal, vscode.TreeItemCollapsibleState.None, ElementTypes.info, sharedoWFStep, element.sharedoClient, element));
    
    returnValue.push(new TreeNode("Actions", vscode.TreeItemCollapsibleState.Collapsed, ElementTypes.workflowStepActions, sharedoWFStep.actions, element.sharedoClient, element));
    returnValue.push(new TreeNode("IDE Data", vscode.TreeItemCollapsibleState.Collapsed, ElementTypes.workflowStepIDEData, sharedoWFStep.ideData, element.sharedoClient, element));

    return returnValue;
  }

  export async function generateWorkflowStepActionsTreeNodes(element: TreeNode): Promise<TreeNode[]> {
    let returnValue: TreeNode[] = [];
    let sharedoWFAction: SharedoWFAction[] | undefined = element.data;


 
    if(sharedoWFAction === undefined)
    {
      return [];
    }

    for(let i = 0; i < sharedoWFAction.length; i++)
    {
      let action = sharedoWFAction[i];
      let newNode : TreeNode = new TreeNode(action.name, vscode.TreeItemCollapsibleState.None, ElementTypes.workflowStepAction, action, element.sharedoClient, element);
      returnValue.push(newNode);
    }

    return returnValue;
  }

  export async function generateWorkflowStepActionTreeNodes(element: TreeNode): Promise<TreeNode[]> {
    let returnValue: TreeNode[] = [];
    let sharedoWFAction: SharedoWFAction | undefined = element.data;

    if(sharedoWFAction === undefined)
    {
      return [];
    }

     //   export interface SharedoWFAction {
  //     config:           SharedoWFConfig;
  //     connections:      SharedoWFConnections;
  //     actionSystemName: string;
  //     name:             string;
  // }

    returnValue.push(new TreeNode("Action System Name: " + sharedoWFAction.actionSystemName, vscode.TreeItemCollapsibleState.None, ElementTypes.info, sharedoWFAction, element.sharedoClient, element));
    returnValue.push(new TreeNode("Name: " + sharedoWFAction.name, vscode.TreeItemCollapsibleState.None, ElementTypes.info, sharedoWFAction, element.sharedoClient, element));

    returnValue.push(new TreeNode("Config", vscode.TreeItemCollapsibleState.Collapsed, ElementTypes.workflowStepActionConfig, sharedoWFAction.config, element.sharedoClient, element));
    returnValue.push(new TreeNode("Connections", vscode.TreeItemCollapsibleState.Collapsed, ElementTypes.workflowStepActionConnections, sharedoWFAction.connections, element.sharedoClient, element));

    return returnValue;
  }

  export async function generateWorkflowStepActionConfigTreeNodes(element: TreeNode): Promise<TreeNode[]> {
    let returnValue: TreeNode[] = [];
    let sharedoWFConfig: SharedoWFConfig | undefined = element.data;

    if(sharedoWFConfig === undefined)
    {
      return [];
    }
  
    return generateObjectKeysInfoTreeNodes(sharedoWFConfig, element);
    
  }


