/**
 * Form Builder Service for ShareDo VS Code Extension
 * 
 * Core service for managing form creation, editing, and validation
 * Based on ShareDo Knowledge Base documentation
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { SharedoClient } from '../sharedoClient';
import { IFormBuilderRequestResult } from '../Request/FormBuilder/IFormBuilderRequestResult';
import { FormValidationService } from './FormValidationService';
import { FormTemplateService } from './FormTemplateService';

export interface FormField {
    id?: string;
    parentFormId?: string;
    parentSectionId?: string | null;
    name: string;
    title: string;
    description?: string | null;
    type: FormFieldType;
    attributes?: string;
    layoutLocation?: string;
    displayOrder?: number;
    readonly?: boolean;
    required?: boolean;
}

export type FormFieldType = 
    | 'Text' 
    | 'Textarea' 
    | 'Currency' 
    | 'Number' 
    | 'Date' 
    | 'DateTime' 
    | 'OptionSetPicker' 
    | 'Boolean' 
    | 'Toggle' 
    | 'Email' 
    | 'URL' 
    | 'Calculated' 
    | 'Lookup' 
    | 'File' 
    | 'RichText' 
    | 'Phone' 
    | 'Percentage';

export interface FormDefinition {
    Form: {
        Id?: string;
        SystemName: string;
        Title: string;
        Description?: string;
        Layout?: string;
        LayoutParent?: string;
        ShowTitle?: boolean;
        Readonly?: boolean;
        SmartVariableSystemName?: string | null;
    };
    Sections?: any[];
    Fields: FormField[];
}

export class FormBuilderService {
    private validationService: FormValidationService;
    private templateService: FormTemplateService;
    private formsFolder: string;

    constructor(private client: SharedoClient) {
        this.validationService = new FormValidationService();
        this.templateService = new FormTemplateService();
        
        // Set forms folder path
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (workspaceFolder) {
            this.formsFolder = path.join(workspaceFolder.uri.fsPath, '_Forms');
            this.ensureFormsFolderExists();
        } else {
            this.formsFolder = '';
        }
    }

    private async ensureFormsFolderExists() {
        const folders = ['', 'forms', 'templates', 'schemas'];
        for (const folder of folders) {
            const folderPath = path.join(this.formsFolder, folder);
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath, { recursive: true });
            }
        }
    }

    /**
     * Create a new form with wizard
     */
    async createFormWithWizard(): Promise<FormDefinition | undefined> {
        try {
            // Step 1: Get form name
            const formTitle = await vscode.window.showInputBox({
                prompt: 'Enter form name',
                placeHolder: 'Customer Registration Form',
                validateInput: (value) => {
                    if (!value || value.trim() === '') {
                        return 'Form name is required';
                    }
                    return null;
                }
            });

            if (!formTitle) {
                return undefined;
            }

            // Step 2: Select layout
            const layouts = [
                { label: 'Single Column', value: '/plugins/Sharedo.UI.Framework/content/formbuilder/layout-single-column.html' },
                { label: 'Two Column', value: '/plugins/Sharedo.UI.Framework/content/formbuilder/layout-two-column.html' },
                { label: 'Three Column', value: '/plugins/Sharedo.UI.Framework/content/formbuilder/layout-three-column.html' },
                { label: 'Custom HTML', value: 'custom' }
            ];

            const selectedLayout = await vscode.window.showQuickPick(layouts, {
                placeHolder: 'Select form layout'
            });

            if (!selectedLayout) {
                return undefined;
            }

            // Step 3: Select template
            const templates = [
                { label: 'Blank Form', value: 'blank' },
                { label: 'Contact Form', value: 'contact' },
                { label: 'Registration Form', value: 'registration' },
                { label: 'Acquisition Details (Real Estate)', value: 'acquisition' },
                { label: 'Legal Matter Form', value: 'legal' }
            ];

            const selectedTemplate = await vscode.window.showQuickPick(templates, {
                placeHolder: 'Select form template'
            });

            if (!selectedTemplate) {
                return undefined;
            }

            // Generate system name from title
            const systemName = this.generateSystemName(formTitle);

            // Create form definition
            const formDefinition: FormDefinition = {
                Form: {
                    Id: this.generateId(),
                    SystemName: systemName,
                    Title: formTitle,
                    Description: '',
                    Layout: selectedLayout.value,
                    LayoutParent: 'bootstrap-edit-horizontal',
                    ShowTitle: false,
                    Readonly: false,
                    SmartVariableSystemName: null
                },
                Sections: [],
                Fields: await this.templateService.getTemplateFields(selectedTemplate.value)
            };

            // Save form to file
            await this.saveFormDefinition(formDefinition);

            vscode.window.showInformationMessage(`Form '${formTitle}' created successfully!`);

            return formDefinition;

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to create form: ${error}`);
            return undefined;
        }
    }

    /**
     * Add a field to an existing form
     */
    async addFieldToForm(form: FormDefinition): Promise<FormField | undefined> {
        try {
            // Step 1: Select field type
            const fieldTypes: { label: FormFieldType; description: string }[] = [
                { label: 'Text', description: 'Single line text input' },
                { label: 'Textarea', description: 'Multi-line text input' },
                { label: 'Currency', description: 'Money field with currency symbol' },
                { label: 'Number', description: 'Numeric input' },
                { label: 'Date', description: 'Date picker' },
                { label: 'DateTime', description: 'Date and time picker' },
                { label: 'OptionSetPicker', description: 'Dropdown list' },
                { label: 'Toggle', description: 'Yes/No switch' },
                { label: 'Email', description: 'Email address' },
                { label: 'Phone', description: 'Phone number' },
                { label: 'URL', description: 'Web address' },
                { label: 'File', description: 'File upload' },
                { label: 'Percentage', description: 'Percentage value' }
            ];

            const selectedType = await vscode.window.showQuickPick(fieldTypes, {
                placeHolder: 'Select field type'
            });

            if (!selectedType) {
                return undefined;
            }

            // Step 2: Get field name
            const fieldName = await vscode.window.showInputBox({
                prompt: 'Field name (lowercase, use hyphens for spaces)',
                placeHolder: 'property-price',
                validateInput: (value) => {
                    if (!value || value.trim() === '') {
                        return 'Field name is required';
                    }
                    if (!/^[a-z0-9-]+$/.test(value)) {
                        return 'Field name must be lowercase with hyphens only';
                    }
                    // Check if field name already exists
                    if (form.Fields.some(f => f.name === value)) {
                        return 'Field name already exists';
                    }
                    return null;
                }
            });

            if (!fieldName) {
                return undefined;
            }

            // Step 3: Get field title
            const fieldTitle = await vscode.window.showInputBox({
                prompt: 'Field title (display name)',
                placeHolder: 'Property Price',
                value: this.titleCase(fieldName.replace(/-/g, ' '))
            });

            if (!fieldTitle) {
                return undefined;
            }

            // Step 4: Get field-specific attributes
            const attributes = await this.getFieldAttributes(selectedType.label);

            // Step 5: Required field?
            const isRequired = await vscode.window.showQuickPick(
                ['No', 'Yes'],
                { placeHolder: 'Is this field required?' }
            ) === 'Yes';

            // Create field
            const newField: FormField = {
                id: this.generateId(),
                parentFormId: form.Form.Id,
                parentSectionId: null,
                name: fieldName,
                title: fieldTitle,
                description: null,
                type: selectedType.label,
                attributes: JSON.stringify(attributes),
                layoutLocation: '.layout-top',
                displayOrder: form.Fields.length,
                readonly: false,
                required: isRequired
            };

            // Add field to form
            form.Fields.push(newField);

            // Save updated form
            await this.saveFormDefinition(form);

            vscode.window.showInformationMessage(`Field '${fieldTitle}' added successfully!`);

            return newField;

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to add field: ${error}`);
            return undefined;
        }
    }

    /**
     * Get field-specific attributes based on type
     */
    private async getFieldAttributes(fieldType: FormFieldType): Promise<any> {
        const attributes: any = {};

        switch (fieldType) {
            case 'Currency':
                attributes.Prefix = await vscode.window.showInputBox({
                    prompt: 'Currency symbol',
                    value: '£'
                }) || '£';
                attributes.Suffix = '';
                attributes.DecimalPlaces = 2;
                break;

            case 'Text':
                const maxLength = await vscode.window.showInputBox({
                    prompt: 'Maximum length (optional)',
                    placeHolder: '255'
                });
                if (maxLength) {
                    attributes.MaxLength = parseInt(maxLength);
                }
                
                const placeholder = await vscode.window.showInputBox({
                    prompt: 'Placeholder text (optional)',
                    placeHolder: 'Enter text...'
                });
                if (placeholder) {
                    attributes.Placeholder = placeholder;
                }
                break;

            case 'OptionSetPicker':
                attributes.OptionSetName = await vscode.window.showInputBox({
                    prompt: 'Option set name',
                    placeHolder: 'yes-or-no',
                    value: 'yes-or-no'
                }) || 'yes-or-no';
                
                attributes.Multiple = await vscode.window.showQuickPick(
                    ['Single Select', 'Multi Select'],
                    { placeHolder: 'Selection type' }
                ) === 'Multi Select';
                
                attributes.AllowNoSelection = true;
                break;

            case 'Toggle':
                attributes.DataOn = await vscode.window.showInputBox({
                    prompt: 'Label when ON',
                    value: 'Yes'
                }) || 'Yes';
                
                attributes.DataOff = await vscode.window.showInputBox({
                    prompt: 'Label when OFF',
                    value: 'No'
                }) || 'No';
                
                attributes.ButtonWidth = '100px';
                break;

            case 'Number':
                const min = await vscode.window.showInputBox({
                    prompt: 'Minimum value (optional)'
                });
                if (min) {
                    attributes.Min = parseFloat(min);
                }
                
                const max = await vscode.window.showInputBox({
                    prompt: 'Maximum value (optional)'
                });
                if (max) {
                    attributes.Max = parseFloat(max);
                }
                break;

            case 'Percentage':
                attributes.Suffix = '%';
                attributes.Min = 0;
                attributes.Max = 100;
                break;

            case 'Phone':
                attributes.Pattern = '^[\\d\\s\\-\\(\\)\\+]+$';
                attributes.Placeholder = '+44 20 1234 5678';
                break;

            case 'Email':
                attributes.Pattern = '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$';
                attributes.Placeholder = 'email@example.com';
                break;
        }

        // Add ChronologyCard flag for important fields
        const showInChronology = await vscode.window.showQuickPick(
            ['No', 'Yes'],
            { placeHolder: 'Show in chronology card?' }
        ) === 'Yes';
        
        if (showInChronology) {
            attributes.ChronologyCard = true;
        }

        return attributes;
    }

    /**
     * Save form definition to file
     */
    async saveFormDefinition(form: FormDefinition): Promise<void> {
        const fileName = `${form.Form.SystemName}.json`;
        const filePath = path.join(this.formsFolder, 'forms', fileName);
        
        const content = JSON.stringify(form, null, 2);
        fs.writeFileSync(filePath, content, 'utf8');
        
        // Open the file in editor
        const doc = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(doc);
    }

    /**
     * Load form definition from file
     */
    async loadFormDefinition(filePath: string): Promise<FormDefinition | undefined> {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(content) as FormDefinition;
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to load form: ${error}`);
            return undefined;
        }
    }

    /**
     * Validate form definition
     */
    validateForm(form: FormDefinition): { valid: boolean; errors: any[] } {
        return this.validationService.validateForm(form);
    }

    /**
     * Clone an existing form
     */
    async cloneForm(form: FormDefinition): Promise<FormDefinition | undefined> {
        const newTitle = await vscode.window.showInputBox({
            prompt: 'Enter name for cloned form',
            value: `${form.Form.Title} (Copy)`
        });

        if (!newTitle) {
            return undefined;
        }

        const clonedForm: FormDefinition = JSON.parse(JSON.stringify(form));
        clonedForm.Form.Id = this.generateId();
        clonedForm.Form.SystemName = this.generateSystemName(newTitle);
        clonedForm.Form.Title = newTitle;

        // Generate new IDs for fields
        clonedForm.Fields = clonedForm.Fields.map(field => ({
            ...field,
            id: this.generateId(),
            parentFormId: clonedForm.Form.Id
        }));

        await this.saveFormDefinition(clonedForm);
        
        vscode.window.showInformationMessage(`Form '${newTitle}' cloned successfully!`);
        
        return clonedForm;
    }

    /**
     * Delete a field from form
     */
    async deleteField(form: FormDefinition, fieldName: string): Promise<void> {
        const fieldIndex = form.Fields.findIndex(f => f.name === fieldName);
        
        if (fieldIndex === -1) {
            vscode.window.showErrorMessage(`Field '${fieldName}' not found`);
            return;
        }

        const confirm = await vscode.window.showWarningMessage(
            `Delete field '${form.Fields[fieldIndex].title}'?`,
            'Yes', 'No'
        );

        if (confirm === 'Yes') {
            form.Fields.splice(fieldIndex, 1);
            
            // Reorder display order
            form.Fields.forEach((field, index) => {
                field.displayOrder = index;
            });

            await this.saveFormDefinition(form);
            vscode.window.showInformationMessage('Field deleted successfully');
        }
    }

    /**
     * Move field up or down in display order
     */
    async moveField(form: FormDefinition, fieldName: string, direction: 'up' | 'down'): Promise<void> {
        const fieldIndex = form.Fields.findIndex(f => f.name === fieldName);
        
        if (fieldIndex === -1) {
            return;
        }

        const newIndex = direction === 'up' ? fieldIndex - 1 : fieldIndex + 1;
        
        if (newIndex < 0 || newIndex >= form.Fields.length) {
            return;
        }

        // Swap fields
        [form.Fields[fieldIndex], form.Fields[newIndex]] = 
        [form.Fields[newIndex], form.Fields[fieldIndex]];

        // Update display order
        form.Fields.forEach((field, index) => {
            field.displayOrder = index;
        });

        await this.saveFormDefinition(form);
    }

    /**
     * Helper: Generate unique ID
     */
    private generateId(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Helper: Generate system name from title
     */
    private generateSystemName(title: string): string {
        return title.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }

    /**
     * Helper: Convert to title case
     */
    private titleCase(str: string): string {
        return str.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    /**
     * Export form as JSON
     */
    async exportForm(form: FormDefinition): Promise<void> {
        const uri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(`${form.Form.SystemName}.json`),
            filters: {
                'JSON Files': ['json']
            }
        });

        if (uri) {
            const content = JSON.stringify(form, null, 2);
            fs.writeFileSync(uri.fsPath, content, 'utf8');
            vscode.window.showInformationMessage('Form exported successfully');
        }
    }

    /**
     * Import form from JSON
     */
    async importForm(): Promise<FormDefinition | undefined> {
        const uri = await vscode.window.showOpenDialog({
            canSelectMany: false,
            openLabel: 'Import Form',
            filters: {
                'JSON Files': ['json']
            }
        });

        if (uri && uri[0]) {
            const form = await this.loadFormDefinition(uri[0].fsPath);
            
            if (form) {
                // Generate new IDs
                form.Form.Id = this.generateId();
                form.Fields.forEach(field => {
                    field.id = this.generateId();
                    field.parentFormId = form.Form.Id;
                });

                await this.saveFormDefinition(form);
                vscode.window.showInformationMessage('Form imported successfully');
                
                return form;
            }
        }

        return undefined;
    }
}