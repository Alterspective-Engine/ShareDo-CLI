import { elementsTypesParser } from "../../enums";
import { TreeNode } from "../../treeprovider";
import { IPostProcessedSharedoIDEItem, ISharedoIDERequestResult } from "./ISharedoIDERequestResult";
import * as vscode from 'vscode';

  /**
   * When ever a folder is opened get all the child folders and child items 
   * then for each child items that is a WorkItem pre-fetch the WorkItem details 
   * @param element  
   */
  export async function generateIDE(element: TreeNode): Promise<TreeNode[]> {
    let returnValue: TreeNode[] = [];
    let folder: any = element.data;


    element.children = [];

    let generateIdeTree =  (parentElement: TreeNode, item: IPostProcessedSharedoIDEItem) => {
      let newDep = new TreeNode(item.name, vscode.TreeItemCollapsibleState.Collapsed, elementsTypesParser(item.type), item, element.sharedoClient, parentElement);
      newDep.id=item.id;
      
      if (item.children) {

        for(let i = 0; i < item.children.length; i++)
        {
          let child = item.children[i];
          generateIdeTree(newDep, child);
        }
      }
      
      // parentElement.children.push(newDep);
      return newDep;
    };

    return element.sharedoClient.getIDE().then(async ideResult => {

      if(ideResult === undefined)
      {
         return[];
      }

      element.sharedoClient.ideResult = ideResult;
        
      for(let i = 0; i < ideResult.length; i++)
      {

        
        let newIdeTree =  generateIdeTree(element, ideResult[i]);
        element.children= [];
        returnValue.push(newIdeTree);
      }

      return returnValue;
    });

    //let res = Promise.resolve(TreeNode.sortByLabel(returnValue));

  }
