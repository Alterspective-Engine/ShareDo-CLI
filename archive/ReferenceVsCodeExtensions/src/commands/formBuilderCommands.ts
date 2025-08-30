/**
 * Form Builder Commands
 * 
 * Command handlers for form builder operations
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Settings } from '../settings';
import { TreeNode } from '../treeprovider';
import { FormBuilderService, FormDefinition } from '../FormBuilder/FormBuilderService';
import { FormPreviewPanel } from '../FormBuilder/FormPreviewPanel';
import { ElementTypes } from '../enums';

export class FormBuilderCommands {
    private formBuilderService?: FormBuilderService;
    private currentForm: FormDefinition | undefined;

    constructor(private settings: Settings) {
        // Initialize with the first available ShareDo client
        const activeClient = this.settings.sharedoEnvironments.internalArray?.[0];
        if (activeClient) {
            this.formBuilderService = new FormBuilderService(activeClient);
        }
    }

    /**
     * Register all form builder commands
     */
    static registerCommands(context: vscode.ExtensionContext, settings: Settings) {
        const commands = new FormBuilderCommands(settings);
        const extensionPrefix = 'sharedo';

        // Create new form
        context.subscriptions.push(
            vscode.commands.registerCommand(`${extensionPrefix}.form.create`, async () => {
                await commands.createForm();
            })
        );

        // Add field to form
        context.subscriptions.push(
            vscode.commands.registerCommand(`${extensionPrefix}.form.addField`, async (node?: TreeNode) => {
                await commands.addField(node);
            })
        );

        // Preview form
        context.subscriptions.push(
            vscode.commands.registerCommand(`${extensionPrefix}.form.preview`, async (node?: TreeNode) => {
                await commands.previewForm(node);
            })
        );

        // Validate form
        context.subscriptions.push(
            vscode.commands.registerCommand(`${extensionPrefix}.form.validate`, async (node?: TreeNode) => {
                await commands.validateForm(node);
            })
        );

        // Clone form
        context.subscriptions.push(
            vscode.commands.registerCommand(`${extensionPrefix}.form.clone`, async (node?: TreeNode) => {
                await commands.cloneForm(node);
            })
        );

        // Delete field
        context.subscriptions.push(
            vscode.commands.registerCommand(`${extensionPrefix}.form.deleteField`, async (node?: TreeNode) => {
                await commands.deleteField(node);
            })
        );

        // Move field up
        context.subscriptions.push(
            vscode.commands.registerCommand(`${extensionPrefix}.form.moveFieldUp`, async (node?: TreeNode) => {
                await commands.moveField(node, 'up');
            })
        );

        // Move field down
        context.subscriptions.push(
            vscode.commands.registerCommand(`${extensionPrefix}.form.moveFieldDown`, async (node?: TreeNode) => {
                await commands.moveField(node, 'down');
            })
        );

        // Export form
        context.subscriptions.push(
            vscode.commands.registerCommand(`${extensionPrefix}.form.export`, async (node?: TreeNode) => {
                await commands.exportForm(node);
            })
        );

        // Import form
        context.subscriptions.push(
            vscode.commands.registerCommand(`${extensionPrefix}.form.import`, async () => {
                await commands.importForm();
            })
        );

        // View form JSON
        context.subscriptions.push(
            vscode.commands.registerCommand(`${extensionPrefix}.form.viewJSON`, async (node?: TreeNode) => {
                await commands.viewFormJSON(node);
            })
        );

        // Refresh forms
        context.subscriptions.push(
            vscode.commands.registerCommand(`${extensionPrefix}.form.refresh`, async () => {
                await commands.refreshForms();
            })
        );

        // Toggle field required
        context.subscriptions.push(
            vscode.commands.registerCommand(`${extensionPrefix}.form.toggleRequired`, async (node?: TreeNode) => {
                await commands.toggleFieldRequired(node);
            })
        );

        // Edit field properties
        context.subscriptions.push(
            vscode.commands.registerCommand(`${extensionPrefix}.form.editField`, async (node?: TreeNode) => {
                await commands.editFieldProperties(node);
            })
        );
    }

    /**
     * Create a new form
     */
    private async createForm() {
        try {
            if (!this.formBuilderService) {
                vscode.window.showErrorMessage('No ShareDo connection available');
                return;
            }

            const form = await this.formBuilderService.createFormWithWizard();
            
            if (form) {
                this.currentForm = form;
                
                // Optionally show preview
                const showPreview = await vscode.window.showInformationMessage(
                    'Form created successfully!',
                    'Preview Form',
                    'Close'
                );

                if (showPreview === 'Preview Form') {
                    FormPreviewPanel.createOrShow(form);
                }

                // Refresh tree view
                await vscode.commands.executeCommand('sharedo.refreshTreeView');
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to create form: ${error}`);
        }
    }

    /**
     * Add field to form
     */
    private async addField(node?: TreeNode) {
        try {
            if (!this.formBuilderService) {
                vscode.window.showErrorMessage('No ShareDo connection available');
                return;
            }

            let form: FormDefinition | undefined;

            // Get form from node or current form
            if (node && node.type === ElementTypes.form) {
                form = await this.getFormFromNode(node);
            } else if (this.currentForm) {
                form = this.currentForm;
            } else {
                // Let user select a form
                form = await this.selectForm();
            }

            if (!form) {
                return;
            }

            const field = await this.formBuilderService.addFieldToForm(form);

            if (field) {
                this.currentForm = form;
                
                // Refresh preview if open
                FormPreviewPanel.createOrShow(form);
                
                // Refresh tree view
                await vscode.commands.executeCommand('sharedo.refreshTreeView');
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to add field: ${error}`);
        }
    }

    /**
     * Preview form
     */
    private async previewForm(node?: TreeNode) {
        try {
            let form: FormDefinition | undefined;

            if (node && node.type === ElementTypes.form) {
                form = await this.getFormFromNode(node);
            } else if (this.currentForm) {
                form = this.currentForm;
            } else {
                form = await this.selectForm();
            }

            if (form) {
                FormPreviewPanel.createOrShow(form);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to preview form: ${error}`);
        }
    }

    /**
     * Validate form
     */
    private async validateForm(node?: TreeNode) {
        try {
            if (!this.formBuilderService) {
                vscode.window.showErrorMessage('No ShareDo connection available');
                return;
            }

            let form: FormDefinition | undefined;

            if (node && node.type === ElementTypes.form) {
                form = await this.getFormFromNode(node);
            } else if (this.currentForm) {
                form = this.currentForm;
            } else {
                form = await this.selectForm();
            }

            if (!form) {
                return;
            }

            const validation = this.formBuilderService.validateForm(form);

            if (validation.valid) {
                vscode.window.showInformationMessage('Form validation passed!');
            } else {
                const errorCount = validation.errors.filter((e: any) => e.severity === 'error').length;
                const warningCount = validation.errors.filter((e: any) => e.severity === 'warning').length;
                
                const message = `Form validation failed: ${errorCount} errors, ${warningCount} warnings`;
                
                const viewDetails = await vscode.window.showErrorMessage(
                    message,
                    'View Details'
                );

                if (viewDetails === 'View Details') {
                    // Show validation results in output channel
                    const outputChannel = vscode.window.createOutputChannel('Form Validation');
                    outputChannel.clear();
                    outputChannel.appendLine(`Validation Results for: ${form.Form.Title}`);
                    outputChannel.appendLine('='.repeat(50));
                    
                    validation.errors.forEach((error: any) => {
                        const icon = error.severity === 'error' ? '❌' : 
                                    error.severity === 'warning' ? '⚠️' : 'ℹ️';
                        outputChannel.appendLine(`${icon} [${error.severity?.toUpperCase() || 'INFO'}] ${error.field || 'Unknown'}: ${error.message || error}`);
                    });
                    
                    outputChannel.show();
                }
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to validate form: ${error}`);
        }
    }

    /**
     * Clone form
     */
    private async cloneForm(node?: TreeNode) {
        try {
            if (!this.formBuilderService) {
                vscode.window.showErrorMessage('No ShareDo connection available');
                return;
            }

            let form: FormDefinition | undefined;

            if (node && node.type === ElementTypes.form) {
                form = await this.getFormFromNode(node);
            } else {
                form = await this.selectForm();
            }

            if (!form) {
                return;
            }

            const clonedForm = await this.formBuilderService.cloneForm(form);

            if (clonedForm) {
                this.currentForm = clonedForm;
                
                // Refresh tree view
                await vscode.commands.executeCommand('sharedo.refreshTreeView');
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to clone form: ${error}`);
        }
    }

    /**
     * Delete field from form
     */
    private async deleteField(node?: TreeNode) {
        try {
            if (!this.formBuilderService || !node) {
                return;
            }

            // Get field name and parent form
            const fieldName = node.data?.name;
            const form = await this.getParentForm(node);

            if (!fieldName || !form) {
                vscode.window.showErrorMessage('Could not identify field or form');
                return;
            }

            await this.formBuilderService.deleteField(form, fieldName);
            
            // Refresh tree view
            await vscode.commands.executeCommand('sharedo.refreshTreeView');
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to delete field: ${error}`);
        }
    }

    /**
     * Move field up or down
     */
    private async moveField(node: TreeNode | undefined, direction: 'up' | 'down') {
        try {
            if (!this.formBuilderService || !node) {
                return;
            }

            const fieldName = node.data?.name;
            const form = await this.getParentForm(node);

            if (!fieldName || !form) {
                return;
            }

            await this.formBuilderService.moveField(form, fieldName, direction);
            
            // Refresh tree view
            await vscode.commands.executeCommand('sharedo.refreshTreeView');
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to move field: ${error}`);
        }
    }

    /**
     * Export form as JSON
     */
    private async exportForm(node?: TreeNode) {
        try {
            if (!this.formBuilderService) {
                return;
            }

            let form: FormDefinition | undefined;

            if (node && node.type === ElementTypes.form) {
                form = await this.getFormFromNode(node);
            } else {
                form = await this.selectForm();
            }

            if (form) {
                await this.formBuilderService.exportForm(form);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to export form: ${error}`);
        }
    }

    /**
     * Import form from JSON
     */
    private async importForm() {
        try {
            if (!this.formBuilderService) {
                vscode.window.showErrorMessage('No ShareDo connection available');
                return;
            }

            const form = await this.formBuilderService.importForm();

            if (form) {
                this.currentForm = form;
                
                // Refresh tree view
                await vscode.commands.executeCommand('sharedo.refreshTreeView');
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to import form: ${error}`);
        }
    }

    /**
     * View form JSON
     */
    private async viewFormJSON(node?: TreeNode) {
        try {
            let form: FormDefinition | undefined;

            if (node && node.type === ElementTypes.form) {
                form = await this.getFormFromNode(node);
            } else {
                form = await this.selectForm();
            }

            if (!form) {
                return;
            }

            // Create a new untitled document with the JSON
            const doc = await vscode.workspace.openTextDocument({
                language: 'json',
                content: JSON.stringify(form, null, 2)
            });

            await vscode.window.showTextDocument(doc);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to view form JSON: ${error}`);
        }
    }

    /**
     * Refresh forms in tree view
     */
    private async refreshForms() {
        await vscode.commands.executeCommand('sharedo.refreshTreeView');
        vscode.window.showInformationMessage('Forms refreshed');
    }

    /**
     * Toggle field required status
     */
    private async toggleFieldRequired(node?: TreeNode) {
        try {
            if (!this.formBuilderService || !node) {
                return;
            }

            const fieldName = node.data?.name;
            const form = await this.getParentForm(node);

            if (!fieldName || !form) {
                return;
            }

            const field = form.Fields.find(f => f.name === fieldName);
            if (field) {
                field.required = !field.required;
                await this.formBuilderService.saveFormDefinition(form);
                
                vscode.window.showInformationMessage(
                    `Field '${field.title}' is now ${field.required ? 'required' : 'optional'}`
                );
                
                // Refresh tree view
                await vscode.commands.executeCommand('sharedo.refreshTreeView');
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to toggle required: ${error}`);
        }
    }

    /**
     * Edit field properties
     */
    private async editFieldProperties(node?: TreeNode) {
        try {
            if (!node) {
                return;
            }

            const fieldName = node.data?.name;
            const form = await this.getParentForm(node);

            if (!fieldName || !form) {
                return;
            }

            const field = form.Fields.find(f => f.name === fieldName);
            if (!field) {
                return;
            }

            // Open field JSON for editing
            const doc = await vscode.workspace.openTextDocument({
                language: 'json',
                content: JSON.stringify(field, null, 2)
            });

            const editor = await vscode.window.showTextDocument(doc);
            
            vscode.window.showInformationMessage(
                'Edit the field properties and save to apply changes'
            );
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to edit field: ${error}`);
        }
    }

    /**
     * Helper: Get form from tree node
     */
    private async getFormFromNode(node: TreeNode): Promise<FormDefinition | undefined> {
        if (!this.formBuilderService) {
            return undefined;
        }

        // If node has form data
        if (node.additionalData) {
            return node.additionalData as FormDefinition;
        }

        // Try to load from file
        const formId = node.data?.id || node.data?.Id;
        if (formId) {
            const formsFolder = path.join(
                vscode.workspace.workspaceFolders![0].uri.fsPath,
                '_Forms',
                'forms'
            );
            
            const files = fs.readdirSync(formsFolder);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filePath = path.join(formsFolder, file);
                    const form = await this.formBuilderService.loadFormDefinition(filePath);
                    if (form && form.Form.Id === formId) {
                        return form;
                    }
                }
            }
        }

        return undefined;
    }

    /**
     * Helper: Get parent form for a field node
     */
    private async getParentForm(node: TreeNode): Promise<FormDefinition | undefined> {
        let current = node;
        
        // Walk up the tree to find the form node
        while (current.parent) {
            current = current.parent;
            if (current.type === ElementTypes.form) {
                return this.getFormFromNode(current);
            }
        }

        return undefined;
    }

    /**
     * Helper: Let user select a form
     */
    private async selectForm(): Promise<FormDefinition | undefined> {
        if (!this.formBuilderService) {
            return undefined;
        }

        const formsFolder = path.join(
            vscode.workspace.workspaceFolders![0].uri.fsPath,
            '_Forms',
            'forms'
        );

        if (!fs.existsSync(formsFolder)) {
            vscode.window.showErrorMessage('No forms folder found');
            return undefined;
        }

        const files = fs.readdirSync(formsFolder).filter(f => f.endsWith('.json'));
        
        if (files.length === 0) {
            vscode.window.showErrorMessage('No forms found');
            return undefined;
        }

        const formOptions: vscode.QuickPickItem[] = [];
        
        for (const file of files) {
            const filePath = path.join(formsFolder, file);
            const form = await this.formBuilderService.loadFormDefinition(filePath);
            if (form) {
                formOptions.push({
                    label: form.Form.Title,
                    description: form.Form.SystemName,
                    detail: `${form.Fields.length} fields`
                });
            }
        }

        const selected = await vscode.window.showQuickPick(formOptions, {
            placeHolder: 'Select a form'
        });

        if (selected) {
            const file = files.find(f => f.includes(selected.description!));
            if (file) {
                const filePath = path.join(formsFolder, file);
                return this.formBuilderService.loadFormDefinition(filePath);
            }
        }

        return undefined;
    }
}