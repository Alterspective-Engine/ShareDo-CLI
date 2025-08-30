
/**
 * Common Utilities Module for ShareDo VS Code Extension
 *
 * This module provides shared utility functions used throughout the extension,
 * including string manipulation, path handling, and workspace management.
 *
 * @responsibilities
 * - Provide common string and path manipulation functions
 * - Handle workspace path resolution and validation
 * - Manage IDE and workflow folder structures
 * - Provide cross-platform file path utilities
 *
 * @architecture
 * - Pure utility functions with no side effects
 * - Cross-platform compatibility for path operations
 * - Consistent error handling patterns
 * - Clear separation of string, path, and workspace utilities
 *
 * @author ShareDo Team
 * @version 0.8.1
 */

import { TreeNode } from "../treeprovider";
import * as vscode from 'vscode';
import { ArrayHelper } from "./arrayHelper";
import { DOWNLOAD_IDE_ROOT_FOLDER, DOWNLOAD_WORKFLOW_ROOT_FOLDER } from "../settings";

/**
 * String Manipulation Utilities
 */

/**
 * Cleans a name by removing non-alphanumeric characters
 * Used for generating safe file names and identifiers
 * 
 * @param name - The string to clean
 * @returns Cleaned string with only alphanumeric characters
 */
export function cleanName(name: string): string {
	if (!name) {
		return name;
	}
	return name.replace(/[^a-z0-9]/gi, '');
}

/**
 * Path Manipulation Utilities
 */

/**
 * Normalizes file paths for cross-platform compatibility
 * Converts backslashes to forward slashes and handles path separators
 * 
 * @param filePath - The file path to normalize
 * @returns Normalized path with consistent separators
 */
export function normalizePath(filePath: string): string {
	if (!filePath) {
		return filePath;
	}
	
	// Convert all backslashes to forward slashes for consistency
	let normalized = filePath.replace(/\\/g, '/');
	
	// Remove duplicate slashes
	normalized = normalized.replace(/\/+/g, '/');
	
	// Remove trailing slash (except for root)
	if (normalized.length > 1 && normalized.endsWith('/')) {
		normalized = normalized.slice(0, -1);
	}
	
	return normalized;
}

/**
 * Extracts just the filename from a full file path (cross-platform)
 * 
 * @param filePath - The full file path
 * @returns Just the filename portion
 */
export function getFileNameFromPath(filePath: string): string {
	if (!filePath) {
		return filePath;
	}
	
	// Handle both Windows and Unix path separators
	const parts = filePath.split(/[\\\/]/);
	return parts[parts.length - 1] || filePath;
}

/**
 * Workspace Management Utilities
 */

/**
 * Gets the root path for IDE files within the current workspace
 * 
 * @returns The full path to the IDE root folder
 * @throws Error if no workspace folder is found
 */
export function getIDERootPath(): string {
	if(!vscode.workspace.workspaceFolders) {
		throw new Error("No workspace folder found, trying to get IDE root path");
	}

	// Use path.join for proper cross-platform path handling
	const path = require('path');
	return path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, DOWNLOAD_IDE_ROOT_FOLDER);
}

export function getWorkflowRootPath(): string {
	if(!vscode.workspace.workspaceFolders) {
		throw new Error("No workspace folder found, trying to get IDE root path");
	}

	// Use path.join for proper cross-platform path handling
	const path = require('path');
	return path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, DOWNLOAD_WORKFLOW_ROOT_FOLDER);
}

export function titleCase(str: string) {


	str = str.replace(/_/g, " ");
	str = str.replace(/\./g, " ");

	var splitStr = str.split(' ');
	for (var i = 0; i < splitStr.length; i++) {
		// You do not need to check if i is larger than splitStr length, as your for does that for you
		// Assign it back to the array
		splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);

	}
	// Directly return the joined string
	return splitStr.join(' ');
}

//** finds the display name in an object */
export function findDisplayName(item: any): string | undefined {
	let keys = Object.keys(item);
	let retValue: string | undefined = "";
	retValue = keys.find(k => k.toLowerCase().includes("display") && k.toLowerCase().includes("name"));
	if (retValue) {return retValue;}

	retValue = keys.find(k => k.toLowerCase() === "name");
	if (retValue) {return retValue;}

	retValue = keys.find(k => k.toLowerCase() === "id");
	if (retValue) {return retValue;}

}

export async function searchParentFor(node: TreeNode, type: string): Promise<any | undefined> {
	// let rightNode: TreeNode;
	// let retValue: Promise<any | undefined>;
	// let smoGuid = "";
	// if (node.type === type) {
	// 	rightNode = node;
	// 	if (rightNode.data.Guid) {smoGuid = node.data.Guid;} //get the SMO Guid
	// 	else {smoGuid = node.data.Data;}					//If its a category item or a smoartobject data
	// 	return node.sharedoClient.getWorkItemDetails(smoGuid);
	// }
	// else {
	// 	if (node.parent) {
	// 		return searchParentFor(node.parent, type);
	// 	}
	// 	else
	// 		{return undefined;}
	// }
	console.log("searchParentFor not implemented");
}

export class StringWriter {

	private finalString = "";
	private editor?: vscode.TextEditor;

	constructor(editor?: vscode.TextEditor) {
		if (editor) {this.editor = editor;}
	}

	toString(): string {
		return this.finalString;
	}

	append(text: string) {
		this.finalString += text;
	}

	appendLine(text: string) {
		this.finalString += "\n" + text;
	}


}
export function getTerminal(): vscode.Terminal {


	//if (vscode.window.activeTerminal) return vscode.window.activeTerminal

	let terminal = vscode.window.terminals.find(t => t.name === "Shredo Terminal");

	if (terminal) {return terminal;}
	terminal = vscode.window.createTerminal("Sharedo Terminal");
	return terminal;

}




export function getObjectBaseType(obj: any) {
	if (obj)
		{if (obj.constructor)
			{if (obj.constructor.name)
				{return obj.constructor.name;}}}

	return "unknown";

}

export class NamedArrayItem<T>
{
	arraySetName: string;
	items: Array<T>;

	constructor(arraySetName: string, data?: Array<T>) {
		this.arraySetName = arraySetName;
		this.items = new Array<T>();
		if (data)
			{this.items = data;}
	}
}

export class NamedArray<T>
{
	items: NamedArrayItem<T>[];

	constructor(data?: NamedArray<T>) {
		this.items = new Array<NamedArrayItem<T>>();
		if (data) {
			this.items = data.items;
		}
	}

	/**
	 * Add or updates an item to an named array and return the items in the names array
	 * @param arraySetName 
	 * @param item 
	 * @param uniqueProperty a proeprty of T that makes it unqiue in the array set
	 */
	public upsertItem(arraySetName: string, item: T, uniqueProperty: string): Array<T> {
		let arraySet = this.items.find(i => i.arraySetName === arraySetName);
		if (!arraySet) {
			arraySet = new NamedArrayItem(arraySetName);
			this.items.push(arraySet);
		}
		let itemAsAny: any = item;
		ArrayHelper.upsert<T>(arraySet.items, item, x => x[uniqueProperty] === itemAsAny[uniqueProperty]);
		return arraySet.items;
	}

	/**
	 * Add or updates an item to an named array and return the items in the names array
	 * @param arraySetName 
	 * @param item 
	 * @param uniqueProperty a proeprty of T that makes it unqiue in the array set
	 */
	public upsertArraySet(arraySetName: string, uniqueProperty: string): Array<T> {
		let arraySet = this.items.find(i => i.arraySetName === arraySetName);
		if (!arraySet) {
			arraySet = new NamedArrayItem(arraySetName);
			this.items.push(arraySet);
		}
		return arraySet.items;
	}

}
