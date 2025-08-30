import { ElementTypes } from "../enums";
import { TreeNode } from "../treeprovider";
import * as vscode from 'vscode';
import { IGetWorkTypesRequestResult, IWorkType } from "../Request/WorkTypes/IGetWorkTypesRequestResult";
import { generateObjectKeysInfoTreeNodes } from "../Helpers/treeProviderHelper";
import { ICreatePermission, IGetWorkTypeCreatePermissionResult } from "../Request/WorkTypes/IGetWorkTypeCreatePermissionResult";
import { IParticipantRole, Permission as IPermission } from "../Request/ParticipantRoles/IGetParticipantRolesResult";
import { generateWorkTypeAspectsSections } from "./AspectsTreeProviderHelper";


type PassDownData = {
  workType: IWorkType
};

/**
 * When ever a folder is opened get all the child folders and child items 
 * then for each child items that is a WorkItem pre-fetch the WorkItem details 
 * @param element  
 */
export async function generateWorkTypeRootTreeNodes(element: TreeNode): Promise<TreeNode[]> {
  let returnValue: TreeNode[] = [];
  let workTypeResults: IGetWorkTypesRequestResult | undefined = element.data;

  if (workTypeResults === undefined) {
    workTypeResults = await element.sharedoClient.getWorkTypes();
  }
  if (workTypeResults === undefined) {
    return [];
  }
  return generateWorkTypesTreeNodes(element, workTypeResults);
}


export type TNodeWorkType =  IWorkType;
export async function generateWorkTypesTreeNodes(element: TreeNode, workTypes: IWorkType[]): Promise<TreeNode[]> {
  let returnValue: TreeNode[] = [];
  for (let i = 0; i < workTypes.length; i++) {
    let newWorkType = workTypes[i];
    let newNode: TreeNode = new TreeNode(newWorkType.name, vscode.TreeItemCollapsibleState.Collapsed, ElementTypes.workType, newWorkType, element.sharedoClient, element, undefined, undefined, newWorkType.icon,newWorkType);
    returnValue.push(newNode);
  }
  return returnValue;
  //let res = Promise.resolve(TreeNode.sortByLabel(returnValue));

}

export type TNodeWorkTypeCreatePermission = {
  createPermission: IGetWorkTypeCreatePermissionResult
} & PassDownData;

export function generateWorkTypeCreatePermissionTreeNodes(element: TreeNode, permissions: IGetWorkTypeCreatePermissionResult[] | undefined, workType: IWorkType): TreeNode[] {
  let returnValue: TreeNode[] = [];
  //let row: CreatePermission[] = element.data;
  if (permissions === undefined) { return returnValue; }

  permissions.forEach((x) => {
    let data : TNodeWorkTypeCreatePermission = {
      createPermission: x,
      workType:workType
    };

    returnValue.push(new TreeNode(`${x.subjectName} - ${x.subjectType}`, vscode.TreeItemCollapsibleState.None, ElementTypes.workTypeCreatePermission, data, element.sharedoClient, element, undefined, undefined, x.subjectTypeObject.icon));
  });

  return returnValue;
}

export type TNodeWorkTypeParticipantRolePermission={
  permission: IPermission
  participantRole: IParticipantRole
  workType: IWorkType
};

export type TNodeWorkTypeParticipantRole = {
  participantRole: IParticipantRole
  workType: IWorkType
};


export function generateWorkTypeParticipantRolesTreeNodes(element: TreeNode, permissions: IParticipantRole[] | undefined, workType: IWorkType): TreeNode[] {
  let returnValue: TreeNode[] = [];
  //let row: CreatePermission[] = element.data;
  if (permissions === undefined) { return returnValue; }

  permissions.forEach((x) => {

    let data : TNodeWorkTypeParticipantRole = {
      participantRole: x,
      workType: workType
    };


    let renderPermissions = (element: TreeNode) => {
      let returnValue: TreeNode[] = [];
      if(x.permissions === undefined || x.permissions.length === 0)
      {
        if(element.parent === undefined){return;};
        element.parent.children = undefined;
        return;
      }
      x.permissions.forEach((y) => {
        let dataForPermission : TNodeWorkTypeParticipantRolePermission = {
          permission: y,
          participantRole: x,
          workType: workType
        };
         dataForPermission = Object.assign(dataForPermission, data);
        returnValue.push(new TreeNode(`${y.text}`,vscode.TreeItemCollapsibleState.None, ElementTypes.workTypeParticipantRolePermission, dataForPermission, element.sharedoClient, element, undefined, undefined, y.iconCss));
      });
      return returnValue;
    };

    let cState = vscode.TreeItemCollapsibleState.Collapsed;
    let permissionsInfo = "";
    if(x.permissions === undefined || x.permissions.length === 0)
    {
      cState = vscode.TreeItemCollapsibleState.None;
    }
    else
    {
      permissionsInfo = ` - [${x.permissions.length}] Permissions`;
    }

    let active = "";
    let icon = "fa-heart_empty";
    if(x.isActive === false)
    {
      active = "Inactive - ";
      icon = "fa-heart-broken";
    }


   

    returnValue.push(new TreeNode(`${active}${x.name} - ${x.systemName}${permissionsInfo}`, cState, ElementTypes.workTypeParticipantRole, renderPermissions, element.sharedoClient, element, undefined, undefined,icon,data));
  });

  return returnValue;
}





export async function generateWorkTypeTreeNodes(element: TreeNode): Promise<TreeNode[]> {
  let returnValue: TreeNode[] = [];
  let workType: IWorkType = element.data;
  let newNode = await generateObjectKeysInfoTreeNodes(element.data, element, true);
  returnValue.push(...newNode);

  

  if (workType.derivedTypes && workType.derivedTypes.length > 0) {
    // let renderDerivedTypes = (element: TreeNode) => generateWorkTypesTreeNodes(element, row.derivedTypes);
    returnValue.push(new TreeNode("Derived Types", vscode.TreeItemCollapsibleState.Collapsed, ElementTypes.workTypes, workType.derivedTypes, element.sharedoClient, element, undefined, undefined, "fa-sitemap"));
  }

  let createPermissions = await element.sharedoClient.getWorkTypeCreatePermissions(workType.systemName);
  if (createPermissions) {
    //create a function that can be called later to get the create permissions
    let renderPermissions = (element: TreeNode) => generateWorkTypeCreatePermissionTreeNodes(element, createPermissions,workType);
    returnValue.push(new TreeNode("Create Permissions", vscode.TreeItemCollapsibleState.Collapsed, ElementTypes.workTypeCreatePermissions, renderPermissions, element.sharedoClient, element));
  }

  let permissions = await element.sharedoClient.getWorkTypeGetParticipantRoles(workType.systemName);
  if (permissions) {
    //create a function that can be called later to get the create permissions
    let renderParticipantPermissions = (element: TreeNode) => generateWorkTypeParticipantRolesTreeNodes(element, permissions,workType);
    returnValue.push(new TreeNode("Participant Roles", vscode.TreeItemCollapsibleState.Collapsed, ElementTypes.workTypeParticipantRoles, renderParticipantPermissions, element.sharedoClient, element, undefined, undefined, "fa-lock"));
  }

  //generateWorkTypeAspectsSections
  returnValue.push(new TreeNode("Aspects", vscode.TreeItemCollapsibleState.Collapsed, ElementTypes.workTypeAspects, generateWorkTypeAspectsSections, element.sharedoClient,element,undefined,undefined,"fa-folder", workType));


  return returnValue;

  // element.children = [];
  // returnValue.push(new TreeNode("Name: " + row.name, vscode.TreeItemCollapsibleState.None, ElementTypes.info, row, element.sharedoClient, element));
  // returnValue.push(new TreeNode("Description: " + row.description, vscode.TreeItemCollapsibleState.None, ElementTypes.info, row, element.sharedoClient, element));
  // returnValue.push(new TreeNode("Has Portals: " + row.hasPortals, vscode.TreeItemCollapsibleState.None, ElementTypes.info, row, element.sharedoClient, element));
  // returnValue.push(new TreeNode("Is Abstract: " + row.isAbstract, vscode.TreeItemCollapsibleState.None, ElementTypes.info, row, element.sharedoClient, element));
  // returnValue.push(new TreeNode("Is CoreType: " + row.isCoreType, vscode.TreeItemCollapsibleState.None, ElementTypes.info, row, element.sharedoClient, element));
  // returnValue.push(new TreeNode("System Name: " + row.systemName, vscode.TreeItemCollapsibleState.None, ElementTypes.info, row, element.sharedoClient, element));

  // returnValue.push(new TreeNode("Derived Types", vscode.TreeItemCollapsibleState.Collapsed, ElementTypes.workflowDefinition, row.derivedTypes, element.sharedoClient, element));

  // return returnValue;
}


