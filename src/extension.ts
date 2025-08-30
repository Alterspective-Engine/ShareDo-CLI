/**
 * @sharedo/vscode - VS Code Extension
 */

import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  console.log('ShareDo extension is now active!');
  
  const disposable = vscode.commands.registerCommand('sharedo.connect', () => {
    vscode.window.showInformationMessage('ShareDo: Connecting to server...');
  });
  
  context.subscriptions.push(disposable);
}

export function deactivate() {}
