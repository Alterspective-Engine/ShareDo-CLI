/**
 * Tree Provider for ShareDo VS Code Extension
 *
 * This file defines the `TreeNode` and `TreeNodeProvider` classes, which are responsible for building and managing the hierarchical tree view in the ShareDo extension.
 *
 * Responsibilities:
 * - Defines the structure and behavior of tree nodes (`TreeNode`), including unique ID generation, icon resolution, and parent/child relationships.
 * - Implements the `TreeNodeProvider` class, which supplies data to the VS Code tree view, handles refreshes, and generates children for each node type.
 * - Integrates with ShareDo APIs and helpers to populate the tree with servers, workflows, work types, forms, folders, and other ShareDo entities.
 * - Handles context values, tooltips, and sorting for tree nodes.
 *
 * The tree view allows users to explore and interact with ShareDo resources directly within VS Code.
 */
import { resolveTreeNodeIcon } from './Utilities/iconManager';
import * as vscode from 'vscode';
import { SharedoClient } from './sharedoClient';
import { elementsTypesParser, ElementTypes, SortDirection } from './enums';
import { Guid } from 'guid-typescript';
import { Inform } from './Utilities/inform';
import { SharedoEnvironments } from './environments';
import { findDisplayName } from './Utilities/common';
import { ICategory } from './Interfaces/Category';
import _ = require('lodash');

import { generateIDE } from './Request/IDE/ideTreeProviderHelper';
import { generateWorkflowDefinitionTreeNodes, generateWorkflowsTreeNodes, generateWorkflowTreeNodes } from './TreeHelpers/WorkflowsTreeProviderHelper';
import nodeTest from 'node:test';
import { generateObjectKeysInfoTreeNodes } from './Helpers/treeProviderHelper';
import { generateWorkTypeRootTreeNodes, generateWorkTypeTreeNodes } from './TreeHelpers/WorkTypesTreeProviderHelper';
import { generateExecutionMonitoringTreeNodes } from './TreeHelpers/ExecutionEngineTreeProviderHelper';

import * as fs from 'fs';
import { generateFormBuildersTreeNodes } from './TreeHelpers/FormBuilderTreeProviderHelper';
import { getIconPaths, getCompareIconPaths } from './Utilities/iconResolver';
import * as path from 'path';

class PromiseItem<T>
{
  constructor(
    public elementType: ElementTypes,
    public promise: Promise<T>) { }
}

type CountIdsResult = { count: number, foundNodes: TreeNode[] | undefined };

/**
 * Represents a node in the ShareDo tree view.
 *
 * Each `TreeNode` corresponds to a ShareDo entity (server, workflow, folder, etc.) and manages its own children, icon, and unique ID.
 * Handles icon resolution, context values, and parent/child relationships.
 */
export class TreeNode extends vscode.TreeItem {

  public typeFlags: ElementTypes[] = new Array<ElementTypes>();
  public entityId: string;
  public duplicateNumber: number = 0;

  /**
   * Constructs a new TreeNode.
   *
   * @param label The display name of the tree item.
   * @param collapsibleState The collapsible state (None/Collapsed/Expanded).
   * @param type The primary type of this element (ElementTypes).
   * @param data The underlying data object for this node.
   * @param sharedoClient The ShareDo client/server this item is associated with.
   * @param parent The parent TreeNode (must be set except for the root node).
   * @param children Optional array of child TreeNodes.
   * @param id Optional explicit ID for the node (otherwise generated).
   * @param icon Optional icon name or path for the node.
   * @param additionalData Optional additional data for the node.
   */
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public type: ElementTypes,
    public data: any | undefined,
    public sharedoClient: SharedoClient,
    public parent: TreeNode | undefined,
    public children?: TreeNode[],
    public id?: string,
    public icon?: string,
    public additionalData?: any

  ) {
    super(label, collapsibleState);
    if (!children) { children = new Array<TreeNode>(); }

    if (!this.typeFlags) { this.typeFlags = new Array<ElementTypes>(); }
    let parentText = parent?.id ?? "root";

    if (icon) {
      this.icon = icon;
    }

    this.additionalData = additionalData;

    // If this is a server node and is in compare mode, use the compare icon
    if (this.type === ElementTypes.server && this.sharedoClient && this.sharedoClient.parent && this.sharedoClient.parent.isCompareServer && this.sharedoClient.parent.isCompareServer(this.sharedoClient)) {
      const compareIcons = getCompareIconPaths();
      if (typeof compareIcons === 'string') {
        this.iconPath = {
          light: compareIcons,
          dark: compareIcons
        };
      } else {
        this.iconPath = {
          light: compareIcons.light,
          dark: compareIcons.dark
        };
      }
    } else {
      this.setupIconPath();
    }

    let foundID = "";
    if (this.id) { foundID = this.id; }

    foundID = this.tryExtractId(foundID, data);
    foundID = this.tryExtractId(foundID, additionalData);


    this.entityId = "";
    try {
      switch (this.type) {
        case ElementTypes.workTypes:
          this.entityId += "categorySystem";
          break;
        case ElementTypes.folder:
          this.entityId += "category_";
          break;
        case ElementTypes.ide:
          this.entityId += "ide_";
          break;
        case ElementTypes.connectors:
          this.entityId += "connectors_";
          break;
        case ElementTypes.folderItem:
          this.entityId += "folderItem_";
          break;
        case ElementTypes.workflow:
          this.entityId += "workflow_";
          break;
        case ElementTypes.workType:
          this.entityId += "workType_";
          break;
        case ElementTypes.form:
          this.entityId += "form_";
          break;
        case ElementTypes.server:
        case ElementTypes.deployToServer:
          this.entityId += this.sharedoClient.url;
          break;
        default:
          this.entityId += Guid.create().toString();
          break;
      }
      
      // Add the actual data ID if available for more stable identification
      if (foundID && foundID !== "") {
        this.entityId += "_" + foundID;
      } else if (data && (data.id || data.Id || data.GUID || data.systemName)) {
        const dataId = data.id || data.Id || data.GUID || data.systemName;
        this.entityId += "_" + dataId;
      } else {
        this.entityId += "_" + Guid.create().toString();
      }
    }
    catch (error) {
      this.entityId += Guid.create().toString();
      Inform.writeError(`Error adding treeNode for type[${this.type}] : ${error}`);
    }

    this.entityId += "_______" + sharedoClient.url;


    let idToUse = foundID + this.label + " - " + this.type + " - " + parentText;
    if (idToUse.includes("Lease Term Types")) {
      let f = "thisisissue";
    }

    let c = this.countIds("id", idToUse, this, "up");
    if (c.count > 0) {
      console.error("problem with id:", idToUse);
      idToUse = idToUse + " - " + Guid.create().toString();
    }

    // let existing = this.findExisting("id", idToUse, this, "up");
    // if (existing) {
    //   return existing;
    // }


    //set the id for the TreeNode - this HAS TO BE unqiue even if the object is in mote than one place in the tree
    this.id = idToUse;

    if (this.parent) {
      if (!this.parent.children) { this.parent.children = new Array<TreeNode>(); };
      this.parent.children?.push(this);
    }



    this.tooltip = this.type;
    this.typeFlags.push(this.type);
    this.contextValue = this.typeFlags.join(","); //TODO: this need to be reset when the typeFlags is changed
  }
  /**
   * Attempts to extract a unique ID from the given object using common ID property names.
   *
   * @param foundID The current found ID string.
   * @param object The object to extract an ID from.
   * @returns The updated found ID string.
   */
  private tryExtractId(foundID: string, object: any): string {
    if (object === undefined) {
      return foundID;
    }
    let properties = ["id", "Id", "ID", "Guid", "GUID", "systemName", ""];
    for (let index = 0; index < properties.length; index++) {
      const element = properties[index];
      if (object[element]) {
        try {
          foundID = foundID + "_" + object[element];
          break;
        } catch (error) {
          console.error("tryExtractId", error);
        }
      }
    }
    return foundID;
  }

  /**
   * Sets up the icon path for this node using the icon manager, and triggers a tree refresh if the icon is downloaded.
   */
  setupIconPath() {
    // Pass a callback to refresh the tree when an icon is downloaded
    this.iconPath = resolveTreeNodeIcon(
      this.type,
      this.icon,
      this.data?.dynamicType,
      () => {
        // Always use the global provider refresh (safe and always available)
        if ((globalThis as any).treeDataProvider && typeof (globalThis as any).treeDataProvider.refresh === 'function') {
          (globalThis as any).treeDataProvider.refresh();
        }
      }
    );
  }


  /**
   * Recursively counts the number of nodes with a given property value in the tree (upwards or downwards).
   *
   * @param propertyToSearch The property name to search for.
   * @param valueToSearch The value to match.
   * @param node The node to start searching from.
   * @param direction 'up' to search parents, 'down' to search children.
   * @param foundNodes Optional array to collect found nodes.
   * @returns An object with the count and the found nodes.
   */
  countIds(propertyToSearch: string, valueToSearch: string, node: TreeNode, direction: string, foundNodes?: TreeNode[]): CountIdsResult {
    let res: number = 0;
    if (!foundNodes) { foundNodes = new Array<TreeNode>(); }

    if (node.parent) {
      if (direction === "up") {

        res += this.countIds(propertyToSearch, valueToSearch, node.parent, "up", foundNodes).count;
      }
    };


    if (node.children !== undefined) {
      for (let i = 0; i < node.children.length; i++) {
        let cnode = node.children[i];
        res += this.countIds(propertyToSearch, valueToSearch, cnode, "down", foundNodes).count;
      }
    }

    // node.children?.forEach(cnode => {
    //   res += this.countIds(propertyToSearch,valueToSearch, cnode, "down",foundNodes);
    // });

    if ((node as any)[propertyToSearch] === valueToSearch) {
      foundNodes?.push(node);
      return { count: 1, foundNodes: foundNodes };
    };

    return { count: res, foundNodes: foundNodes };
  }

  findExisting(propertyToSearch: string, valueToSearch: string, node: TreeNode, direction: string): TreeNode | undefined {
    let res: TreeNode | undefined;

    if ((node as any)[propertyToSearch] === valueToSearch) { return node; };

    if (node.parent) {
      if (direction === "up") {
        res = this.findExisting(propertyToSearch, valueToSearch, node.parent, "up");
        if (res) { return res; };
      }
    }


    if (node.children) {
      for (let index = 0; index < node.children.length; index++) {
        const element = node.children[index];
        res = this.findExisting(propertyToSearch, valueToSearch, element, "down");
        if (res) { return res; };
      }
    }


    if (res) { return res; };

    return undefined;

  }
  /**
  * Sorts a TreeNode by its label in alphabetical order
  * Call this method passing in a array of TreeNodes
  * @param treeNodeArray an array of TreeNodes to be sorted
  */
  public static sortByLabel(treeNodeArray: TreeNode[]) {
    return treeNodeArray.sort((a, b) => {
      let as = a.label;
      let bs = b.label;

      if (as < bs) { return -1; };
      if (as > bs) { return 1; };
      return 0;
    });
  }




  /**
   * Get the context value for the menu context in the package.json
   * typeFlags is a list of types this object targets in an attempt to allow context menu targeting of
  */
  //public get contextValue(): string {
  //  return this.typeFlags.join(",");
  // }

  //get tooltip(): string {
  //  return `${this.type}`;
  // }






}


export class TreeNodeProvider implements vscode.TreeDataProvider<TreeNode> {

  private thisEnv: SharedoEnvironments;
  constructor(initThisEnvironment: SharedoEnvironments) {
    this.thisEnv = initThisEnvironment;
  }

  private _onDidChangeTreeData: vscode.EventEmitter<TreeNode | undefined> = new vscode.EventEmitter<TreeNode | undefined>();
  readonly onDidChangeTreeData: vscode.Event<TreeNode | undefined> = this._onDidChangeTreeData.event;

  /**
   * Causes the tree view to refresh
   * as long as each TreeNode has its own ID the tree will maintain its expended and collapsed states
   */
  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: TreeNode): vscode.TreeItem {
    return element;
  }

  getChildren(element?: TreeNode): Thenable<TreeNode[]> {
    let returnValue: TreeNode[] = [];

    // Wrap entire method in try-catch to handle any unexpected errors
    try {
      if (element) {
        // Validate element has required properties
        if (!element.type) {
          console.error('TreeNode element missing type property', element);
          return Promise.resolve([]);
        }

        switch (element.type) {
          case ElementTypes.favorites:
            return this.generateFavorites(element).catch(error => {
              console.error(`Error generating favorites: ${error}`);
              return this.createErrorNode(error, element);
            });
          case ElementTypes.server:
          case ElementTypes.deployToServer:
            return this.generateServerConfiguration(element).catch(error => {
              console.error(`Error generating server configuration: ${error}`);
              return this.createErrorNode(error, element);
            });
          case ElementTypes.errors:
            return Promise.resolve(this.generateErrorLogs(element)).then(
              (result) => result,
              (error: any) => {
                console.error(`Error generating error logs: ${error}`);
                return this.createErrorNode(error, element);
              }
            );
          case ElementTypes.workTypes:
            return Promise.resolve(generateWorkTypeRootTreeNodes(element)).catch((error: any) => {
              console.error(`Error generating work type root nodes: ${error}`);
              return this.createErrorNode(error, element);
            });
          case ElementTypes.workType:
            return Promise.resolve(generateWorkTypeTreeNodes(element)).catch(error => {
              console.error(`Error generating work type nodes: ${error}`);
              return this.createErrorNode(error, element);
            });

          case ElementTypes.forms:
            return Promise.resolve(generateFormBuildersTreeNodes(element)).catch(error => {
              console.error(`Error generating form builder nodes: ${error}`);
              return this.createErrorNode(error, element);
            });
           
          case ElementTypes.workflows:
            return Promise.resolve(generateWorkflowsTreeNodes(element)).catch(error => {
              console.error(`Error generating workflows nodes: ${error}`);
              return this.createErrorNode(error, element);
            });
          case ElementTypes.workflow:
            return Promise.resolve(generateWorkflowTreeNodes(element)).catch(error => {
              console.error(`Error generating workflow nodes: ${error}`);
              return this.createErrorNode(error, element);
            });
          case ElementTypes.workflowDefinition:
            return Promise.resolve(generateWorkflowDefinitionTreeNodes(element)).catch(error => {
              console.error(`Error generating workflow definition nodes: ${error}`);
              return this.createErrorNode(error, element);
            });

          case ElementTypes.info:
          case ElementTypes.infos:
            return Promise.resolve(generateObjectKeysInfoTreeNodes(element.data, element)).catch(error => {
              console.error(`Error generating info nodes: ${error}`);
              return this.createErrorNode(error, element);
            });
          case ElementTypes.ide:
            return generateIDE(element).catch(error => {
              console.error(`Error generating IDE nodes: ${error}`);
              return this.createErrorNode(error, element);
            });
          case ElementTypes.executionOverview:
          case ElementTypes.executingPlans:
          case ElementTypes.advisorIssues:
            return Promise.resolve(generateExecutionMonitoringTreeNodes(element)).catch(error => {
              console.error(`Error generating execution monitoring nodes: ${error}`);
              return this.createErrorNode(error, element);
            });
          case ElementTypes.object:
          case ElementTypes.folder:
            if (element.children) {
              return Promise.resolve(element.children);
            }
            break;
          default:
            // Handle any non-matched types
            try {
              return Promise.resolve(generateObjectKeysInfoTreeNodes(element.data, element));
            }
            catch (error) {
              console.error(`Error generating default nodes for type ${element.type}: ${error}`);
              return this.createErrorNode(error, element);
            }
        }
      }
      else {
        // Generate top level elements with error handling
        return this.generateTopLevelSharedoElements().catch(error => {
          console.error(`Error generating top level elements: ${error}`);
          // Return error node at root level
          const errorNode = new TreeNode(
            `Error loading servers: ${error instanceof Error ? error.message : 'Unknown error'}`,
            vscode.TreeItemCollapsibleState.None,
            ElementTypes.error,
            error,
            {} as SharedoClient,
            undefined
          );
          return [errorNode];
        });
      }
    } catch (unexpectedError) {
      console.error('Unexpected error in getChildren:', unexpectedError);
      // Return error node for unexpected errors
      const errorNode = new TreeNode(
        `Unexpected error: ${unexpectedError instanceof Error ? unexpectedError.message : 'Unknown error'}`,
        vscode.TreeItemCollapsibleState.None,
        ElementTypes.error,
        unexpectedError,
        element?.sharedoClient || {} as SharedoClient,
        element
      );
      return Promise.resolve([errorNode]);
    }
    
    return Promise.resolve([]);
  }

  /**
   * Creates an error node to display in the tree when an error occurs
   * @param error The error that occurred
   * @param parent The parent node where the error occurred
   * @returns Promise resolving to array containing the error node
   */
  private createErrorNode(error: any, parent?: TreeNode): Thenable<TreeNode[]> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorNode = new TreeNode(
      `Error: ${errorMessage}`,
      vscode.TreeItemCollapsibleState.None,
      ElementTypes.error,
      error,
      parent?.sharedoClient || {} as SharedoClient,
      parent
    );
    return Promise.resolve([errorNode]);
  }


  generateErrorLogs(element: TreeNode): Thenable<TreeNode[]> {
    // let returnValue = new Array<TreeNode>();
    // let errorsPromise: Promise<any[]>;
    // if (element.parent && element.parent?.type === ElementTypes.workflow) {
    //   let workflow: any = element.parent.data;
    //   errorsPromise = element.sharedoClient.getErrorLogs(workflow);
    // }
    // else {
    //   errorsPromise = element.sharedoClient.getErrorLogs();
    // }

    // return errorsPromise.then(errors => {

    //   sortArrayByDateProperty<any>(errors, "ErrorDate", SortDirection.descending).forEach(error => {
    //     returnValue.push(new TreeNode(error.ProcInstID + " - " + error.Folio + " - " + error.Description,
    //       vscode.TreeItemCollapsibleState.Collapsed,
    //       ElementTypes.error,
    //       error,
    //       element.sharedoClient, element));
    //   });
    //   return returnValue;
    // });

    return Promise.resolve([]);

  }





  //** Auto generated items from a PromiseItem collection - where the collection has a DisplayName */
  generatePromiseItems<T extends any[]>(element: TreeNode): Thenable<TreeNode[]> {
    let data: PromiseItem<T> = element.data;
    let returnValue: TreeNode[] = [];
    return data.promise.then(items => {
      items.forEach(item => {
        let displayName = findDisplayName(item);
        let thisItem: any = item;
        if (displayName) {
          let newItem = new TreeNode(thisItem[displayName], vscode.TreeItemCollapsibleState.Collapsed, data.elementType, thisItem, element.sharedoClient, element);
          returnValue.push(newItem);
        }
      });
      return Promise.resolve(TreeNode.sortByLabel(returnValue));
    }).catch(error => {
      let newItem = new TreeNode(error, vscode.TreeItemCollapsibleState.Collapsed, ElementTypes.object, null, element.sharedoClient, element);
      returnValue.push(newItem);
      return Promise.resolve(TreeNode.sortByLabel(returnValue));
    });
  }

  /**
   * When ever a folder is opened get all the child folders and child items 
   * then for each child items that is a  pre-fetch the  details 
   * @param element  
   */
  async generateFolderItems(element: TreeNode): Promise<TreeNode[]> {
    let returnValue: TreeNode[] = [];
    let folder: ICategory = element.data;


    let subFoldersPromise = element.sharedoClient.getCategorySubFolders(folder).then(subFolders => {
      subFolders.forEach(async subFolder => {

        let countOfSubFolders = (await element.sharedoClient.getCategorySubFolders(subFolder)).length;
        let countOfSubDataItems = (await element.sharedoClient.getCategoryItems(subFolder)).length;

        //let countOfSubFolders = subFolder.childFolders?.length || 0
        //let countOfSubDataItems = subFolder.childItems?.length || 0

        let totalCountOfAllChildItems = countOfSubDataItems + countOfSubFolders;
        let newDep = new TreeNode(`${subFolder.displayName} [${totalCountOfAllChildItems}] `,
          vscode.TreeItemCollapsibleState.Collapsed, ElementTypes.folder, subFolder,
          element.sharedoClient, element);
        returnValue.push(newDep);
      });
    });

    let subItemsPromise = element.sharedoClient.getCategoryItems(folder).then(subItems => {
      subItems.forEach(async subItem => {


        let e: string = "Category";
        let newDep = new TreeNode(subItem.displayName + " - " + subItem.dataType,
          vscode.TreeItemCollapsibleState.Collapsed, elementsTypesParser(subItem.dataType), subItem,
          element.sharedoClient, element);
        returnValue.push(newDep);

        //auto fetch SO details
        // if (subItem.DataType == ElementTypes.xx && subItem.Data)
        //   {await element.sharedoClient.getxxDetails(subItem.Data).then(so => {
        //     newDep.data = so;
        //   });};

      });
    });

    return Promise.all([subFoldersPromise, subItemsPromise]).then(() => {
      return Promise.resolve(TreeNode.sortByLabel(returnValue));
    });


  }

  /**
   * TODO: check if generateFolderItems() can replace this method
   * @param element 
   */
  private async generateTopLevelCategoryElements(element: TreeNode): Promise<TreeNode[]> {
    let returnValue: TreeNode[] = [];

    return element.sharedoClient.getCatagories().then(cats => {
      cats.filter(item => item.id === "").forEach(cat => {
        let newDep = new TreeNode(cat.displayName || "undefined",
          vscode.TreeItemCollapsibleState.Collapsed,
          ElementTypes.folder, cat,
          element.sharedoClient,
          element);
        returnValue.push(newDep);
      });
      return Promise.resolve(TreeNode.sortByLabel(returnValue));
    });
  }

  /**
   * Populate the Tree with the Servers that have been registered
   */
  private generateTopLevelSharedoElements() {
    let returnValue: TreeNode[] = [];
    
    try {
      // Validate environment exists
      if (!this.thisEnv) {
        console.warn('No ShareDo environments configured');
        return Promise.resolve([]);
      }
      
      this.thisEnv.forEach(server => {
        try {
          // Validate server object
          if (!server || !server.url) {
            console.warn('Invalid server configuration found, skipping');
            return;
          }
          
          let elementType = ElementTypes.server;
          if (server.parent?.isDeployToServer(server)) {
            elementType = ElementTypes.deployToServer;
          }
          
          let newDep = new TreeNode(server.url,
            vscode.TreeItemCollapsibleState.Collapsed,
            elementType, undefined, server, undefined);
          returnValue.push(newDep);
          
          // Generate IDE with error handling
          generateIDE(newDep).catch(error => {
            console.error(`Failed to generate IDE for server ${server.url}:`, error);
            // Continue with other servers even if one fails
          });
        } catch (serverError) {
          console.error(`Error processing server:`, serverError);
          // Add error node for this server
          const errorNode = new TreeNode(
            `Failed to load server: ${serverError instanceof Error ? serverError.message : 'Unknown error'}`,
            vscode.TreeItemCollapsibleState.None,
            ElementTypes.error,
            serverError,
            {} as SharedoClient,
            undefined
          );
          returnValue.push(errorNode);
        }
      });
    } catch (error) {
      console.error('Error generating top level elements:', error);
      // Return error node if complete failure
      const errorNode = new TreeNode(
        `Failed to load servers: ${error instanceof Error ? error.message : 'Unknown error'}`,
        vscode.TreeItemCollapsibleState.None,
        ElementTypes.error,
        error,
        {} as SharedoClient,
        undefined
      );
      returnValue.push(errorNode);
    }
    
    return Promise.resolve(returnValue);
  }


  private generateFavorites(element: TreeNode) {
    let returnValue: TreeNode[] = [];

    try {
      // Validate element and sharedoClient
      if (!element || !element.sharedoClient) {
        console.warn('Invalid element or sharedoClient for favorites');
        return Promise.resolve([]);
      }

      // Check if favorites exist
      if (!element.sharedoClient.favorites || !Array.isArray(element.sharedoClient.favorites)) {
        console.info('No favorites found');
        return Promise.resolve([]);
      }

      element.sharedoClient.favorites.forEach(e => {
        try {
          // Validate favorite item
          if (!e || !e.label) {
            console.warn('Invalid favorite item found, skipping');
            return;
          }

          // Check if item already exists in returnValue
          let found = returnValue.find(item => item.label === e.label && item.entityId === e.entityId);
          if (!found) {
            // Ensure the favorite item has proper parent reference and sharedoClient
            if (e.sharedoClient !== element.sharedoClient) {
              e.sharedoClient = element.sharedoClient;
            }
            if (!e.parent) {
              e.parent = element;
            }
            
            // Ensure TreeNode prototype methods are available
            if (!(e instanceof TreeNode)) {
              // If it's not a proper TreeNode instance, create a new one
              const favoriteNode = new TreeNode(
                e.label,
                e.collapsibleState || vscode.TreeItemCollapsibleState.None,
                e.type || ElementTypes.object,
                e.data,
                element.sharedoClient,
                element,
                undefined,
                e.id,
                e.icon,
                e.additionalData
              );
              favoriteNode.entityId = e.entityId || '';
              favoriteNode.typeFlags = e.typeFlags || [];
              favoriteNode.duplicateNumber = e.duplicateNumber || 0;
              returnValue.push(favoriteNode);
            } else {
              returnValue.push(e);
            }
          }
        } catch (favoriteError) {
          console.error('Error processing favorite item:', favoriteError);
          // Continue processing other favorites
        }
      });

      return Promise.resolve(TreeNode.sortByLabel(returnValue));
    } catch (error) {
      console.error('Error generating favorites:', error);
      // Return error node in favorites
      const errorNode = new TreeNode(
        `Error loading favorites: ${error instanceof Error ? error.message : 'Unknown error'}`,
        vscode.TreeItemCollapsibleState.None,
        ElementTypes.error,
        error,
        element.sharedoClient,
        element
      );
      return Promise.resolve([errorNode]);
    }
  }


  private async generateServerConfiguration(element: TreeNode) {
    let returnValue: TreeNode[] = [];
    
    try {
      // Validate element and server
      if (!element || !element.sharedoClient) {
        throw new Error('Invalid element or ShareDo client');
      }
      
      let server: SharedoClient = element.sharedoClient;
      
      // Validate server has required methods
      if (!server.getBearer || typeof server.getBearer !== 'function') {
        throw new Error('ShareDo client missing getBearer method');
      }

      return server.getBearer().then(() => {
        try {
          // Validate getParentItems method exists
          if (!server.getParentItems || typeof server.getParentItems !== 'function') {
            throw new Error('ShareDo client missing getParentItems method');
          }
          
          const parentItems = server.getParentItems();
          
          // Validate parentItems is an array
          if (!Array.isArray(parentItems)) {
            console.warn('getParentItems did not return an array');
            return Promise.resolve([]);
          }
          
          parentItems.forEach(item => {
            try {
              // Validate item has required properties
              if (!item || !item.name || !item.type) {
                console.warn('Invalid parent item found, skipping:', item);
                return;
              }
              
              let newDep = new TreeNode(
                item.name, 
                vscode.TreeItemCollapsibleState.Collapsed, 
                item.type, 
                item.generator, 
                server, 
                element
              );
              returnValue.push(newDep);
            } catch (itemError) {
              console.error('Error processing parent item:', itemError);
              // Continue processing other items
            }
          });
          
          return Promise.resolve(TreeNode.sortByLabel(returnValue));
        } catch (processingError) {
          console.error('Error processing server items:', processingError);
          // Return error node for processing failure
          const errorMessage = processingError instanceof Error ? processingError.message : 'Failed to process server items';
          let errorNode = new TreeNode(
            `Error: ${errorMessage}`, 
            vscode.TreeItemCollapsibleState.None, 
            ElementTypes.error, 
            processingError, 
            server, 
            element
          );
          return Promise.resolve([errorNode]);
        }
      }).catch(authError => {
        // Handle authentication errors specifically
        console.error('Authentication error:', authError);
        
        let errorMessage = authError.message || "Unknown authentication error";
        
        // Show more user-friendly authentication error
        let errorNode = new TreeNode(
          `Authentication failed: ${errorMessage}`, 
          vscode.TreeItemCollapsibleState.None, 
          ElementTypes.error, 
          authError, 
          server, 
          element
        );
        
        // Add a help node with instructions
        let helpNode = new TreeNode(
          "Click to retry connection or check server settings", 
          vscode.TreeItemCollapsibleState.None, 
          ElementTypes.info, 
          { message: "Use 'ShareDo: Setup Wizard' command to reconfigure" }, 
          server, 
          element
        );
        
        returnValue.push(errorNode);
        returnValue.push(helpNode);
        return Promise.resolve(returnValue);
      });
    } catch (error) {
      console.error('Error in generateServerConfiguration:', error);
      // Return error node for unexpected errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      let errorNode = new TreeNode(
        `Configuration error: ${errorMessage}`, 
        vscode.TreeItemCollapsibleState.None, 
        ElementTypes.error, 
        error, 
        element?.sharedoClient || {} as SharedoClient, 
        element
      );
      return Promise.resolve([errorNode]);
    }
  }
}


