/**
 * Form Template Service
 * 
 * Provides form templates based on ShareDo Knowledge Base examples
 */

import { FormField } from './FormBuilderService';

export class FormTemplateService {
    /**
     * Get template fields based on template type
     */
    async getTemplateFields(templateType: string): Promise<FormField[]> {
        switch (templateType) {
            case 'blank':
                return [];

            case 'contact':
                return this.getContactFormFields();

            case 'registration':
                return this.getRegistrationFormFields();

            case 'acquisition':
                return this.getAcquisitionFormFields();

            case 'legal':
                return this.getLegalFormFields();

            default:
                return [];
        }
    }

    /**
     * Contact form template
     */
    private getContactFormFields(): FormField[] {
        return [
            {
                name: 'first-name',
                title: 'First Name',
                type: 'Text',
                attributes: JSON.stringify({
                    Placeholder: 'Enter first name',
                    MaxLength: 100,
                    ChronologyCard: true
                }),
                layoutLocation: '.layout-top',
                displayOrder: 0,
                readonly: false,
                required: true
            },
            {
                name: 'last-name',
                title: 'Last Name',
                type: 'Text',
                attributes: JSON.stringify({
                    Placeholder: 'Enter last name',
                    MaxLength: 100,
                    ChronologyCard: true
                }),
                layoutLocation: '.layout-top',
                displayOrder: 1,
                readonly: false,
                required: true
            },
            {
                name: 'email',
                title: 'Email Address',
                type: 'Email',
                attributes: JSON.stringify({
                    Placeholder: 'email@example.com',
                    Pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$'
                }),
                layoutLocation: '.layout-top',
                displayOrder: 2,
                readonly: false,
                required: true
            },
            {
                name: 'phone',
                title: 'Phone Number',
                type: 'Phone',
                attributes: JSON.stringify({
                    Placeholder: '+44 20 1234 5678',
                    Pattern: '^[\\d\\s\\-\\(\\)\\+]+$'
                }),
                layoutLocation: '.layout-top',
                displayOrder: 3,
                readonly: false,
                required: false
            },
            {
                name: 'company',
                title: 'Company',
                type: 'Text',
                attributes: JSON.stringify({
                    Placeholder: 'Company name',
                    MaxLength: 200
                }),
                layoutLocation: '.layout-bottom',
                displayOrder: 4,
                readonly: false,
                required: false
            },
            {
                name: 'message',
                title: 'Message',
                type: 'Textarea',
                attributes: JSON.stringify({
                    Placeholder: 'Enter your message...',
                    Rows: 5
                }),
                layoutLocation: '.layout-bottom',
                displayOrder: 5,
                readonly: false,
                required: false
            },
            {
                name: 'contact-preference',
                title: 'Preferred Contact Method',
                type: 'OptionSetPicker',
                attributes: JSON.stringify({
                    OptionSetName: 'contact-methods',
                    Multiple: false,
                    AllowNoSelection: true
                }),
                layoutLocation: '.layout-bottom',
                displayOrder: 6,
                readonly: false,
                required: false
            }
        ];
    }

    /**
     * Registration form template
     */
    private getRegistrationFormFields(): FormField[] {
        return [
            {
                name: 'username',
                title: 'Username',
                type: 'Text',
                attributes: JSON.stringify({
                    Placeholder: 'Choose a username',
                    MinLength: 3,
                    MaxLength: 30,
                    Pattern: '^[a-zA-Z0-9_]+$',
                    PatternMessage: 'Username can only contain letters, numbers, and underscores'
                }),
                layoutLocation: '.layout-top',
                displayOrder: 0,
                readonly: false,
                required: true
            },
            {
                name: 'email',
                title: 'Email Address',
                type: 'Email',
                attributes: JSON.stringify({
                    Placeholder: 'email@example.com'
                }),
                layoutLocation: '.layout-top',
                displayOrder: 1,
                readonly: false,
                required: true
            },
            {
                name: 'password',
                title: 'Password',
                type: 'Text',
                attributes: JSON.stringify({
                    InputType: 'password',
                    MinLength: 8,
                    Pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$',
                    PatternMessage: 'Password must contain at least 8 characters, one uppercase, one lowercase, and one number'
                }),
                layoutLocation: '.layout-top',
                displayOrder: 2,
                readonly: false,
                required: true
            },
            {
                name: 'confirm-password',
                title: 'Confirm Password',
                type: 'Text',
                attributes: JSON.stringify({
                    InputType: 'password',
                    MatchField: 'password'
                }),
                layoutLocation: '.layout-top',
                displayOrder: 3,
                readonly: false,
                required: true
            },
            {
                name: 'date-of-birth',
                title: 'Date of Birth',
                type: 'Date',
                attributes: JSON.stringify({
                    Max: 'today'
                }),
                layoutLocation: '.layout-bottom',
                displayOrder: 4,
                readonly: false,
                required: true
            },
            {
                name: 'country',
                title: 'Country',
                type: 'OptionSetPicker',
                attributes: JSON.stringify({
                    OptionSetName: 'countries',
                    Multiple: false,
                    ShowSelectedIcon: true
                }),
                layoutLocation: '.layout-bottom',
                displayOrder: 5,
                readonly: false,
                required: true
            },
            {
                name: 'terms-accepted',
                title: 'I accept the Terms and Conditions',
                type: 'Toggle',
                attributes: JSON.stringify({
                    DataOn: 'Accepted',
                    DataOff: 'Not Accepted',
                    Default: false
                }),
                layoutLocation: '.layout-bottom',
                displayOrder: 6,
                readonly: false,
                required: true
            },
            {
                name: 'newsletter',
                title: 'Subscribe to Newsletter',
                type: 'Toggle',
                attributes: JSON.stringify({
                    DataOn: 'Yes',
                    DataOff: 'No',
                    Default: true
                }),
                layoutLocation: '.layout-bottom',
                displayOrder: 7,
                readonly: false,
                required: false
            }
        ];
    }

    /**
     * Acquisition Details form template (Real Estate)
     * Based on ShareDo KB example
     */
    private getAcquisitionFormFields(): FormField[] {
        return [
            {
                name: 'property-address',
                title: 'Property Address',
                type: 'Textarea',
                attributes: JSON.stringify({
                    Placeholder: 'Enter full property address',
                    Rows: 3,
                    ChronologyCard: true
                }),
                layoutLocation: '.layout-top',
                displayOrder: 0,
                readonly: false,
                required: true
            },
            {
                name: 'acquisition-date',
                title: 'Acquisition Date',
                type: 'Date',
                attributes: JSON.stringify({
                    ChronologyCard: true
                }),
                layoutLocation: '.layout-top',
                displayOrder: 1,
                readonly: false,
                required: true
            },
            {
                name: 'property-price',
                title: 'Property Price',
                type: 'Currency',
                attributes: JSON.stringify({
                    Prefix: '£',
                    Suffix: '',
                    DecimalPlaces: 2,
                    ChronologyCard: true
                }),
                layoutLocation: '.layout-top',
                displayOrder: 2,
                readonly: false,
                required: true
            },
            {
                name: 'property-valuation',
                title: 'Property Valuation',
                type: 'Currency',
                attributes: JSON.stringify({
                    Prefix: '£',
                    Suffix: '',
                    DecimalPlaces: 2
                }),
                layoutLocation: '.layout-top',
                displayOrder: 3,
                readonly: false,
                required: false
            },
            {
                name: 'deposit',
                title: 'Deposit',
                type: 'Currency',
                attributes: JSON.stringify({
                    Prefix: '£',
                    Suffix: '',
                    DecimalPlaces: 2
                }),
                layoutLocation: '.layout-top',
                displayOrder: 4,
                readonly: false,
                required: true
            },
            {
                name: 'vat',
                title: 'VAT',
                type: 'Currency',
                attributes: JSON.stringify({
                    Prefix: '£',
                    Suffix: '',
                    DecimalPlaces: 2
                }),
                layoutLocation: '.layout-bottom',
                displayOrder: 5,
                readonly: false,
                required: false
            },
            {
                name: 'mortgage-advance',
                title: 'Mortgage Advance',
                type: 'Currency',
                attributes: JSON.stringify({
                    Prefix: '£',
                    Suffix: '',
                    DecimalPlaces: 2
                }),
                layoutLocation: '.layout-bottom',
                displayOrder: 6,
                readonly: false,
                required: false
            },
            {
                name: 'sdlt-payable',
                title: 'SDLT Payable',
                type: 'OptionSetPicker',
                attributes: JSON.stringify({
                    OptionSetName: 'yes-or-no',
                    Multiple: false,
                    Default: 'yes'
                }),
                layoutLocation: '.layout-bottom',
                displayOrder: 7,
                readonly: false,
                required: true
            },
            {
                name: 'exclusive',
                title: 'Exclusive',
                type: 'OptionSetPicker',
                attributes: JSON.stringify({
                    OptionSetName: 'yes-or-no',
                    Multiple: false
                }),
                layoutLocation: '.layout-bottom',
                displayOrder: 8,
                readonly: false,
                required: false
            },
            {
                name: 'property-type',
                title: 'Property Type',
                type: 'OptionSetPicker',
                attributes: JSON.stringify({
                    OptionSetName: 'property-types',
                    Multiple: false,
                    ShowSelectedIcon: true
                }),
                layoutLocation: '.layout-bottom',
                displayOrder: 9,
                readonly: false,
                required: true
            },
            {
                name: 'completion-date',
                title: 'Completion Date',
                type: 'Date',
                attributes: JSON.stringify({
                    Min: 'today'
                }),
                layoutLocation: '.layout-bottom',
                displayOrder: 10,
                readonly: false,
                required: false
            }
        ];
    }

    /**
     * Legal Matter form template
     */
    private getLegalFormFields(): FormField[] {
        return [
            {
                name: 'matter-number',
                title: 'Matter Number',
                type: 'Text',
                attributes: JSON.stringify({
                    Placeholder: 'MAT-YYYY-XXXX',
                    Pattern: '^MAT-\\d{4}-\\d{4}$',
                    PatternMessage: 'Format: MAT-YYYY-XXXX',
                    ChronologyCard: true
                }),
                layoutLocation: '.layout-top',
                displayOrder: 0,
                readonly: false,
                required: true
            },
            {
                name: 'client-name',
                title: 'Client Name',
                type: 'Text',
                attributes: JSON.stringify({
                    Placeholder: 'Enter client full name',
                    MaxLength: 200,
                    ChronologyCard: true
                }),
                layoutLocation: '.layout-top',
                displayOrder: 1,
                readonly: false,
                required: true
            },
            {
                name: 'matter-type',
                title: 'Matter Type',
                type: 'OptionSetPicker',
                attributes: JSON.stringify({
                    OptionSetName: 'legal-matter-types',
                    Multiple: false,
                    ShowSelectedIcon: true,
                    ChronologyCard: true
                }),
                layoutLocation: '.layout-top',
                displayOrder: 2,
                readonly: false,
                required: true
            },
            {
                name: 'jurisdiction',
                title: 'Jurisdiction',
                type: 'OptionSetPicker',
                attributes: JSON.stringify({
                    OptionSetName: 'jurisdictions',
                    Multiple: false
                }),
                layoutLocation: '.layout-top',
                displayOrder: 3,
                readonly: false,
                required: true
            },
            {
                name: 'matter-value',
                title: 'Matter Value',
                type: 'Currency',
                attributes: JSON.stringify({
                    Prefix: '£',
                    Suffix: '',
                    DecimalPlaces: 2
                }),
                layoutLocation: '.layout-top',
                displayOrder: 4,
                readonly: false,
                required: false
            },
            {
                name: 'fee-arrangement',
                title: 'Fee Arrangement',
                type: 'OptionSetPicker',
                attributes: JSON.stringify({
                    OptionSetName: 'fee-arrangements',
                    Multiple: false
                }),
                layoutLocation: '.layout-bottom',
                displayOrder: 5,
                readonly: false,
                required: true
            },
            {
                name: 'hourly-rate',
                title: 'Hourly Rate',
                type: 'Currency',
                attributes: JSON.stringify({
                    Prefix: '£',
                    Suffix: '/hr',
                    DecimalPlaces: 2
                }),
                layoutLocation: '.layout-bottom',
                displayOrder: 6,
                readonly: false,
                required: false
            },
            {
                name: 'conflict-check',
                title: 'Conflict Check Completed',
                type: 'Toggle',
                attributes: JSON.stringify({
                    DataOn: 'Yes',
                    DataOff: 'No',
                    Default: false,
                    ChronologyCard: true
                }),
                layoutLocation: '.layout-bottom',
                displayOrder: 7,
                readonly: false,
                required: true
            },
            {
                name: 'aml-check',
                title: 'AML Check Completed',
                type: 'Toggle',
                attributes: JSON.stringify({
                    DataOn: 'Yes',
                    DataOff: 'No',
                    Default: false,
                    ChronologyCard: true
                }),
                layoutLocation: '.layout-bottom',
                displayOrder: 8,
                readonly: false,
                required: true
            },
            {
                name: 'matter-description',
                title: 'Matter Description',
                type: 'Textarea',
                attributes: JSON.stringify({
                    Placeholder: 'Provide a detailed description of the matter...',
                    Rows: 5
                }),
                layoutLocation: '.layout-bottom',
                displayOrder: 9,
                readonly: false,
                required: true
            },
            {
                name: 'risk-assessment',
                title: 'Risk Assessment',
                type: 'OptionSetPicker',
                attributes: JSON.stringify({
                    OptionSetName: 'risk-levels',
                    Multiple: false,
                    ShowSelectedColour: true
                }),
                layoutLocation: '.layout-bottom',
                displayOrder: 10,
                readonly: false,
                required: true
            },
            {
                name: 'estimated-completion',
                title: 'Estimated Completion Date',
                type: 'Date',
                attributes: JSON.stringify({
                    Min: 'today'
                }),
                layoutLocation: '.layout-bottom',
                displayOrder: 11,
                readonly: false,
                required: false
            }
        ];
    }

    /**
     * Get all available templates
     */
    getAvailableTemplates(): { label: string; value: string; description: string }[] {
        return [
            {
                label: 'Blank Form',
                value: 'blank',
                description: 'Start with an empty form'
            },
            {
                label: 'Contact Form',
                value: 'contact',
                description: 'Basic contact information form'
            },
            {
                label: 'Registration Form',
                value: 'registration',
                description: 'User registration with validation'
            },
            {
                label: 'Acquisition Details',
                value: 'acquisition',
                description: 'Real estate property acquisition form'
            },
            {
                label: 'Legal Matter Form',
                value: 'legal',
                description: 'Legal case management form'
            }
        ];
    }
}