import * as vscode from 'vscode';
import { TreeNodeProvider } from '../treeprovider';
import { Settings } from '../settings';
import { SharedoEnvironments } from '../environments';

export function refreshTree(settings: Settings, context: vscode.ExtensionContext) {
    if (settings.sharedoEnvironments) {
        createTreeView(settings.sharedoEnvironments);
    }
    settings.save();
}

export function createTreeView(thisEnv: SharedoEnvironments) {
    const treeDataProvider = new TreeNodeProvider(thisEnv);
    (globalThis as any).treeDataProvider = treeDataProvider;
    vscode.window.createTreeView('SharedoServers', {
        treeDataProvider: treeDataProvider
    });
    return treeDataProvider;
}
