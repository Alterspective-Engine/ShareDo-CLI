/**
 * Tree Provider Helper Functions for ShareDo VS Code Extension
 *
 * This file provides utility functions to dynamically generate TreeNodes from object data.
 * Used to render object details and properties in the VS Code tree view.
 */
import { capitalCase } from "text-case";
import { ElementTypes } from "../enums";
import { SharedoClient } from "../sharedoClient";
import { TreeNode } from "../treeprovider";
import * as vscode from 'vscode';
/**
 * Reads an object and creates TreeNodes for its properties.
 * This is used to dynamically render object details in the tree view.
 *
 * @param data The object or array to process.
 * @param parent The parent TreeNode.
 * @param infosOnly If true, only info nodes are generated.
 * @returns Promise resolving to an array of TreeNodes.
 */
export async function generateObjectKeysInfoTreeNodes(data: any, parent: TreeNode, infosOnly?: boolean): Promise<TreeNode[]> {
  let returnValue: TreeNode[] = [];
  let server = parent.sharedoClient;

  // If no data, return empty array
  if (data === undefined) {
    return [];
  }

  // If data is an array, process each item
  if (Array.isArray(data)) {
    return processArray(data, parent, parent.label);
  }

  // If data is a function, call it and use its result
  try {
    if (typeof (data) === "function") {
      let items = await data(parent);
      returnValue.push(...items);
      return returnValue;
    }
  } catch (e) {
    console.log(e);
  }

  // For each property in the object, create a TreeNode
  for (let key of Object.keys(data)) {
    let keyAsPropperCase = capitalCase(key);
    let prop = data[key];
    // ... do something with mealName
    if (typeof (data[key]) !== "object") {
      if (key !== "SharedoDataCachedOn") { //SharedoDataCachedOn is a "special" date time added by the "special" rest service
        let newDep = new TreeNode(keyAsPropperCase + ": " + prop,
          vscode.TreeItemCollapsibleState.None, ElementTypes.info,
          data, server,
          parent, undefined, undefined, "fa-info_sign");
        returnValue.push(newDep);
      }
    }
    else if (typeof (data[key]) === "function") {
      returnValue.push(data[key](parent));
    }
    else {
      if (prop === undefined || prop === null) { continue; }
      if (infosOnly) { continue; }
      if (Array.isArray(prop)) {

        let arrayNodes = processArray(prop, parent, key);
        returnValue.push(...arrayNodes);
        continue;
      }
      try {
        let newDep = new TreeNode(keyAsPropperCase,
          vscode.TreeItemCollapsibleState.Collapsed, ElementTypes.infos,
          prop, server,
          parent);

        // newDep.children= await this.generateObjectKeys(prop, server, parent);
        returnValue.push(newDep);


      }
      catch (e: any) {
        let newDep = new TreeNode(keyAsPropperCase + ": " + e.message,
          vscode.TreeItemCollapsibleState.None, ElementTypes.info,
          data, server,
          parent);
      }

    }
  }
  return returnValue;
}

 function processArray(data: any, parent: TreeNode, parentKey: string): TreeNode[] {
  let server = parent.sharedoClient;
  let returnValue: TreeNode[] = [];
  if (Array.isArray(data)) {
    if (!(data as any).grouped) {
      (data as any).grouped = true;
      let newDep = new TreeNode(parentKey + ": " + data.length + " items",
        vscode.TreeItemCollapsibleState.Collapsed, ElementTypes.infos,
        data, server,
        parent, undefined, undefined, `label_${parentKey}`);
      returnValue.push(newDep);
      return returnValue;
    }
    else {
      for (let i = 0; i < data.length; i++) {

        let currentProp = data[i];
        //try get the name from the object
        let name = "";
        name = tryGetNameFromObject(currentProp);
        let newDep = new TreeNode(name,
          vscode.TreeItemCollapsibleState.Collapsed, ElementTypes.infos,
          currentProp, server,
          parent,
          undefined, tryGetIdFromObject(currentProp));
        returnValue.push(newDep);
      }
      return returnValue;
    }
  }
  return [];
}

function tryGetNameFromObject(object: any) {
  let fallback = "unknown - " + Math.random().toString(36).substring(2, 15);
  let name = object.name;
  if (!name) { name = object.data?.name; }
  if (!name) { name = object.title; }
  if (!name) { name = object.data?.title; }
  if (!name) { name = object.description; }
  if (!name) { name = object.data?.description; }

  if (!name) {
    let potentialName = Object.keys(object).find(x => x.toLowerCase().includes("name"));
    if (potentialName) { name = object[potentialName]; }
  }

  if (!name) {
    let potentialName = Object.keys(object).find(x => x.toLowerCase().includes("title"));
    if (potentialName) { name = object[potentialName]; }
  }

  if (!name) { name = object.id; }
  if (!name) { name = object.data?.id; }
  if (!name) { name = object.key; }
  if (!name) { name = object.data?.key; }
  if (!name) { name = object.value; }
  if (!name) { name = object.data?.value; }


  if (!name) { name = fallback; }
  return name;
}


function tryGetIdFromObject(object: any) {
  let fallback = "idunknown - " + Math.random().toString(36).substring(2, 15);
  let id = object.id;
  if (!id) { id = object.data?.id; }
  if (!id) { id = object.key; }
  if (!id) { id = object.data?.key; }
  if (!id) { id = object.systemName; }
  if (!id) { id = object.data?.systemName; }
  if (!id) { id = fallback; }

  return id;
}