/**
 * Extension Utilities Module for ShareDo VS Code Extension
 *
 * This module provides utility functions specific to VS Code extension operations,
 * including debugging helpers, template generation, and extension-specific workflows.
 *
 * @responsibilities
 * - Object data inspection and debugging utilities
 * - Settings template generation
 * - Extension-specific helper functions
 * - Development and troubleshooting tools
 *
 * @architecture
 * - Pure utility functions with clear purposes
 * - Consistent error handling and user feedback
 * - Integration with VS Code APIs and ShareDo services
 * - Separation of debugging and operational utilities
 *
 * @author ShareDo Team
 * @version 0.8.2
 */

import * as vscode from 'vscode';
import { TreeNode } from '../treeprovider';
import { showOutputInFile } from './fileManagement';
import { generateReportOutput } from '../TreeHelpers/ReportHelper';

/**
 * Debugging and Development Utilities
 */

/**
 * Displays detailed object data for a tree node in a formatted JSON file
 * Useful for debugging tree structure and node properties
 * 
 * @param node - Tree node containing the data to display
 */
export function showObjectData(node: TreeNode): void {
  try {
    const debugData = {
      node: {
        label: node.label,
        type: node.type,
        contextValue: node.contextValue,
        command: node.command,
        typeFlags: node.typeFlags,
        icon: node.icon,
        iconPath: node.iconPath,
      },
      data: node.data,
      additionalData: node.additionalData,
    };

    showOutputInFile(node.label + "_object.json", debugData);
  } catch (error) {
    console.error('Error displaying object data:', error);
  }
}

/**
 * Configuration and Template Utilities
 */

/**
 * Generates a settings JSON template for ShareDo connection configuration
 * Creates a sample configuration file to help users set up their connections
 * If there's an active editor, it will populate the current file instead of creating a new one
 */
export function generateSettingsJson(): void {
  try {
    const settingsTemplate = {
      url: "https://xxx.sharedo.co.uk/",
      clientId: "VSCodeAppClientCreds",
      clientSecret: "",
      impersonateUser: "",
      impersonateProvider: "idsrv/aad",
    };

    // Check if there's an active text editor
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
      // Populate the current document
      populateActiveEditorWithSettings(activeEditor, settingsTemplate);
    } else {
      // Create a new untitled document instead of using the problematic file path logic
      createNewDocumentWithSettings(settingsTemplate);
    }
  } catch (error) {
    console.error('Error generating settings JSON:', error);
    vscode.window.showErrorMessage('Failed to generate connection settings');
  }
}

/**
 * Creates a new untitled document with connection settings
 * @param settings - The settings object to populate
 */
async function createNewDocumentWithSettings(settings: any): Promise<void> {
  try {
    const settingsJson = JSON.stringify(settings, null, 2);
    
    // Create a new untitled document
    const document = await vscode.workspace.openTextDocument({
      content: settingsJson,
      language: 'json'
    });
    
    // Show the document in the editor
    await vscode.window.showTextDocument(document);
    
    vscode.window.showInformationMessage('Connection settings template created. Fill in the required values and use "Sharedo: Connect to Server" to connect.');
  } catch (error) {
    console.error('Error creating new document:', error);
    vscode.window.showErrorMessage('Failed to create new document with settings');
  }
}

/**
 * Populates the active editor with connection settings JSON
 * @param editor - The active text editor
 * @param settings - The settings object to populate
 */
function populateActiveEditorWithSettings(editor: vscode.TextEditor, settings: any): void {
  try {
    const settingsJson = JSON.stringify(settings, null, 2);
    
    editor.edit(editBuilder => {
      // Replace all content with the settings JSON
      const fullRange = new vscode.Range(
        editor.document.positionAt(0),
        editor.document.positionAt(editor.document.getText().length)
      );
      editBuilder.replace(fullRange, settingsJson);
    }).then(success => {
      if (success) {
        vscode.window.showInformationMessage('Connection settings populated in the current document. Fill in the required values and use "Sharedo: Connect to Server" to connect.');
      } else {
        vscode.window.showErrorMessage('Failed to populate settings in the current document');
      }
    });
  } catch (error) {
    console.error('Error populating active editor:', error);
    vscode.window.showErrorMessage('Failed to populate settings in the current document');
  }
}
