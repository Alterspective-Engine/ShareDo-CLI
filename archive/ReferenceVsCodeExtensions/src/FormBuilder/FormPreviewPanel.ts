/**
 * Form Preview Panel
 * 
 * WebView panel for previewing forms with live rendering
 */

import * as vscode from 'vscode';
import { FormDefinition, FormField } from './FormBuilderService';

export class FormPreviewPanel {
    private static currentPanel: FormPreviewPanel | undefined;
    private readonly panel: vscode.WebviewPanel;
    private form: FormDefinition;
    private disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, form: FormDefinition) {
        this.panel = panel;
        this.form = form;

        // Set the webview's initial html content
        this.update();

        // Listen for when the panel is disposed
        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

        // Update the content based on view changes
        this.panel.onDidChangeViewState(
            e => {
                if (this.panel.visible) {
                    this.update();
                }
            },
            null,
            this.disposables
        );

        // Handle messages from the webview
        this.panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'alert':
                        vscode.window.showInformationMessage(message.text);
                        return;
                    case 'submit':
                        this.handleFormSubmit(message.data);
                        return;
                    case 'fieldChange':
                        this.handleFieldChange(message.field, message.value);
                        return;
                }
            },
            null,
            this.disposables
        );
    }

    public static createOrShow(form: FormDefinition) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it
        if (FormPreviewPanel.currentPanel) {
            FormPreviewPanel.currentPanel.form = form;
            FormPreviewPanel.currentPanel.panel.reveal(column);
            FormPreviewPanel.currentPanel.update();
            return;
        }

        // Otherwise, create a new panel
        const panel = vscode.window.createWebviewPanel(
            'formPreview',
            `Form Preview: ${form.Form.Title}`,
            column || vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: []
            }
        );

        FormPreviewPanel.currentPanel = new FormPreviewPanel(panel, form);
    }

    public dispose() {
        FormPreviewPanel.currentPanel = undefined;

        // Clean up our resources
        this.panel.dispose();

        while (this.disposables.length) {
            const x = this.disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private update() {
        this.panel.webview.html = this.getHtmlForWebview(this.panel.webview);
        this.panel.title = `Form Preview: ${this.form.Form.Title}`;
    }

    private getHtmlForWebview(webview: vscode.Webview) {
        const layoutClass = this.getLayoutClass();
        
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${this.form.Form.Title}</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
            <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
            <style>
                body {
                    padding: 20px;
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                }
                
                .form-preview {
                    max-width: 1200px;
                    margin: 0 auto;
                    background: var(--vscode-editor-background);
                    padding: 30px;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                
                .form-header {
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid var(--vscode-widget-border);
                }
                
                .form-title {
                    font-size: 24px;
                    font-weight: 600;
                    color: var(--vscode-editor-foreground);
                    margin-bottom: 10px;
                }
                
                .form-description {
                    color: var(--vscode-descriptionForeground);
                    font-size: 14px;
                }
                
                .field-wrapper {
                    margin-bottom: 20px;
                }
                
                .form-label {
                    font-weight: 500;
                    margin-bottom: 8px;
                    color: var(--vscode-editor-foreground);
                }
                
                .form-label.required::after {
                    content: " *";
                    color: #e74c3c;
                }
                
                .form-control, .form-select {
                    background-color: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border);
                }
                
                .form-control:focus, .form-select:focus {
                    background-color: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border-color: var(--vscode-focusBorder);
                    box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
                }
                
                .form-control[readonly] {
                    background-color: var(--vscode-input-background);
                    opacity: 0.6;
                }
                
                .input-group-text {
                    background-color: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                    border: 1px solid var(--vscode-input-border);
                }
                
                .form-check-input {
                    background-color: var(--vscode-input-background);
                    border-color: var(--vscode-input-border);
                }
                
                .form-check-input:checked {
                    background-color: var(--vscode-button-background);
                    border-color: var(--vscode-button-background);
                }
                
                .form-switch .form-check-input {
                    width: 3em;
                }
                
                .btn-primary {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 8px 16px;
                }
                
                .btn-primary:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                
                .btn-secondary {
                    background-color: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                    border: none;
                    padding: 8px 16px;
                }
                
                .invalid-feedback {
                    color: #e74c3c;
                    font-size: 12px;
                    margin-top: 4px;
                }
                
                .text-muted {
                    color: var(--vscode-descriptionForeground) !important;
                    font-size: 12px;
                }
                
                /* Layout classes */
                .layout-single-column .layout-top,
                .layout-single-column .layout-bottom {
                    width: 100%;
                }
                
                .layout-two-column {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }
                
                .layout-three-column {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 20px;
                }
                
                .form-actions {
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid var(--vscode-widget-border);
                    display: flex;
                    gap: 10px;
                }
                
                .field-info {
                    position: absolute;
                    right: 10px;
                    top: 8px;
                    font-size: 11px;
                    color: var(--vscode-descriptionForeground);
                    opacity: 0.7;
                }
                
                .field-wrapper {
                    position: relative;
                }
                
                @media (max-width: 768px) {
                    .layout-two-column,
                    .layout-three-column {
                        grid-template-columns: 1fr;
                    }
                }
            </style>
        </head>
        <body>
            <div class="form-preview">
                ${this.form.Form.ShowTitle !== false ? `
                <div class="form-header">
                    <h2 class="form-title">
                        <i class="fas fa-file-alt me-2"></i>
                        ${this.escapeHtml(this.form.Form.Title)}
                    </h2>
                    ${this.form.Form.Description ? `
                        <p class="form-description">${this.escapeHtml(this.form.Form.Description)}</p>
                    ` : ''}
                </div>
                ` : ''}
                
                <form id="previewForm" class="${layoutClass}">
                    ${this.renderAllFields()}
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-paper-plane me-2"></i>Submit
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="resetForm()">
                            <i class="fas fa-undo me-2"></i>Reset
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="validateForm()">
                            <i class="fas fa-check-circle me-2"></i>Validate
                        </button>
                    </div>
                </form>
            </div>
            
            <script>
                const vscode = acquireVsCodeApi();
                
                function submitForm() {
                    const formData = new FormData(document.getElementById('previewForm'));
                    const data = {};
                    formData.forEach((value, key) => {
                        if (data[key]) {
                            if (Array.isArray(data[key])) {
                                data[key].push(value);
                            } else {
                                data[key] = [data[key], value];
                            }
                        } else {
                            data[key] = value;
                        }
                    });
                    
                    vscode.postMessage({
                        command: 'submit',
                        data: data
                    });
                    
                    return false;
                }
                
                function resetForm() {
                    document.getElementById('previewForm').reset();
                    vscode.postMessage({
                        command: 'alert',
                        text: 'Form has been reset'
                    });
                }
                
                function validateForm() {
                    const form = document.getElementById('previewForm');
                    if (form.checkValidity()) {
                        vscode.postMessage({
                            command: 'alert',
                            text: 'Form validation passed!'
                        });
                    } else {
                        form.reportValidity();
                        vscode.postMessage({
                            command: 'alert',
                            text: 'Please fix validation errors'
                        });
                    }
                }
                
                function fieldChanged(fieldName, value) {
                    vscode.postMessage({
                        command: 'fieldChange',
                        field: fieldName,
                        value: value
                    });
                }
                
                // Handle form submission
                document.getElementById('previewForm').addEventListener('submit', function(e) {
                    e.preventDefault();
                    submitForm();
                });
                
                // Track field changes
                document.querySelectorAll('input, select, textarea').forEach(element => {
                    element.addEventListener('change', function() {
                        fieldChanged(this.name, this.value);
                    });
                });
            </script>
        </body>
        </html>`;
    }

    private renderAllFields(): string {
        // Group fields by layout location
        const topFields = this.form.Fields.filter(f => 
            !f.layoutLocation || f.layoutLocation === '.layout-top'
        );
        const bottomFields = this.form.Fields.filter(f => 
            f.layoutLocation === '.layout-bottom'
        );

        let html = '';

        if (topFields.length > 0) {
            html += '<div class="layout-top">';
            html += topFields
                .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
                .map(field => this.renderField(field))
                .join('');
            html += '</div>';
        }

        if (bottomFields.length > 0) {
            html += '<div class="layout-bottom">';
            html += bottomFields
                .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
                .map(field => this.renderField(field))
                .join('');
            html += '</div>';
        }

        // If no fields have layout location, render all
        if (topFields.length === 0 && bottomFields.length === 0) {
            html = this.form.Fields
                .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
                .map(field => this.renderField(field))
                .join('');
        }

        return html;
    }

    private renderField(field: FormField): string {
        const attributes = this.parseAttributes(field.attributes);
        const required = field.required ? 'required' : '';
        const readonly = field.readonly ? 'readonly' : '';
        const fieldId = `field-${field.name}`;

        let fieldHtml = `<div class="field-wrapper">`;
        
        // Add field type indicator
        fieldHtml += `<span class="field-info">[${field.type}]</span>`;

        switch (field.type) {
            case 'Text':
                fieldHtml += `
                    <div class="mb-3">
                        <label for="${fieldId}" class="form-label ${field.required ? 'required' : ''}">${this.escapeHtml(field.title)}</label>
                        <input type="text" 
                            id="${fieldId}"
                            name="${field.name}" 
                            class="form-control" 
                            placeholder="${this.escapeHtml(attributes.Placeholder || '')}"
                            ${attributes.MaxLength ? `maxlength="${attributes.MaxLength}"` : ''}
                            ${attributes.Pattern ? `pattern="${attributes.Pattern}"` : ''}
                            ${attributes.PatternMessage ? `title="${attributes.PatternMessage}"` : ''}
                            ${required} ${readonly}>
                        ${field.description ? `<small class="text-muted">${this.escapeHtml(field.description)}</small>` : ''}
                    </div>`;
                break;

            case 'Textarea':
                fieldHtml += `
                    <div class="mb-3">
                        <label for="${fieldId}" class="form-label ${field.required ? 'required' : ''}">${this.escapeHtml(field.title)}</label>
                        <textarea 
                            id="${fieldId}"
                            name="${field.name}" 
                            class="form-control" 
                            rows="${attributes.Rows || 3}"
                            placeholder="${this.escapeHtml(attributes.Placeholder || '')}"
                            ${required} ${readonly}></textarea>
                        ${field.description ? `<small class="text-muted">${this.escapeHtml(field.description)}</small>` : ''}
                    </div>`;
                break;

            case 'Currency':
                fieldHtml += `
                    <div class="mb-3">
                        <label for="${fieldId}" class="form-label ${field.required ? 'required' : ''}">${this.escapeHtml(field.title)}</label>
                        <div class="input-group">
                            ${attributes.Prefix ? `<span class="input-group-text">${this.escapeHtml(attributes.Prefix)}</span>` : ''}
                            <input type="number" 
                                id="${fieldId}"
                                name="${field.name}" 
                                class="form-control" 
                                step="${Math.pow(10, -(attributes.DecimalPlaces || 2))}"
                                ${attributes.Min !== undefined ? `min="${attributes.Min}"` : ''}
                                ${attributes.Max !== undefined ? `max="${attributes.Max}"` : ''}
                                ${required} ${readonly}>
                            ${attributes.Suffix ? `<span class="input-group-text">${this.escapeHtml(attributes.Suffix)}</span>` : ''}
                        </div>
                        ${field.description ? `<small class="text-muted">${this.escapeHtml(field.description)}</small>` : ''}
                    </div>`;
                break;

            case 'Number':
                fieldHtml += `
                    <div class="mb-3">
                        <label for="${fieldId}" class="form-label ${field.required ? 'required' : ''}">${this.escapeHtml(field.title)}</label>
                        <input type="number" 
                            id="${fieldId}"
                            name="${field.name}" 
                            class="form-control"
                            ${attributes.Min !== undefined ? `min="${attributes.Min}"` : ''}
                            ${attributes.Max !== undefined ? `max="${attributes.Max}"` : ''}
                            ${attributes.Step !== undefined ? `step="${attributes.Step}"` : ''}
                            ${required} ${readonly}>
                        ${field.description ? `<small class="text-muted">${this.escapeHtml(field.description)}</small>` : ''}
                    </div>`;
                break;

            case 'Date':
                fieldHtml += `
                    <div class="mb-3">
                        <label for="${fieldId}" class="form-label ${field.required ? 'required' : ''}">${this.escapeHtml(field.title)}</label>
                        <input type="date" 
                            id="${fieldId}"
                            name="${field.name}" 
                            class="form-control"
                            ${attributes.Min ? `min="${attributes.Min}"` : ''}
                            ${attributes.Max ? `max="${attributes.Max}"` : ''}
                            ${required} ${readonly}>
                        ${field.description ? `<small class="text-muted">${this.escapeHtml(field.description)}</small>` : ''}
                    </div>`;
                break;

            case 'DateTime':
                fieldHtml += `
                    <div class="mb-3">
                        <label for="${fieldId}" class="form-label ${field.required ? 'required' : ''}">${this.escapeHtml(field.title)}</label>
                        <input type="datetime-local" 
                            id="${fieldId}"
                            name="${field.name}" 
                            class="form-control"
                            ${required} ${readonly}>
                        ${field.description ? `<small class="text-muted">${this.escapeHtml(field.description)}</small>` : ''}
                    </div>`;
                break;

            case 'Email':
                fieldHtml += `
                    <div class="mb-3">
                        <label for="${fieldId}" class="form-label ${field.required ? 'required' : ''}">${this.escapeHtml(field.title)}</label>
                        <input type="email" 
                            id="${fieldId}"
                            name="${field.name}" 
                            class="form-control" 
                            placeholder="${this.escapeHtml(attributes.Placeholder || 'email@example.com')}"
                            ${required} ${readonly}>
                        ${field.description ? `<small class="text-muted">${this.escapeHtml(field.description)}</small>` : ''}
                    </div>`;
                break;

            case 'Phone':
                fieldHtml += `
                    <div class="mb-3">
                        <label for="${fieldId}" class="form-label ${field.required ? 'required' : ''}">${this.escapeHtml(field.title)}</label>
                        <input type="tel" 
                            id="${fieldId}"
                            name="${field.name}" 
                            class="form-control" 
                            placeholder="${this.escapeHtml(attributes.Placeholder || '+44 20 1234 5678')}"
                            ${attributes.Pattern ? `pattern="${attributes.Pattern}"` : ''}
                            ${required} ${readonly}>
                        ${field.description ? `<small class="text-muted">${this.escapeHtml(field.description)}</small>` : ''}
                    </div>`;
                break;

            case 'URL':
                fieldHtml += `
                    <div class="mb-3">
                        <label for="${fieldId}" class="form-label ${field.required ? 'required' : ''}">${this.escapeHtml(field.title)}</label>
                        <input type="url" 
                            id="${fieldId}"
                            name="${field.name}" 
                            class="form-control" 
                            placeholder="${this.escapeHtml(attributes.Placeholder || 'https://example.com')}"
                            ${required} ${readonly}>
                        ${field.description ? `<small class="text-muted">${this.escapeHtml(field.description)}</small>` : ''}
                    </div>`;
                break;

            case 'OptionSetPicker':
                const options = this.getOptionSetOptions(attributes.OptionSetName);
                fieldHtml += `
                    <div class="mb-3">
                        <label for="${fieldId}" class="form-label ${field.required ? 'required' : ''}">${this.escapeHtml(field.title)}</label>
                        <select 
                            id="${fieldId}"
                            name="${field.name}${attributes.Multiple ? '[]' : ''}" 
                            class="form-select"
                            ${attributes.Multiple ? 'multiple' : ''}
                            ${required} ${readonly ? 'disabled' : ''}>
                            ${!attributes.Multiple && attributes.AllowNoSelection !== false ? '<option value="">Select...</option>' : ''}
                            ${options.map(opt => `<option value="${opt.value}">${this.escapeHtml(opt.label)}</option>`).join('')}
                        </select>
                        ${field.description ? `<small class="text-muted">${this.escapeHtml(field.description)}</small>` : ''}
                    </div>`;
                break;

            case 'Toggle':
            case 'Boolean':
                fieldHtml += `
                    <div class="mb-3">
                        <div class="form-check form-switch">
                            <input type="checkbox" 
                                id="${fieldId}"
                                name="${field.name}" 
                                class="form-check-input"
                                value="true"
                                ${attributes.Default ? 'checked' : ''}
                                ${readonly ? 'disabled' : ''}>
                            <label for="${fieldId}" class="form-check-label">
                                ${this.escapeHtml(field.title)}
                                ${field.required ? '<span class="text-danger">*</span>' : ''}
                            </label>
                        </div>
                        ${field.description ? `<small class="text-muted">${this.escapeHtml(field.description)}</small>` : ''}
                    </div>`;
                break;

            case 'Percentage':
                fieldHtml += `
                    <div class="mb-3">
                        <label for="${fieldId}" class="form-label ${field.required ? 'required' : ''}">${this.escapeHtml(field.title)}</label>
                        <div class="input-group">
                            <input type="number" 
                                id="${fieldId}"
                                name="${field.name}" 
                                class="form-control" 
                                min="${attributes.Min || 0}"
                                max="${attributes.Max || 100}"
                                step="1"
                                ${required} ${readonly}>
                            <span class="input-group-text">%</span>
                        </div>
                        ${field.description ? `<small class="text-muted">${this.escapeHtml(field.description)}</small>` : ''}
                    </div>`;
                break;

            case 'File':
                fieldHtml += `
                    <div class="mb-3">
                        <label for="${fieldId}" class="form-label ${field.required ? 'required' : ''}">${this.escapeHtml(field.title)}</label>
                        <input type="file" 
                            id="${fieldId}"
                            name="${field.name}" 
                            class="form-control"
                            ${attributes.Accept ? `accept="${attributes.Accept}"` : ''}
                            ${attributes.Multiple ? 'multiple' : ''}
                            ${required} ${readonly ? 'disabled' : ''}>
                        ${field.description ? `<small class="text-muted">${this.escapeHtml(field.description)}</small>` : ''}
                    </div>`;
                break;

            default:
                fieldHtml += `
                    <div class="mb-3">
                        <label for="${fieldId}" class="form-label">${this.escapeHtml(field.title)}</label>
                        <input type="text" 
                            id="${fieldId}"
                            name="${field.name}" 
                            class="form-control" 
                            placeholder="[${field.type} - Not implemented]" 
                            disabled>
                        ${field.description ? `<small class="text-muted">${this.escapeHtml(field.description)}</small>` : ''}
                    </div>`;
        }

        fieldHtml += '</div>';
        return fieldHtml;
    }

    private getOptionSetOptions(optionSetName?: string): { value: string; label: string }[] {
        // Mock option sets - in real implementation, these would come from ShareDo
        switch (optionSetName) {
            case 'yes-or-no':
                return [
                    { value: 'yes', label: 'Yes' },
                    { value: 'no', label: 'No' }
                ];
            case 'contact-methods':
                return [
                    { value: 'email', label: 'Email' },
                    { value: 'phone', label: 'Phone' },
                    { value: 'sms', label: 'SMS' },
                    { value: 'mail', label: 'Mail' }
                ];
            case 'countries':
                return [
                    { value: 'gb', label: 'United Kingdom' },
                    { value: 'us', label: 'United States' },
                    { value: 'fr', label: 'France' },
                    { value: 'de', label: 'Germany' },
                    { value: 'au', label: 'Australia' }
                ];
            case 'property-types':
                return [
                    { value: 'house', label: 'House' },
                    { value: 'flat', label: 'Flat' },
                    { value: 'bungalow', label: 'Bungalow' },
                    { value: 'commercial', label: 'Commercial' },
                    { value: 'land', label: 'Land' }
                ];
            case 'legal-matter-types':
                return [
                    { value: 'litigation', label: 'Litigation' },
                    { value: 'corporate', label: 'Corporate' },
                    { value: 'property', label: 'Property' },
                    { value: 'family', label: 'Family' },
                    { value: 'employment', label: 'Employment' }
                ];
            case 'risk-levels':
                return [
                    { value: 'low', label: 'Low Risk' },
                    { value: 'medium', label: 'Medium Risk' },
                    { value: 'high', label: 'High Risk' },
                    { value: 'critical', label: 'Critical Risk' }
                ];
            default:
                return [
                    { value: 'option1', label: 'Option 1' },
                    { value: 'option2', label: 'Option 2' },
                    { value: 'option3', label: 'Option 3' }
                ];
        }
    }

    private getLayoutClass(): string {
        if (!this.form.Form.Layout) {
            return 'layout-single-column';
        }

        if (this.form.Form.Layout.includes('two-column')) {
            return 'layout-two-column';
        } else if (this.form.Form.Layout.includes('three-column')) {
            return 'layout-three-column';
        }

        return 'layout-single-column';
    }

    private parseAttributes(attributesJson?: string): any {
        if (!attributesJson) {
            return {};
        }

        try {
            return JSON.parse(attributesJson);
        } catch {
            return {};
        }
    }

    private escapeHtml(text: string): string {
        const map: { [key: string]: string } = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    private handleFormSubmit(data: any) {
        vscode.window.showInformationMessage(`Form submitted with ${Object.keys(data).length} fields`);
        console.log('Form data:', data);
    }

    private handleFieldChange(fieldName: string, value: any) {
        console.log(`Field ${fieldName} changed to:`, value);
    }
}