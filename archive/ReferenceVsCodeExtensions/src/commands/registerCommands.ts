/**
 * Command Registration Module for ShareDo VS Code Extension
 *
 * This module centralizes all VS Code command registrations for the ShareDo extension,
 * providing a clean separation of concerns and preventing command conflicts.
 *
 * @responsibilities
 * - Register all extension commands with VS Code API
 * - Handle command execution and delegation to appropriate handlers
 * - Manage command-specific error handling and user feedback
 * - Coordinate with utility modules for complex operations
 *
 * @architecture
 * - Single entry point for all command registrations
 * - Delegates actual implementation to specialized utility modules
 * - Provides consistent error handling patterns
 * - Maintains command naming conventions and organization
 *
 * @author ShareDo Team
 * @version 0.8.1
 */

import * as vscode from 'vscode';
import { compareWorkItems } from '../Utilities/compareWorkItems';
import { TreeNode } from '../treeprovider';
import { Settings } from '../settings';
import { addAsFavorite, removeAsFavorite } from '../Utilities/favoritesUtils';
import { showObjectData } from '../Utilities/extensionUtils';
import { validatePublishServers } from '../Utilities/publishUtils';
import { publishFileFolderToServers } from '../Request/File/ExtensionHelpers/filePublishing';
import { getCompareResultsHtml } from '../Utilities/compareResultsHtml';

/**
 * Registers all extension commands with VS Code
 * 
 * This function serves as the main entry point for command registration,
 * organizing commands into logical groups for better maintainability.
 * 
 * @param context - VS Code extension context for command registration
 * @param extensionPrefix - Prefix for all command identifiers
 * @param thisAppSettings - Application settings instance
 */
export function registerExtensionCommands(context: vscode.ExtensionContext, extensionPrefix: string, thisAppSettings: Settings) {
  // === Server Comparison Commands ===
  
  // Add server to comparison list for cross-server analysis
  vscode.commands.registerCommand(`${extensionPrefix}.addToCompare`, (node: TreeNode) => {
    thisAppSettings.sharedoEnvironments.addToCompareServers(node.sharedoClient);
    vscode.window.showInformationMessage(`Server ${node.sharedoClient.url} added for comparison.`);
  });

  // Remove server from comparison list
  vscode.commands.registerCommand(`${extensionPrefix}.removeFromCompare`, (node: TreeNode) => {
    thisAppSettings.sharedoEnvironments.removeFromCompareServers(node.sharedoClient);
    vscode.window.showInformationMessage(`Server ${node.sharedoClient.url} removed from comparison.`);
  });

  // === Work Item Comparison Commands ===
  
  // Compare a work item across multiple ShareDo servers
  vscode.commands.registerCommand(`${extensionPrefix}.compareWorkItemToOthers`, async (node: TreeNode) => {
    try {
      // Validate comparison servers are available
      const compareServers = thisAppSettings.sharedoEnvironments.compareServers.filter(s => s.url !== node.sharedoClient.url);
      if (compareServers.length === 0) {
        vscode.window.showErrorMessage('No servers marked for comparison. Right-click a server and select "Add to Compare".');
        return;
      }
      
      // Prepare comparison targets
      const targetClients = compareServers.map(client => ({ client }));
      vscode.window.showInformationMessage('Comparing workitems...');
      
      // Execute comparison
      const reportName = `${node.label.replace(/\s+/g, '_')}_${Date.now()}`;
      const results = await compareWorkItems(node.sharedoClient, node.label, targetClients, reportName);

      // Display results in webview panel
      const panel = vscode.window.createWebviewPanel(
        'compareResults',
        `Compare Results: ${node.label}`,
        vscode.ViewColumn.One,
        { enableScripts: true }
      );
      
      // Generate and set HTML content for results
      panel.webview.html = getCompareResultsHtml(results, node.label, node.sharedoClient.url, node.sharedoClient, compareServers);
    } catch (error) {
      vscode.window.showErrorMessage(`Comparison failed: ${error}`);
    }
  });

  // === Favorites Management Commands ===
  
  // Add item to user favorites for quick access
  vscode.commands.registerCommand(`${extensionPrefix}.addAsFavorite`, async (node: TreeNode) => {
    try {
      await addAsFavorite(node, thisAppSettings);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to add favorite: ${error}`);
    }
  });

  // Remove item from user favorites
  vscode.commands.registerCommand(`${extensionPrefix}.removeAsFavorite`, async (node: TreeNode) => {
    try {
      await removeAsFavorite(node, thisAppSettings);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to remove favorite: ${error}`);
    }
  });

  // === Debugging and Inspection Commands ===
  
  // Display detailed object data for debugging purposes
  vscode.commands.registerCommand(`${extensionPrefix}.showObject`, async (node: TreeNode) => {
    try {
      showObjectData(node);
      thisAppSettings.save();
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to show object data: ${error}`);
    }
  });

  // === File Publishing Commands ===
  
  // Publish file or folder to configured ShareDo servers
  vscode.commands.registerCommand(`${extensionPrefix}.publish`, async (file: vscode.Uri | string) => {
    try {
      // Normalize file parameter to URI
      if (typeof file === "string") {
        file = vscode.Uri.from({ scheme: "file", path: file });
      }
      
      // Validate publish servers are configured
      if (!validatePublishServers(thisAppSettings.sharedoEnvironments)) {
        return;
      }
      
      // Execute publishing operation
      const results = await publishFileFolderToServers(file, thisAppSettings);
      
      // Report results to user
      if (results) {
        results.forEach(result => {
          result.ideItem.then((ideItem: any) => {
            vscode.window.showInformationMessage(`${ideItem.name} ${ideItem.type} Published to ${result.server.url}`);
            // Optionally refresh tree view if needed
          }).catch((error: any) => {
            vscode.window.showErrorMessage(`Publishing failed for ${result.server.url}: ${error}`);
          });
        });
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Publishing operation failed: ${error}`);
    }
  });
}
