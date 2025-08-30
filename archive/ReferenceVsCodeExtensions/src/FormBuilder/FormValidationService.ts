/**
 * Form Validation Service
 * 
 * Validates form definitions against ShareDo requirements
 */

import { FormDefinition, FormField, FormFieldType } from './FormBuilderService';

export interface ValidationError {
    field: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
}

export class FormValidationService {
    private readonly validFieldTypes: FormFieldType[] = [
        'Text', 'Textarea', 'Currency', 'Number', 'Date', 'DateTime',
        'OptionSetPicker', 'Boolean', 'Toggle', 'Email', 'URL',
        'Calculated', 'Lookup', 'File', 'RichText', 'Phone', 'Percentage'
    ];

    private readonly validLayouts = [
        '/plugins/Sharedo.UI.Framework/content/formbuilder/layout-single-column.html',
        '/plugins/Sharedo.UI.Framework/content/formbuilder/layout-two-column.html',
        '/plugins/Sharedo.UI.Framework/content/formbuilder/layout-three-column.html'
    ];

    /**
     * Validate entire form definition
     */
    validateForm(form: FormDefinition): { valid: boolean; errors: ValidationError[] } {
        const errors: ValidationError[] = [];

        // Validate form metadata
        this.validateFormMetadata(form, errors);

        // Validate fields
        this.validateFields(form.Fields, errors);

        // Check for duplicate field names
        this.checkDuplicateFieldNames(form.Fields, errors);

        // Validate field references
        this.validateFieldReferences(form, errors);

        return {
            valid: errors.filter(e => e.severity === 'error').length === 0,
            errors
        };
    }

    /**
     * Validate form metadata
     */
    private validateFormMetadata(form: FormDefinition, errors: ValidationError[]) {
        // Check required form properties
        if (!form.Form) {
            errors.push({
                field: 'Form',
                message: 'Form metadata is required',
                severity: 'error'
            });
            return;
        }

        if (!form.Form.SystemName) {
            errors.push({
                field: 'Form.SystemName',
                message: 'System name is required',
                severity: 'error'
            });
        } else if (!/^[a-z0-9-]+$/.test(form.Form.SystemName)) {
            errors.push({
                field: 'Form.SystemName',
                message: 'System name must be lowercase with hyphens only',
                severity: 'error'
            });
        }

        if (!form.Form.Title) {
            errors.push({
                field: 'Form.Title',
                message: 'Form title is required',
                severity: 'error'
            });
        }

        // Validate layout if specified
        if (form.Form.Layout && !this.validLayouts.includes(form.Form.Layout)) {
            if (form.Form.Layout !== 'custom') {
                errors.push({
                    field: 'Form.Layout',
                    message: `Invalid layout. Must be one of: ${this.validLayouts.join(', ')}`,
                    severity: 'warning'
                });
            }
        }

        // Check for recommended properties
        if (!form.Form.Description) {
            errors.push({
                field: 'Form.Description',
                message: 'Form description is recommended for documentation',
                severity: 'info'
            });
        }
    }

    /**
     * Validate all fields
     */
    private validateFields(fields: FormField[], errors: ValidationError[]) {
        if (!fields || fields.length === 0) {
            errors.push({
                field: 'Fields',
                message: 'Form should have at least one field',
                severity: 'warning'
            });
            return;
        }

        fields.forEach((field, index) => {
            this.validateField(field, index, errors);
        });
    }

    /**
     * Validate individual field
     */
    private validateField(field: FormField, index: number, errors: ValidationError[]) {
        const fieldPath = `Fields[${index}]`;

        // Check required field properties
        if (!field.name) {
            errors.push({
                field: `${fieldPath}.name`,
                message: 'Field name is required',
                severity: 'error'
            });
        } else if (!/^[a-z0-9-]+$/.test(field.name)) {
            errors.push({
                field: `${fieldPath}.name`,
                message: `Field name '${field.name}' must be lowercase with hyphens only`,
                severity: 'error'
            });
        }

        if (!field.title) {
            errors.push({
                field: `${fieldPath}.title`,
                message: 'Field title is required',
                severity: 'error'
            });
        }

        if (!field.type) {
            errors.push({
                field: `${fieldPath}.type`,
                message: 'Field type is required',
                severity: 'error'
            });
        } else if (!this.validFieldTypes.includes(field.type)) {
            errors.push({
                field: `${fieldPath}.type`,
                message: `Invalid field type '${field.type}'. Must be one of: ${this.validFieldTypes.join(', ')}`,
                severity: 'error'
            });
        }

        // Validate attributes JSON
        if (field.attributes) {
            try {
                const attrs = JSON.parse(field.attributes);
                this.validateFieldAttributes(field, attrs, fieldPath, errors);
            } catch (e) {
                errors.push({
                    field: `${fieldPath}.attributes`,
                    message: 'Invalid JSON in field attributes',
                    severity: 'error'
                });
            }
        }

        // Check layout location
        if (field.layoutLocation && !field.layoutLocation.startsWith('.')) {
            errors.push({
                field: `${fieldPath}.layoutLocation`,
                message: 'Layout location should be a CSS class selector starting with "."',
                severity: 'warning'
            });
        }

        // Check display order
        if (field.displayOrder === undefined || field.displayOrder === null) {
            errors.push({
                field: `${fieldPath}.displayOrder`,
                message: 'Display order is recommended for consistent field ordering',
                severity: 'info'
            });
        }
    }

    /**
     * Validate field attributes based on type
     */
    private validateFieldAttributes(field: FormField, attrs: any, fieldPath: string, errors: ValidationError[]) {
        switch (field.type) {
            case 'Currency':
                if (!attrs.Prefix && !attrs.Suffix) {
                    errors.push({
                        field: `${fieldPath}.attributes`,
                        message: 'Currency field should have Prefix or Suffix',
                        severity: 'warning'
                    });
                }
                if (attrs.DecimalPlaces && (attrs.DecimalPlaces < 0 || attrs.DecimalPlaces > 10)) {
                    errors.push({
                        field: `${fieldPath}.attributes.DecimalPlaces`,
                        message: 'Decimal places should be between 0 and 10',
                        severity: 'warning'
                    });
                }
                break;

            case 'Text':
                if (attrs.MaxLength && attrs.MaxLength < 1) {
                    errors.push({
                        field: `${fieldPath}.attributes.MaxLength`,
                        message: 'MaxLength must be greater than 0',
                        severity: 'error'
                    });
                }
                if (attrs.Pattern) {
                    try {
                        new RegExp(attrs.Pattern);
                    } catch (e) {
                        errors.push({
                            field: `${fieldPath}.attributes.Pattern`,
                            message: 'Invalid regular expression pattern',
                            severity: 'error'
                        });
                    }
                }
                break;

            case 'OptionSetPicker':
                if (!attrs.OptionSetName) {
                    errors.push({
                        field: `${fieldPath}.attributes.OptionSetName`,
                        message: 'OptionSetPicker requires OptionSetName',
                        severity: 'error'
                    });
                }
                break;

            case 'Toggle':
                if (!attrs.DataOn || !attrs.DataOff) {
                    errors.push({
                        field: `${fieldPath}.attributes`,
                        message: 'Toggle field should have DataOn and DataOff labels',
                        severity: 'warning'
                    });
                }
                break;

            case 'Number':
            case 'Percentage':
                if (attrs.Min !== undefined && attrs.Max !== undefined) {
                    if (attrs.Min > attrs.Max) {
                        errors.push({
                            field: `${fieldPath}.attributes`,
                            message: 'Min value cannot be greater than Max value',
                            severity: 'error'
                        });
                    }
                }
                break;

            case 'Email':
                if (!attrs.Pattern) {
                    errors.push({
                        field: `${fieldPath}.attributes.Pattern`,
                        message: 'Email field should have validation pattern',
                        severity: 'info'
                    });
                }
                break;

            case 'Phone':
                if (!attrs.Pattern && !attrs.Format) {
                    errors.push({
                        field: `${fieldPath}.attributes`,
                        message: 'Phone field should have Pattern or Format',
                        severity: 'info'
                    });
                }
                break;
        }
    }

    /**
     * Check for duplicate field names
     */
    private checkDuplicateFieldNames(fields: FormField[], errors: ValidationError[]) {
        const names = new Map<string, number[]>();

        fields.forEach((field, index) => {
            if (field.name) {
                if (!names.has(field.name)) {
                    names.set(field.name, []);
                }
                names.get(field.name)!.push(index);
            }
        });

        names.forEach((indices, name) => {
            if (indices.length > 1) {
                errors.push({
                    field: 'Fields',
                    message: `Duplicate field name '${name}' at positions ${indices.join(', ')}`,
                    severity: 'error'
                });
            }
        });
    }

    /**
     * Validate field references and dependencies
     */
    private validateFieldReferences(form: FormDefinition, errors: ValidationError[]) {
        // Check parent form IDs
        form.Fields.forEach((field, index) => {
            if (field.parentFormId && field.parentFormId !== form.Form.Id) {
                errors.push({
                    field: `Fields[${index}].parentFormId`,
                    message: 'Field parentFormId does not match form ID',
                    severity: 'warning'
                });
            }

            // Check section references
            if (field.parentSectionId && form.Sections) {
                const sectionExists = form.Sections.some((s: any) => s.Id === field.parentSectionId);
                if (!sectionExists) {
                    errors.push({
                        field: `Fields[${index}].parentSectionId`,
                        message: `Referenced section '${field.parentSectionId}' does not exist`,
                        severity: 'error'
                    });
                }
            }
        });

        // Check calculated field references
        form.Fields.filter(f => f.type === 'Calculated').forEach((field, index) => {
            if (field.attributes) {
                try {
                    const attrs = JSON.parse(field.attributes);
                    if (attrs.Formula) {
                        // Simple check for field references in formula
                        const referencedFields = attrs.Formula.match(/\[([^\]]+)\]/g);
                        if (referencedFields) {
                            referencedFields.forEach((ref: string) => {
                                const fieldName = ref.replace(/[\[\]]/g, '');
                                if (!form.Fields.some(f => f.name === fieldName)) {
                                    errors.push({
                                        field: `Fields[${index}].attributes.Formula`,
                                        message: `Formula references unknown field '${fieldName}'`,
                                        severity: 'error'
                                    });
                                }
                            });
                        }
                    }
                } catch (e) {
                    // JSON parse error already handled above
                }
            }
        });
    }

    /**
     * Validate a single field value
     */
    validateFieldValue(field: FormField, value: any): ValidationError[] {
        const errors: ValidationError[] = [];

        // Required field validation
        if (field.required && (value === null || value === undefined || value === '')) {
            errors.push({
                field: field.name,
                message: `${field.title} is required`,
                severity: 'error'
            });
            return errors;
        }

        // Type-specific validation
        switch (field.type) {
            case 'Email':
                if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    errors.push({
                        field: field.name,
                        message: 'Invalid email address',
                        severity: 'error'
                    });
                }
                break;

            case 'URL':
                if (value && !/^https?:\/\/.+/.test(value)) {
                    errors.push({
                        field: field.name,
                        message: 'Invalid URL',
                        severity: 'error'
                    });
                }
                break;

            case 'Phone':
                if (value && !/^[\d\s\-\(\)\+]+$/.test(value)) {
                    errors.push({
                        field: field.name,
                        message: 'Invalid phone number',
                        severity: 'error'
                    });
                }
                break;

            case 'Number':
            case 'Currency':
            case 'Percentage':
                if (value && isNaN(parseFloat(value))) {
                    errors.push({
                        field: field.name,
                        message: 'Must be a valid number',
                        severity: 'error'
                    });
                } else if (field.attributes) {
                    try {
                        const attrs = JSON.parse(field.attributes);
                        const numValue = parseFloat(value);
                        
                        if (attrs.Min !== undefined && numValue < attrs.Min) {
                            errors.push({
                                field: field.name,
                                message: `Value must be at least ${attrs.Min}`,
                                severity: 'error'
                            });
                        }
                        
                        if (attrs.Max !== undefined && numValue > attrs.Max) {
                            errors.push({
                                field: field.name,
                                message: `Value must not exceed ${attrs.Max}`,
                                severity: 'error'
                            });
                        }
                    } catch (e) {
                        // Ignore JSON parse errors
                    }
                }
                break;

            case 'Date':
            case 'DateTime':
                if (value) {
                    const date = new Date(value);
                    if (isNaN(date.getTime())) {
                        errors.push({
                            field: field.name,
                            message: 'Invalid date',
                            severity: 'error'
                        });
                    }
                }
                break;
        }

        // Custom pattern validation
        if (field.attributes) {
            try {
                const attrs = JSON.parse(field.attributes);
                if (attrs.Pattern && value) {
                    const pattern = new RegExp(attrs.Pattern);
                    if (!pattern.test(value)) {
                        errors.push({
                            field: field.name,
                            message: attrs.PatternMessage || 'Value does not match required pattern',
                            severity: 'error'
                        });
                    }
                }
            } catch (e) {
                // Ignore JSON parse errors
            }
        }

        return errors;
    }
}