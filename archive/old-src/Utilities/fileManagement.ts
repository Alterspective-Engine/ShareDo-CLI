// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below


import * as _ from "lodash";




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
