
import { TreeNode } from "../treeprovider";
import * as vscode from 'vscode';
import { ElementTypes } from "../enums";
import { generateObjectKeysInfoTreeNodes } from "../Helpers/treeProviderHelper";
import { IFormBuilderRequestResult } from "../Request/FormBuilder/IFormBuilderRequestResult";

  /**
   * When ever a folder is opened get all the child folders and child items 
   * then for each child items that is a WorkItem pre-fetch the WorkItem details 
   * @param element  
   */
  export async function generateFormBuildersTreeNodes(element: TreeNode): Promise<TreeNode[]> {
    let returnValue: TreeNode[] = [];
    let folder: any = element.data;


    //element.children = [];


    return element.sharedoClient.getFormBuilders().then(async formbuilderResult => {
      
      if(formbuilderResult === undefined)
      {
         return[];
      }

      element.sharedoClient.formBuilders = formbuilderResult;
        
      for(let i = 0; i <  element.sharedoClient.formBuilders.length; i++)
      {
        let newFormBuilder =  element.sharedoClient.formBuilders[i];
        
        let newNodeChildren = await generateObjectKeysInfoTreeNodes(newFormBuilder, element,true);
        let newNode : TreeNode = new TreeNode(newFormBuilder.title, vscode.TreeItemCollapsibleState.Collapsed, ElementTypes.form, getFormBuilderFields, element.sharedoClient, element, newNodeChildren, undefined, "fa-folder", newFormBuilder);
        returnValue.push(newNode);
      }

    // return  generateObjectKeysInfoTreeNodes(formbuilderResult, element,true);
    

      return returnValue;
    });

    //let res = Promise.resolve(TreeNode.sortByLabel(returnValue));

  }

  async function getFormBuilderFields(element: TreeNode): Promise<TreeNode[]> {
    let returnValue: TreeNode[] = [];
    let form: IFormBuilderRequestResult = element.additionalData as IFormBuilderRequestResult;

    // element.children = [];
    // returnValue.push(new TreeNode("Name: " + form..name, vscode.TreeItemCollapsibleState.None, ElementTypes.info, form, element.sharedoClient, element));
    // returnValue.push(new TreeNode("Description: " + form.data.description, vscode.TreeItemCollapsibleState.None, ElementTypes.info, form, element.sharedoClient, element));
    // returnValue.push(new TreeNode("InstanceCount: " + form.data.instanceCount, vscode.TreeItemCollapsibleState.None, ElementTypes.info, form, element.sharedoClient, element));

   
     let formDetails = await element.sharedoClient.getFormBuilder(form.id);

     if(!formDetails)
        {
        return [];
        }

    Object.assign(form, formDetails);
     
     return  generateObjectKeysInfoTreeNodes(formDetails, element,false);
    


  }



  

//   export async function generateWorkflowTreeNodes(element: TreeNode): Promise<TreeNode[]> {
//     let returnValue: TreeNode[] = [];
//     let form: IFormBuilderRequestResult = element.data;


//     // element.children = [];
//     // returnValue.push(new TreeNode("Name: " + form..name, vscode.TreeItemCollapsibleState.None, ElementTypes.info, form, element.sharedoClient, element));
//     // returnValue.push(new TreeNode("Description: " + form.data.description, vscode.TreeItemCollapsibleState.None, ElementTypes.info, form, element.sharedoClient, element));
//     // returnValue.push(new TreeNode("InstanceCount: " + form.data.instanceCount, vscode.TreeItemCollapsibleState.None, ElementTypes.info, form, element.sharedoClient, element));

//     // let workflowDefinition =  element.sharedoClient.getWorkflow({systemName:form.data.systemName});

//     // returnValue.push(new TreeNode("Definition", vscode.TreeItemCollapsibleState.Collapsed, ElementTypes.workflowDefinition, workflowDefinition, element.sharedoClient, element));

//     return returnValue;
//   }

//   export async function generateWorkflowDefinitionTreeNodes(element: TreeNode): Promise<TreeNode[]> {
//     let returnValue: TreeNode[] = [];
//     let definitionPromise: Promise<IFormBuilderRequestResult | undefined> = element.data;


//     let definition = await definitionPromise;

//     if(definition === undefined)
//     {
//       return [];
//     }

//   //   export interface SharedoWorkflowRequestResult {
//   //     systemName:                          string;
//   //     name:                                string;
//   //     description:                         string;
//   //     overrideNotifications:               boolean;
//   //     exceptionNotifications:              boolean;
//   //     exceptionNotificationEmailAddresses: null;
//   //     variables:                           SharedoWFVariable[];
//   //     steps:                               SharedoWFStep[];
//   // }
    
//     // returnValue.push(new TreeNode("System Name: " + definition.systemName, vscode.TreeItemCollapsibleState.None, ElementTypes.info, definition, element.sharedoClient, element));
//     // returnValue.push(new TreeNode("Name: " + definition.name, vscode.TreeItemCollapsibleState.None, ElementTypes.info, definition, element.sharedoClient, element));
//     // returnValue.push(new TreeNode("Description: " + definition.description, vscode.TreeItemCollapsibleState.None, ElementTypes.info, definition, element.sharedoClient, element));
   
//     return generateObjectKeysInfoTreeNodes(definition, element);
   
//     // returnValue.push(new TreeNode("Exception Notification To: " + definition.exceptionNotificationEmailAddresses, vscode.TreeItemCollapsibleState.None, ElementTypes.info, definition, element.sharedoClient, element));
//     // returnValue.push(new TreeNode("Override Notifications: " + definition.overrideNotifications, vscode.TreeItemCollapsibleState.None, ElementTypes.info, definition, element.sharedoClient, element));
//     // returnValue.push(new TreeNode("Exception Notifications: " + definition.exceptionNotifications, vscode.TreeItemCollapsibleState.None, ElementTypes.info, definition, element.sharedoClient, element));
    
//     // returnValue.push(new TreeNode("Steps", vscode.TreeItemCollapsibleState.Collapsed, ElementTypes.infos, definition.steps, element.sharedoClient, element));
//     // returnValue.push(new TreeNode("Variables", vscode.TreeItemCollapsibleState.Collapsed, ElementTypes.infos, definition.variables, element.sharedoClient, element));


//     // return returnValue;

//   }

//   export async function generateFormBuilderstepsTreeNodes(element: TreeNode): Promise<TreeNode[]> {
    
    
//     let returnValue: TreeNode[] = [];
//     let sharedoWFStep: SharedoWFStep[] | undefined = element.data;

//     return generateObjectKeysInfoTreeNodes(sharedoWFStep, element);
    
//     // if(sharedoWFStep === undefined)
//     // {
//     //   return [];
//     // }

//     // for(let i = 0; i < sharedoWFStep.length; i++)
//     // {
//     //   let step = sharedoWFStep[i];
//     //   let newNode : TreeNode = new TreeNode(step.name, vscode.TreeItemCollapsibleState.None, ElementTypes.FormBuilderstep, step, element.sharedoClient, element);
//     //   returnValue.push(newNode);
//     // }

//     // return returnValue;
//   }

//   export async function generateFormBuilderstepTreeNodes(element: TreeNode): Promise<TreeNode[]> {
//     let returnValue: TreeNode[] = [];
//     let sharedoWFStep: SharedoWFStep | undefined = element.data;

//     if(sharedoWFStep === undefined)
//     {
//       return [];
//     }

//   //   export interface SharedoWFStep {
//   //     ideData:     SharedoWFIDEData;
//   //     actions:     SharedoWFAction[];
//   //     systemName:  string;
//   //     name:        string;
//   //     description: null | string;
//   //     isStart:     boolean;
//   //     isEnd:       boolean;
//   //     isOptimal:   boolean;
//   // }

//     returnValue.push(new TreeNode("System Name: " + sharedoWFStep.systemName, vscode.TreeItemCollapsibleState.None, ElementTypes.info, sharedoWFStep, element.sharedoClient, element));
//     returnValue.push(new TreeNode("Name: " + sharedoWFStep.name, vscode.TreeItemCollapsibleState.None, ElementTypes.info, sharedoWFStep, element.sharedoClient, element));
//     returnValue.push(new TreeNode("Description: " + sharedoWFStep.description, vscode.TreeItemCollapsibleState.None, ElementTypes.info, sharedoWFStep, element.sharedoClient, element));
//     returnValue.push(new TreeNode("Is Start: " + sharedoWFStep.isStart, vscode.TreeItemCollapsibleState.None, ElementTypes.info, sharedoWFStep, element.sharedoClient, element));
//     returnValue.push(new TreeNode("Is End: " + sharedoWFStep.isEnd, vscode.TreeItemCollapsibleState.None, ElementTypes.info, sharedoWFStep, element.sharedoClient, element));
//     returnValue.push(new TreeNode("Is Optimal: " + sharedoWFStep.isOptimal, vscode.TreeItemCollapsibleState.None, ElementTypes.info, sharedoWFStep, element.sharedoClient, element));
    
//     returnValue.push(new TreeNode("Actions", vscode.TreeItemCollapsibleState.Collapsed, ElementTypes.FormBuilderstepActions, sharedoWFStep.actions, element.sharedoClient, element));
//     returnValue.push(new TreeNode("IDE Data", vscode.TreeItemCollapsibleState.Collapsed, ElementTypes.FormBuilderstepIDEData, sharedoWFStep.ideData, element.sharedoClient, element));

//     return returnValue;
//   }

//   export async function generateFormBuilderstepActionsTreeNodes(element: TreeNode): Promise<TreeNode[]> {
//     let returnValue: TreeNode[] = [];
//     let sharedoWFAction: SharedoWFAction[] | undefined = element.data;


 
//     if(sharedoWFAction === undefined)
//     {
//       return [];
//     }

//     for(let i = 0; i < sharedoWFAction.length; i++)
//     {
//       let action = sharedoWFAction[i];
//       let newNode : TreeNode = new TreeNode(action.name, vscode.TreeItemCollapsibleState.None, ElementTypes.FormBuilderstepAction, action, element.sharedoClient, element);
//       returnValue.push(newNode);
//     }

//     return returnValue;
//   }

//   export async function generateFormBuilderstepActionTreeNodes(element: TreeNode): Promise<TreeNode[]> {
//     let returnValue: TreeNode[] = [];
//     let sharedoWFAction: SharedoWFAction | undefined = element.data;

//     if(sharedoWFAction === undefined)
//     {
//       return [];
//     }

//      //   export interface SharedoWFAction {
//   //     config:           SharedoWFConfig;
//   //     connections:      SharedoWFConnections;
//   //     actionSystemName: string;
//   //     name:             string;
//   // }

//     returnValue.push(new TreeNode("Action System Name: " + sharedoWFAction.actionSystemName, vscode.TreeItemCollapsibleState.None, ElementTypes.info, sharedoWFAction, element.sharedoClient, element));
//     returnValue.push(new TreeNode("Name: " + sharedoWFAction.name, vscode.TreeItemCollapsibleState.None, ElementTypes.info, sharedoWFAction, element.sharedoClient, element));

//     returnValue.push(new TreeNode("Config", vscode.TreeItemCollapsibleState.Collapsed, ElementTypes.FormBuilderstepActionConfig, sharedoWFAction.config, element.sharedoClient, element));
//     returnValue.push(new TreeNode("Connections", vscode.TreeItemCollapsibleState.Collapsed, ElementTypes.FormBuilderstepActionConnections, sharedoWFAction.connections, element.sharedoClient, element));

//     return returnValue;
//   }

//   export async function generateFormBuilderstepActionConfigTreeNodes(element: TreeNode): Promise<TreeNode[]> {
//     let returnValue: TreeNode[] = [];
//     let sharedoWFConfig: SharedoWFConfig | undefined = element.data;

//     if(sharedoWFConfig === undefined)
//     {
//       return [];
//     }
  
//     return generateObjectKeysInfoTreeNodes(sharedoWFConfig, element);
    
//   }


