/**
 * The interfaces for the K2 Server
 * Using an interface as we save the implementation of this class as RAW JSON 
 * and then pass that raw json to the implementor of the interface to hydrate 
 */
/**
 * Server Interface Definitions for ShareDo VS Code Extension
 *
 * This file defines interfaces and classes related to the K2 Server and its parent items.
 * The ServerParentItem class is used to represent top-level items (such as worktypes) on a server.
 * These are often serialized as raw JSON and hydrated into class instances at runtime.
 */

import { ElementTypes } from "../enums";
import { SharedoClient } from "../sharedoClient";
import { TreeNode } from "../treeprovider";


/**
 * Represents a top-level parent item on a server (e.g., worktypes, folders).
 * These are used to organize the tree structure in the extension.
 */
export class ServerParentItem {
  name: string;
  sharedoClient: SharedoClient;
  type: ElementTypes;
  generator?: (element: TreeNode) => Promise<TreeNode[]>;

  /**
   * Constructs a new ServerParentItem.
   * @param name The display name of the parent item.
   * @param type The type of the item (ElementTypes).
   * @param sharedoClient The client/server this item belongs to.
   * @param generator Optional function to generate child tree nodes.
   */
  constructor(name: string, type: ElementTypes, sharedoClient: SharedoClient, generator?: (element: TreeNode) => Promise<TreeNode[]>) {
	this.name = name;
	this.sharedoClient = sharedoClient;
	this.type = type;
	this.generator = generator; // Used to dynamically generate children for this parent item
  }
}


