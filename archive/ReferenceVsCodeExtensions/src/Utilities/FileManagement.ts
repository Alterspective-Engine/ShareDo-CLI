// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { replacer } from './JSONHelpers';
import * as _ from "lodash";

export async function doesFileExistsInWorkspace(fileFullPath: string): Promise<boolean> {
	let pathObject = path.parse(fileFullPath);
	let found: boolean = false;
	const workspace = vscode.workspace.workspaceFolders![0];
	let pat = new vscode.RelativePattern(workspace, "**/" + pathObject.base);
	let files = await vscode.workspace.findFiles(pat, null, 10);

	if (files.length === 0) { return Promise.resolve(found); }
	files.forEach(file => {
		let foundFilePath = path.parse(file.fsPath);
		if (foundFilePath.dir === pathObject.dir) {
			found = true;
			return;
		}
	});
	return Promise.resolve(found);
}
/**
 * Creates a vscode.URI for use with creating files 
 * @param fileName The name of the new file
 * @param folder The folder the file will exist in, bank for root
 * @param prefix file schema type, unknown is the default
 */
export function createURI(fileName: string, folder?: string, prefix: string = "unknown"): vscode.Uri {
	let pathToReport = "";
	if (vscode.workspace.workspaceFolders) {
		pathToReport = vscode.workspace.workspaceFolders[0].uri.path;
	}

	//${path}/${folder}/${fileName}`
	if (prefix.length > 0) { pathToReport = `${prefix}:${path}`; }

	if (folder) {
		pathToReport = `${path}/${folder}`;
		try {
			if (fs.existsSync(pathToReport) === false) { fs.mkdirSync(pathToReport, { recursive: true }); };
		}
		catch (error) {
			console.log(error);
		}
		pathToReport = `${path}/${fileName}`;
	}
	else { pathToReport = `${path}/${fileName}`; };
	var setting: vscode.Uri = vscode.Uri.parse(pathToReport);
	return setting;
}
/**
 * 
 * @param fullFilePath file path and name to where new json file will be opened and extended
 * @param data data that can be JSON serialized to display in the document
 * @param showIfFileAlreadyExists TRUE = if the file already exists then show it, FALSE = overwrite and show new file
 */
export async function showOutputInFile(fullFilePath: string, data: any, showIfFileAlreadyExists: boolean = true) {

	//get project base path
	let pathToReport = "";
	if (vscode.workspace.workspaceFolders) {
		pathToReport = vscode.workspace.workspaceFolders[0].uri.fsPath;
	}

	pathToReport = path.join(pathToReport, "Reports", fullFilePath);

	var setting: vscode.Uri = vscode.Uri.parse("untitled:" + pathToReport.replace(/\\/g, '/'));
	//let doesFileExists: boolean = fs.existsSync(fullFilePath)
	let doesFileExists: boolean = await doesFileExistsInWorkspace(fullFilePath);

	if (showIfFileAlreadyExists === true && doesFileExists === true) {
		let f: any = vscode.Uri.parse(fullFilePath);
		vscode.window.showTextDocument(f, 1, false);
		return;
	}

	//if it does exists, try rename it to old
	try {
		if (doesFileExists === true) {
			let renamedFileName = "old_" + fullFilePath;
			if (fs.existsSync(renamedFileName) === true) {
				fs.unlinkSync(renamedFileName);
			};
			fs.renameSync(fullFilePath, "old_" + fullFilePath);
		}
	}
	catch (error) {
		console.log(error);
	}

	let dataToWrite: string;
	try //TODO: rather check if data is string or an object
	{
		dataToWrite = JSON.stringify(data, replacer, ' ');
	}
	catch
	{
		dataToWrite = data;
	}

	vscode.workspace.openTextDocument(setting).then((a: vscode.TextDocument) => {
		vscode.window.showTextDocument(a, 1, false).then(e => {
			e.edit(edit => {
				edit.insert(new vscode.Position(0, 0), dataToWrite);
			});
		});
	}, (error: any) => {
		console.error(error);
		debugger;
	});

}
export async function findFile(folder: string, fileName: string): Promise<vscode.Uri | null | undefined> {
	let files = await vscode.workspace.findFiles(`${folder}\\*`);
	let setting = createURI(fileName, folder);
	return files.find(file => file.path === setting.path);
}

export function messageError(error: Error & { code?: string }): Error {
	if (error.code === 'ENOENT') {
		return vscode.FileSystemError.FileNotFound();
	}

	if (error.code === 'EISDIR') {
		return vscode.FileSystemError.FileIsADirectory();
	}

	if (error.code === 'EEXIST') {
		return vscode.FileSystemError.FileExists();
	}

	if (error.code === 'EPERM' || error.code === 'EACCESS') {
		return vscode.FileSystemError.NoPermissions();
	}
	return error;
}

export function handleResult<T>(resolve: (result: T) => void, reject: (error: Error) => void, error: Error | null | undefined, result: T): void {
	if (error) {
		reject(messageError(error));
	} else {
		resolve(result);
	}
}
export function normalizeNFC(items: string): string;
export function normalizeNFC(items: string[]): string[];
export function normalizeNFC(items: string | string[]): string | string[] {
	if (process.platform !== 'darwin') {
		return items;
	}
	if (Array.isArray(items)) {
		return items.map(item => item.normalize('NFC'));
	}
	return items.normalize('NFC');
}
