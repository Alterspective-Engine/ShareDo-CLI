/**
 * Enhanced High-Level Design Document Generator Service
 * 
 * Generates comprehensive HLD documents with detailed work-type specifications including:
 * - Title and Reference Generators
 * - Phase Models and Transitions
 * - Phase Guards and Triggers
 * - Role Security Permissions
 * - Key Dates Configuration
 * - Workflow Documentation
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { 
    Document, 
    Packer, 
    Paragraph, 
    TextRun, 
    HeadingLevel,
    AlignmentType,
    PageBreak,
    Table,
    TableRow,
    TableCell,
    WidthType,
    BorderStyle,
    ShadingType,
    Header,
    Footer,
    PageNumber,
    SectionType,
    convertInchesToTwip,
    NumberFormat,
    TabStopType,
    TabStopPosition,
    UnderlineType,
    ImageRun
} from 'docx';
import { SharedoClient } from '../sharedoClient';
import { IWorkType } from '../Request/WorkTypes/IGetWorkTypesRequestResult';
import { IParticipantRole } from '../Request/ParticipantRoles/IGetParticipantRolesResult';
import { IGetWorkTypeCreatePermissionResult } from '../Request/WorkTypes/IGetWorkTypeCreatePermissionResult';
import { Inform } from '../Utilities/inform';
import { SimpleDiagramGenerator } from './SimpleDiagramGenerator';
import { WorkTypeDataExtractor } from './WorkTypeDataExtractor';

// Enhanced interfaces for comprehensive HLD data
export interface IEnhancedHLDData {
    metadata: IHLDMetadata;
    workType: IWorkTypeDetails;
    derivedTypes: IWorkType[];
    participantRoles: IParticipantRole[];
    createPermissions: IGetWorkTypeCreatePermissionResult[];
    titleGenerator?: ITitleGenerator;
    referenceGenerator?: IReferenceGenerator;
    phaseModel?: IPhaseModel;
    triggers?: ITrigger[];
    keyDates?: IKeyDate[];
    workflows?: IWorkflowDetails[];
    aspects?: any[];
    forms?: IFormDetails[];
    templates?: ITemplateDetails[];
    businessRules?: IBusinessRule[];
    integrations?: IIntegrationDetails[];
    optionSets?: any[];
}

export interface IHLDMetadata {
    title: string;
    version: string;
    author: string;
    createdDate: Date;
    lastModified: Date;
    serverUrl: string;
    documentId: string;
    classification: string;
    confidentiality: string;
}

export interface IWorkTypeDetails {
    name: string;
    systemName: string;
    description: string;
    isActive: boolean;
    isAbstract: boolean;
    isCoreType: boolean;
    hasPortals: boolean;
    tileColour?: string;
    icon: string;
    systemNamePath: string;
    category?: string;
    tags?: string[];
    owner?: string;
    version?: string;
}

export interface ITitleGenerator {
    pattern: string;
    description: string;
    fields: ITitleField[];
    example: string;
    uniqueConstraints?: string[];
}

export interface ITitleField {
    name: string;
    type: string;
    source: string;
    format?: string;
    required: boolean;
}

export interface IReferenceGenerator {
    pattern: string;
    description: string;
    prefix: string;
    suffix?: string;
    sequenceType: string;
    sequenceStart: number;
    sequenceIncrement: number;
    resetPeriod?: string;
    example: string;
}

export interface IPhaseModel {
    name: string;
    description: string;
    phases: IPhase[];
    transitions: IPhaseTransition[];
    initialPhase: string;
    finalPhases: string[];
}

export interface IPhase {
    name: string;
    systemName: string;
    description: string;
    order: number;
    color?: string;
    isInitial: boolean;
    isFinal: boolean;
    allowedActions: string[];
    restrictions?: string[];
    sla?: ISLA;
}

export interface IPhaseTransition {
    name: string;
    fromPhase: string;
    toPhase: string;
    condition?: string;
    guards: IPhaseGuard[];
    triggers?: string[];
    automaticTransition: boolean;
    requiresApproval: boolean;
    approvalRoles?: string[];
}

export interface IPhaseGuard {
    name: string;
    type: string;
    condition: string;
    errorMessage: string;
    severity: 'error' | 'warning' | 'info';
}

export interface ITrigger {
    name: string;
    type: string;
    event: string;
    condition?: string;
    action: string;
    targetWorkflow?: string;
    parameters?: ITriggerParameter[];
    schedule?: string;
    enabled: boolean;
}

export interface ITriggerParameter {
    name: string;
    value: string;
    type: string;
    source: string;
}

export interface IKeyDate {
    name: string;
    systemName: string;
    description: string;
    type: string;
    calculation?: string;
    source?: string;
    format: string;
    required: boolean;
    editable: boolean;
    triggers?: string[];
    validations?: IDateValidation[];
}

export interface IDateValidation {
    type: string;
    condition: string;
    errorMessage: string;
}

export interface IWorkflowDetails {
    name: string;
    systemName: string;
    description: string;
    type: string;
    trigger?: string;
    steps: IWorkflowStep[];
    inputs?: IWorkflowParameter[];
    outputs?: IWorkflowParameter[];
    errorHandling?: string;
    retryPolicy?: string;
}

export interface IWorkflowStep {
    order: number;
    name: string;
    type: string;
    action: string;
    condition?: string;
    parameters?: IWorkflowParameter[];
    onSuccess?: string;
    onFailure?: string;
}

export interface IWorkflowParameter {
    name: string;
    type: string;
    required: boolean;
    defaultValue?: string;
    description?: string;
}

export interface IFormDetails {
    name: string;
    systemName: string;
    description: string;
    fields: IFormField[];
    validations?: IFormValidation[];
    layout?: string;
}

export interface IFormField {
    name: string;
    label: string;
    type: string;
    required: boolean;
    defaultValue?: string;
    validations?: IFormValidation[];
    helpText?: string;
}

export interface IFormValidation {
    type: string;
    condition: string;
    errorMessage: string;
}

export interface ITemplateDetails {
    name: string;
    type: string;
    description: string;
    usage: string;
    fields?: string[];
}

export interface IBusinessRule {
    name: string;
    description: string;
    condition: string;
    action: string;
    priority: number;
    enabled: boolean;
}

export interface IIntegrationDetails {
    name: string;
    type: string;
    endpoint?: string;
    method?: string;
    authentication?: string;
    dataMapping?: any;
}

export interface ISLA {
    duration: number;
    unit: string;
    escalation?: string;
}

export class EnhancedHLDDocumentGenerator {
    private static instance: EnhancedHLDDocumentGenerator;

    private constructor() {
        // SimpleDiagramGenerator will be used directly in methods as needed
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): EnhancedHLDDocumentGenerator {
        if (!EnhancedHLDDocumentGenerator.instance) {
            EnhancedHLDDocumentGenerator.instance = new EnhancedHLDDocumentGenerator();
        }
        return EnhancedHLDDocumentGenerator.instance;
    }

    /**
     * Generate enhanced HLD document for a work-type
     */
    public async generateHLD(workType: IWorkType, server: SharedoClient, skipDataExtraction = false): Promise<Buffer> {
        try {
            Inform.writeInfo(`Generating enhanced HLD document for work-type: ${workType.name}`);
            
            // Collect all enhanced data
            const data = await this.collectEnhancedWorkTypeData(workType, server, skipDataExtraction);
            
            // Create comprehensive document
            const doc = await this.createEnhancedDocument(data);
            
            // Generate buffer
            const buffer = await Packer.toBuffer(doc);
            
            Inform.writeInfo(`Enhanced HLD document generated successfully for ${workType.name}`);
            return buffer;
            
        } catch (error) {
            Inform.writeError('EnhancedHLDDocumentGenerator.generateHLD', error);
            throw error;
        }
    }

    /**
     * Generate enhanced HLD document with diagrams exported as separate files
     */
    public async generateHLDWithDiagrams(
        workType: IWorkType, 
        server: SharedoClient, 
        outputPath: string
    ): Promise<Buffer> {
        try {
            Inform.writeInfo(`Generating enhanced HLD document with diagrams for work-type: ${workType.name}`);
            
            // Collect all enhanced data
            const data = await this.collectEnhancedWorkTypeData(workType, server);
            
            // Export diagrams as separate SVG files
            await this.exportDiagrams(data, outputPath);
            
            // Create comprehensive document
            const doc = await this.createEnhancedDocument(data);
            
            // Generate buffer
            const buffer = await Packer.toBuffer(doc);
            
            Inform.writeInfo(`Enhanced HLD document with diagrams generated successfully for ${workType.name}`);
            return buffer;
            
        } catch (error) {
            Inform.writeError('EnhancedHLDDocumentGenerator.generateHLDWithDiagrams', error);
            throw error;
        }
    }

    /**
     * Export diagrams as separate SVG files
     */
    private async exportDiagrams(data: IEnhancedHLDData, outputPath: string): Promise<void> {
        try {
            const diagramGenerator = SimpleDiagramGenerator.getInstance();
            const dirPath = path.dirname(outputPath);
            const basename = path.basename(outputPath, '.docx');
            
            // Export phase model diagram
            if (data.phaseModel && data.phaseModel.phases) {
                const phaseModelDataUrl = diagramGenerator.generatePhaseModelDataUrl(
                    data.phaseModel.phases,
                    data.phaseModel.transitions || []
                );
                // Decode base64 to get SVG string
                const base64Data = phaseModelDataUrl.split(',')[1];
                const svgData = Buffer.from(base64Data, 'base64').toString('utf-8');
                
                // Sanitize filename
                const safeBasename = basename.replace(/[^a-zA-Z0-9_-]/g, '_');
                const phaseModelPath = path.join(dirPath, `${safeBasename}_phase_model.svg`);
                await fs.promises.writeFile(phaseModelPath, svgData, 'utf-8');
                Inform.writeInfo(`Phase model diagram saved to: ${phaseModelPath}`);
            }
            
            // Export workflow diagrams
            if (data.workflows && data.workflows.length > 0) {
                const safeBasename = basename.replace(/[^a-zA-Z0-9_-]/g, '_');
                for (let i = 0; i < data.workflows.length; i++) {
                    const workflow = data.workflows[i];
                    const workflowDataUrl = diagramGenerator.generateWorkflowDataUrl(workflow);
                    
                    // Decode base64 to get SVG string
                    const base64Data = workflowDataUrl.split(',')[1];
                    const svgData = Buffer.from(base64Data, 'base64').toString('utf-8');
                    
                    // Sanitize workflow name for filename
                    const workflowName = (workflow.systemName || `workflow_${i}`).replace(/[^a-zA-Z0-9_-]/g, '_');
                    const workflowPath = path.join(dirPath, `${safeBasename}_${workflowName}.svg`);
                    await fs.promises.writeFile(workflowPath, svgData, 'utf-8');
                    Inform.writeInfo(`Workflow diagram saved to: ${workflowPath}`);
                }
            }
        } catch (error) {
            console.error('Failed to export diagrams:', error);
            // Don't throw - diagrams are optional enhancement
        }
    }

    /**
     * Collect all enhanced work-type related data using REAL APIs
     */
    private async collectEnhancedWorkTypeData(workType: IWorkType, server: SharedoClient, skipDataExtraction = false): Promise<IEnhancedHLDData> {
        Inform.writeInfo(`\n${'='.repeat(60)}`);
        Inform.writeInfo(`📄 HLD Generation Started for: ${workType.name}`);
        Inform.writeInfo(`${'='.repeat(60)}`);
        const metadata: IHLDMetadata = {
            title: `High-Level Design: ${workType.name}`,
            version: '2.0',
            author: vscode.env.machineId || 'ShareDo VS Code Extension',
            createdDate: new Date(),
            lastModified: new Date(),
            serverUrl: server.url,
            documentId: `HLD-${workType.systemName}-${Date.now()}`,
            classification: 'Internal',
            confidentiality: 'Confidential'
        };

        const workTypeDetails: IWorkTypeDetails = {
            name: workType.name,
            systemName: workType.systemName,
            description: workType.description || 'No description provided',
            isActive: workType.isActive,
            isAbstract: workType.isAbstract,
            isCoreType: workType.isCoreType,
            hasPortals: workType.hasPortals,
            tileColour: workType.tileColour,
            icon: workType.icon,
            systemNamePath: workType.systemNamePath,
            category: 'Business Process',
            tags: ['workflow', 'automation'],
            owner: 'System Administrator',
            version: '1.0.0'
        };

        let realData: any;
        
        if (skipDataExtraction) {
            // Skip the data extraction - use the workType data directly
            Inform.writeInfo(`⚡ Skipping data extraction - using Playwright export data`);
            realData = {
                exportMethod: 'playwright-export',
                extractedAt: new Date(),
                isRealData: true,
                derivedTypes: workType.derivedTypes || [],
                participantRoles: [],
                createPermissions: [],
                titleGenerator: null,
                referenceGenerator: null,
                formDesign: null,
                businessRules: [],
                workflowProcess: null,
                permissions: null,
                businessIntelligence: null,
                automations: [],
                integrations: [],
                notifications: [],
                advancedConfigurations: null
            };
        } else {
            // Use WorkTypeDataExtractor to get REAL data from APIs
            const extractor = WorkTypeDataExtractor.getInstance();
            realData = await extractor.extractWorkTypeConfiguration(workType, server);
            
            // Show which method was used
            if (realData.exportMethod === 'package-export') {
                Inform.writeInfo(`✅ Data retrieved using Package Export API`);
                vscode.window.showInformationMessage(`HLD data retrieved via Package Export API`);
            } else if (realData.exportMethod === 'individual-apis') {
                Inform.writeInfo(`✅ Data retrieved using individual APIs (fallback)`);
                vscode.window.showInformationMessage(`HLD data retrieved via individual APIs`);
            }
        }
        
        // Show which method was used
        if (realData.exportMethod === 'package-export') {
            Inform.writeInfo(`✅ Data retrieved using Package Export API`);
            vscode.window.showInformationMessage(`HLD data retrieved via Package Export API`);
        } else if (realData.exportMethod === 'individual-apis') {
            Inform.writeInfo(`✅ Data retrieved using individual APIs (fallback)`);
            vscode.window.showInformationMessage(`HLD data retrieved via individual APIs`);
        }
        
        Inform.writeInfo(`${'='.repeat(60)}`);
        Inform.writeInfo(`📊 Data Collection Summary:`);
        Inform.writeInfo(`   - Method: ${realData.exportMethod || 'unknown'}`);
        Inform.writeInfo(`   - Export Time: ${realData.extractedAt || new Date()}`);
        Inform.writeInfo(`   - Real Data: ${realData.isRealData ? 'Yes' : 'No'}`);
        Inform.writeInfo(`${'='.repeat(60)}\n`);
        
        // Use ONLY real data - no fallback to mocks
        return {
            metadata,
            workType: workTypeDetails,
            derivedTypes: realData.derivedTypes || workType.derivedTypes || [],
            participantRoles: realData.participantRoles || [],
            createPermissions: realData.createPermissions || [],
            titleGenerator: realData.titleGenerator || null,
            referenceGenerator: realData.referenceGenerator || null,
            phaseModel: realData.phaseModel || null,
            triggers: realData.triggers || [],
            keyDates: realData.keyDates || [],
            workflows: realData.workflows || [],
            businessRules: realData.businessRules || [],
            forms: realData.forms || [],
            templates: realData.templates || [],
            aspects: realData.aspects ? [realData.aspects] : [],
            optionSets: realData.optionSets || []
        };
    }

    /**
     * Create the enhanced Word document
     */
    private async createEnhancedDocument(data: IEnhancedHLDData): Promise<Document> {
        const doc = new Document({
            creator: data.metadata.author,
            title: data.metadata.title,
            description: `Enhanced High-Level Design document for ${data.workType.name}`,
            styles: this.getEnhancedDocumentStyles(),
            numbering: this.getNumberingConfig(),
            sections: [
                // Cover page section
                {
                    properties: {
                        type: SectionType.NEXT_PAGE,
                        page: {
                            margin: {
                                top: convertInchesToTwip(1),
                                bottom: convertInchesToTwip(1),
                                left: convertInchesToTwip(1.25),
                                right: convertInchesToTwip(1.25)
                            }
                        }
                    },
                    children: this.createEnhancedCoverPage(data)
                },
                // Main content section
                {
                    properties: {
                        type: SectionType.NEXT_PAGE,
                        page: {
                            margin: {
                                top: convertInchesToTwip(1),
                                bottom: convertInchesToTwip(1),
                                left: convertInchesToTwip(1.25),
                                right: convertInchesToTwip(1.25)
                            }
                        }
                    },
                    headers: {
                        default: this.createHeader(data)
                    },
                    footers: {
                        default: this.createFooter()
                    },
                    children: [
                        ...this.createTableOfContents(),
                        ...this.createExecutiveSummary(data),
                        ...this.createSystemOverview(data),
                        ...this.createTitleReferenceSection(data),
                        ...await this.createPhaseModelSection(data),
                        ...this.createTriggersSection(data),
                        ...this.createKeyDatesSection(data),
                        ...await this.createWorkflowsSection(data),
                        ...this.createSecurityModelSection(data),
                        ...this.createBusinessRulesSection(data),
                        ...this.createFormsTemplatesSection(data),
                        ...this.createIntegrationSection(data),
                        ...this.createAppendices(data)
                    ]
                }
            ]
        });

        return doc;
    }

    /**
     * Create enhanced cover page
     */
    private createEnhancedCoverPage(data: IEnhancedHLDData): (Paragraph | Table)[] {
        return [
            new Paragraph({
                text: '',
                spacing: { before: convertInchesToTwip(1.5) }
            }),
            new Paragraph({
                text: 'HIGH-LEVEL DESIGN DOCUMENT',
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 }
            }),
            new Paragraph({
                text: 'COMPREHENSIVE TECHNICAL SPECIFICATION',
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 }
            }),
            new Paragraph({
                text: data.workType.name,
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 }
            }),
            new Paragraph({
                text: `System Name: ${data.workType.systemName}`,
                alignment: AlignmentType.CENTER,
                spacing: { after: 100 }
            }),
            new Paragraph({
                text: `Version: ${data.metadata.version}`,
                alignment: AlignmentType.CENTER,
                spacing: { after: 600 }
            }),
            new Paragraph({
                text: '',
                spacing: { before: convertInchesToTwip(0.5) }
            }),
            this.createEnhancedInfoTable(data),
            new Paragraph({
                text: '',
                spacing: { before: convertInchesToTwip(1.5) }
            }),
            new Paragraph({
                text: `Classification: ${data.metadata.classification}`,
                alignment: AlignmentType.CENTER,
                spacing: { after: 100 }
            }),
            new Paragraph({
                text: `Confidentiality: ${data.metadata.confidentiality}`,
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 }
            }),
            new Paragraph({
                text: 'Generated by ShareDo VS Code Extension',
                alignment: AlignmentType.CENTER,
                spacing: { after: 100 }
            }),
            new Paragraph({
                text: data.metadata.createdDate.toLocaleDateString(),
                alignment: AlignmentType.CENTER
            })
        ];
    }

    /**
     * Create enhanced document info table
     */
    private createEnhancedInfoTable(data: IEnhancedHLDData): Table {
        return new Table({
            width: {
                size: 100,
                type: WidthType.PERCENTAGE
            },
            borders: {
                top: { style: BorderStyle.SINGLE, size: 1 },
                bottom: { style: BorderStyle.SINGLE, size: 1 },
                left: { style: BorderStyle.SINGLE, size: 1 },
                right: { style: BorderStyle.SINGLE, size: 1 }
            },
            rows: [
                this.createInfoRow('Document Version', data.metadata.version),
                this.createInfoRow('Server', data.metadata.serverUrl),
                this.createInfoRow('Work-Type Category', data.workType.category || 'N/A'),
                this.createInfoRow('Owner', data.workType.owner || 'System'),
                this.createInfoRow('Status', data.workType.isActive ? 'Active' : 'Inactive'),
                this.createInfoRow('Created Date', data.metadata.createdDate.toLocaleString()),
                this.createInfoRow('Document ID', data.metadata.documentId)
            ]
        });
    }

    /**
     * Create Title and Reference Generators section
     */
    private createTitleReferenceSection(data: IEnhancedHLDData): (Paragraph | Table)[] {
        const paragraphs: (Paragraph | Table)[] = [
            new Paragraph({
                text: '3. Title and Reference Configuration',
                heading: HeadingLevel.HEADING_1,
                numbering: { reference: 'default-numbering', level: 0 },
                pageBreakBefore: true
            })
        ];

        // Title Generator
        if (data.titleGenerator) {
            paragraphs.push(
                new Paragraph({
                    text: '3.1 Title Generator',
                    heading: HeadingLevel.HEADING_2,
                    numbering: { reference: 'default-numbering', level: 1 }
                }),
                new Paragraph({
                    text: `Pattern: ${data.titleGenerator.pattern}`,
                    spacing: { after: 100 }
                }),
                new Paragraph({
                    text: `Description: ${data.titleGenerator.description}`,
                    spacing: { after: 100 }
                }),
                new Paragraph({
                    text: `Example: ${data.titleGenerator.example}`,
                    spacing: { after: 200 }
                })
            );

            if (data.titleGenerator.fields && data.titleGenerator.fields.length > 0) {
                paragraphs.push(
                    new Paragraph({
                        children: [
                            new TextRun({ text: 'Title Fields:', bold: true })
                        ],
                        spacing: { after: 100 }
                    })
                );

                const fieldsTable = this.createTitleFieldsTable(data.titleGenerator.fields);
                paragraphs.push(fieldsTable);
            }
        }

        // Reference Generator
        if (data.referenceGenerator) {
            paragraphs.push(
                new Paragraph({
                    text: '3.2 Reference Generator',
                    heading: HeadingLevel.HEADING_2,
                    numbering: { reference: 'default-numbering', level: 1 },
                    spacing: { before: 400 }
                }),
                new Paragraph({
                    text: `Pattern: ${data.referenceGenerator.pattern}`,
                    spacing: { after: 100 }
                }),
                new Paragraph({
                    text: `Prefix: ${data.referenceGenerator.prefix}`,
                    spacing: { after: 100 }
                }),
                new Paragraph({
                    text: `Sequence Type: ${data.referenceGenerator.sequenceType}`,
                    spacing: { after: 100 }
                }),
                new Paragraph({
                    text: `Starting Number: ${data.referenceGenerator.sequenceStart}`,
                    spacing: { after: 100 }
                }),
                new Paragraph({
                    text: `Example: ${data.referenceGenerator.example}`,
                    spacing: { after: 200 }
                })
            );
        }

        return paragraphs;
    }

    /**
     * Create Phase Model section with visual diagram
     */
    private async createPhaseModelSection(data: IEnhancedHLDData): Promise<(Paragraph | Table | any)[]> {
        const paragraphs: (Paragraph | Table)[] = [
            new Paragraph({
                text: '4. Phase Model and Transitions',
                heading: HeadingLevel.HEADING_1,
                numbering: { reference: 'default-numbering', level: 0 },
                pageBreakBefore: true
            })
        ];

        if (data.phaseModel) {
            paragraphs.push(
                new Paragraph({
                    text: `Model Name: ${data.phaseModel.name}`,
                    spacing: { after: 100 }
                }),
                new Paragraph({
                    text: `Description: ${data.phaseModel.description}`,
                    spacing: { after: 200 }
                })
            );

            // Add Phase Model Visualization
            try {
                const diagramGenerator = SimpleDiagramGenerator.getInstance();
                const phaseModelDataUrl = diagramGenerator.generatePhaseModelDataUrl(
                    data.phaseModel.phases || [],
                    data.phaseModel.transitions || []
                );
                
                paragraphs.push(
                    new Paragraph({
                        text: '4.1 Phase Model Visualization',
                        heading: HeadingLevel.HEADING_2,
                        numbering: { reference: 'default-numbering', level: 1 },
                        spacing: { before: 200, after: 100 }
                    }),
                    new Paragraph({
                        text: 'Visual Representation of Phase Flow:',
                        spacing: { after: 100 }
                    })
                );

                // Create ASCII representation of phase model
                const phases = data.phaseModel.phases || [];
                const transitions = data.phaseModel.transitions || [];
                
                // Add phase flow diagram
                paragraphs.push(
                    new Paragraph({
                        children: [
                            new TextRun({ 
                                text: '┌─────────────────────────────────────────────────────────────┐',
                                font: { name: 'Courier New' }
                            })
                        ],
                        spacing: { before: 100 }
                    })
                );
                
                phases.forEach((phase, index) => {
                    const phaseLabel = `│ ${phase.isInitial ? '[START] ' : ''}${phase.name}${phase.isFinal ? ' [END]' : ''}`;
                    paragraphs.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: phaseLabel.padEnd(63) + '│',
                                    font: { name: 'Courier New' }
                                })
                            ]
                        })
                    );
                    
                    // Show transitions from this phase
                    const fromTransitions = transitions.filter(t => t.fromPhase === phase.systemName);
                    if (fromTransitions.length > 0 && index < phases.length - 1) {
                        paragraphs.push(
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: '│       ↓                                                      │',
                                        font: { name: 'Courier New' }
                                    })
                                ]
                            })
                        );
                        fromTransitions.forEach(t => {
                            const guard = t.guards && t.guards.length > 0 ? ` [Guard: ${t.guards[0]}]` : '';
                            const approval = t.requiresApproval ? ' [Requires Approval]' : '';
                            paragraphs.push(
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: `│   → ${t.name}${guard}${approval}`.padEnd(63) + '│',
                                            font: { name: 'Courier New' }
                                        })
                                    ]
                                })
                            );
                        });
                        if (index < phases.length - 1) {
                            paragraphs.push(
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: '│       ↓                                                      │',
                                            font: { name: 'Courier New' }
                                        })
                                    ]
                                })
                            );
                        }
                    }
                });
                
                paragraphs.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: '└─────────────────────────────────────────────────────────────┘',
                                font: { name: 'Courier New' }
                            })
                        ],
                        spacing: { after: 200 }
                    })
                );
                
                // Add legend
                paragraphs.push(
                    new Paragraph({
                        children: [
                            new TextRun({ text: 'Legend:', bold: true })
                        ],
                        spacing: { before: 100, after: 50 }
                    }),
                    new Paragraph({
                        text: '• [START] - Initial phase',
                        bullet: { level: 0 }
                    }),
                    new Paragraph({
                        text: '• [END] - Final phase',
                        bullet: { level: 0 }
                    }),
                    new Paragraph({
                        text: '• [Guard] - Transition condition that must be met',
                        bullet: { level: 0 }
                    }),
                    new Paragraph({
                        text: '• [Requires Approval] - Manual approval needed',
                        bullet: { level: 0 },
                        spacing: { after: 200 }
                    })
                );
                
                // Note about SVG export
                paragraphs.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: 'Note: A detailed SVG diagram has been exported alongside this document for better visualization.',
                                italics: true,
                                color: '666666'
                            })
                        ],
                        spacing: { after: 200 }
                    })
                );
            } catch (error) {
                console.error('Failed to generate phase model diagram:', error);
            }

            // Phases
            if (data.phaseModel.phases && data.phaseModel.phases.length > 0) {
                paragraphs.push(
                    new Paragraph({
                        text: '4.2 Phases',
                        heading: HeadingLevel.HEADING_2,
                        numbering: { reference: 'default-numbering', level: 1 }
                    })
                );

                const phasesTable = this.createPhasesTable(data.phaseModel.phases);
                paragraphs.push(phasesTable);
            }

            // Transitions
            if (data.phaseModel.transitions && data.phaseModel.transitions.length > 0) {
                paragraphs.push(
                    new Paragraph({
                        text: '4.3 Phase Transitions',
                        heading: HeadingLevel.HEADING_2,
                        numbering: { reference: 'default-numbering', level: 1 },
                        spacing: { before: 400 }
                    })
                );

                for (const transition of data.phaseModel.transitions) {
                    paragraphs.push(
                        new Paragraph({
                            children: [
                                new TextRun({ text: transition.name, bold: true })
                            ],
                            spacing: { before: 200, after: 100 }
                        }),
                        new Paragraph({
                            text: `From: ${transition.fromPhase} → To: ${transition.toPhase}`,
                            spacing: { after: 100 }
                        })
                    );

                    if (transition.guards && transition.guards.length > 0) {
                        paragraphs.push(
                            new Paragraph({
                                text: 'Guards:',
                                spacing: { after: 50 }
                            })
                        );
                        
                        for (const guard of transition.guards) {
                            paragraphs.push(
                                new Paragraph({
                                    text: `• ${guard.name}: ${guard.condition}`,
                                    bullet: { level: 0 },
                                    spacing: { after: 50 }
                                })
                            );
                        }
                    }

                    if (transition.requiresApproval) {
                        paragraphs.push(
                            new Paragraph({
                                text: `Requires Approval: Yes`,
                                spacing: { after: 50 }
                            }),
                            new Paragraph({
                                text: `Approval Roles: ${transition.approvalRoles?.join(', ') || 'N/A'}`,
                                spacing: { after: 100 }
                            })
                        );
                    }
                }
            }
        }

        return paragraphs;
    }

    /**
     * Create Triggers section
     */
    private createTriggersSection(data: IEnhancedHLDData): (Paragraph | Table)[] {
        const paragraphs: (Paragraph | Table)[] = [
            new Paragraph({
                text: '5. Triggers and Automation',
                heading: HeadingLevel.HEADING_1,
                numbering: { reference: 'default-numbering', level: 0 },
                pageBreakBefore: true
            })
        ];

        if (data.triggers && data.triggers.length > 0) {
            paragraphs.push(
                new Paragraph({
                    text: 'The following triggers are configured for this work-type:',
                    spacing: { after: 200 }
                })
            );

            const triggersTable = this.createTriggersTable(data.triggers);
            paragraphs.push(triggersTable);

            // Document workflows triggered
            const workflowTriggers = data.triggers.filter(t => t.targetWorkflow);
            if (workflowTriggers.length > 0) {
                paragraphs.push(
                    new Paragraph({
                        text: '5.1 Triggered Workflows',
                        heading: HeadingLevel.HEADING_2,
                        numbering: { reference: 'default-numbering', level: 1 },
                        spacing: { before: 400 }
                    }),
                    new Paragraph({
                        text: 'The following workflows are automatically triggered:',
                        spacing: { after: 100 }
                    })
                );

                for (const trigger of workflowTriggers) {
                    paragraphs.push(
                        new Paragraph({
                            text: `• ${trigger.targetWorkflow} - Triggered by: ${trigger.event}`,
                            bullet: { level: 0 },
                            spacing: { after: 50 }
                        })
                    );
                }
            }
        }

        return paragraphs;
    }

    /**
     * Create Key Dates section
     */
    private createKeyDatesSection(data: IEnhancedHLDData): (Paragraph | Table)[] {
        const paragraphs: (Paragraph | Table)[] = [
            new Paragraph({
                text: '6. Key Dates Configuration',
                heading: HeadingLevel.HEADING_1,
                numbering: { reference: 'default-numbering', level: 0 },
                pageBreakBefore: true
            })
        ];

        if (data.keyDates && data.keyDates.length > 0) {
            paragraphs.push(
                new Paragraph({
                    text: 'The following key dates are configured:',
                    spacing: { after: 200 }
                })
            );

            const keyDatesTable = this.createKeyDatesTable(data.keyDates);
            paragraphs.push(keyDatesTable);

            // Document date-triggered actions
            const dateTriggers = data.keyDates.filter(d => d.triggers && d.triggers.length > 0);
            if (dateTriggers.length > 0) {
                paragraphs.push(
                    new Paragraph({
                        text: '6.1 Date-Triggered Actions',
                        heading: HeadingLevel.HEADING_2,
                        numbering: { reference: 'default-numbering', level: 1 },
                        spacing: { before: 400 }
                    })
                );

                for (const keyDate of dateTriggers) {
                    paragraphs.push(
                        new Paragraph({
                            children: [
                                new TextRun({ text: `${keyDate.name}:`, bold: true })
                            ],
                            spacing: { before: 100, after: 50 }
                        })
                    );
                    
                    for (const trigger of keyDate.triggers || []) {
                        paragraphs.push(
                            new Paragraph({
                                text: `• Triggers: ${trigger}`,
                                bullet: { level: 0 },
                                spacing: { after: 50 }
                            })
                        );
                    }
                }
            }
        }

        return paragraphs;
    }

    /**
     * Create Workflows section
     */
    private async createWorkflowsSection(data: IEnhancedHLDData): Promise<(Paragraph | Table)[]> {
        const paragraphs: (Paragraph | Table)[] = [
            new Paragraph({
                text: '7. Workflow Documentation',
                heading: HeadingLevel.HEADING_1,
                numbering: { reference: 'default-numbering', level: 0 },
                pageBreakBefore: true
            })
        ];

        if (data.workflows && data.workflows.length > 0) {
            paragraphs.push(
                new Paragraph({
                    text: 'The following workflows are associated with this work-type:',
                    spacing: { after: 200 }
                })
            );

            for (const workflow of data.workflows) {
                paragraphs.push(
                    new Paragraph({
                        text: workflow.name,
                        heading: HeadingLevel.HEADING_3,
                        spacing: { before: 300, after: 100 }
                    }),
                    new Paragraph({
                        text: `System Name: ${workflow.systemName}`,
                        spacing: { after: 50 }
                    }),
                    new Paragraph({
                        text: `Type: ${workflow.type}`,
                        spacing: { after: 50 }
                    }),
                    new Paragraph({
                        text: `Description: ${workflow.description}`,
                        spacing: { after: 100 }
                    })
                );

                // Generate and add workflow diagram
                try {
                    const diagramGenerator = SimpleDiagramGenerator.getInstance();
                    const workflowDataUrl = diagramGenerator.generateWorkflowDataUrl(workflow);
                    
                    paragraphs.push(
                        new Paragraph({
                            children: [
                                new TextRun({ text: 'Workflow Diagram:', bold: true })
                            ],
                            spacing: { before: 100, after: 50 }
                        })
                    );
                    
                    // Create ASCII workflow representation
                    if (workflow.steps && workflow.steps.length > 0) {
                        paragraphs.push(
                            new Paragraph({
                                children: [new TextRun({ text: '┌──────────────────────────────────────────────┐', font: { name: 'Courier New' } })],
                                spacing: { before: 50 }
                            }),
                            new Paragraph({
                                children: [new TextRun({ text: `│  Workflow: ${workflow.name}`.padEnd(48) + '│', font: { name: 'Courier New' } })]
                            }),
                            new Paragraph({
                                children: [new TextRun({ text: '└──────────────────────────────────────────────┘', font: { name: 'Courier New' } })]
                            }),
                            new Paragraph({
                                children: [new TextRun({ text: '                    │', font: { name: 'Courier New' } })]
                            }),
                            new Paragraph({
                                children: [new TextRun({ text: '                    ▼', font: { name: 'Courier New' } })]
                            })
                        );
                        
                        workflow.steps.forEach((step, index) => {
                            const stepType = step.type || 'action';
                            const isDecision = stepType === 'branch' || stepType === 'decision';
                            const isWait = stepType === 'wait';
                            
                            if (isDecision) {
                                paragraphs.push(
                                    new Paragraph({ children: [new TextRun({ text: '              ◆─────────────◆', font: { name: 'Courier New' } })] }),
                                    new Paragraph({ children: [new TextRun({ text: `              │ ${step.name} │`, font: { name: 'Courier New' } })] }),
                                    new Paragraph({ children: [new TextRun({ text: '              ◆─────────────◆', font: { name: 'Courier New' } })] }),
                                    new Paragraph({ children: [new TextRun({ text: '              │            │', font: { name: 'Courier New' } })] }),
                                    new Paragraph({ children: [new TextRun({ text: '         [Success]    [Failure]', font: { name: 'Courier New' } })] })
                                );
                            } else if (isWait) {
                                paragraphs.push(
                                    new Paragraph({ children: [new TextRun({ text: '          ⏱───────────────────⏱', font: { name: 'Courier New' } })] }),
                                    new Paragraph({ children: [new TextRun({ text: `          │ ${step.name} │`, font: { name: 'Courier New' } })] }),
                                    new Paragraph({ children: [new TextRun({ text: '          ⏱───────────────────⏱', font: { name: 'Courier New' } })] })
                                );
                            } else {
                                paragraphs.push(
                                    new Paragraph({ children: [new TextRun({ text: '          ┌───────────────────┐', font: { name: 'Courier New' } })] }),
                                    new Paragraph({ children: [new TextRun({ text: `          │ Step ${index + 1}: ${step.name} │`, font: { name: 'Courier New' } })] }),
                                    new Paragraph({ children: [new TextRun({ text: `          │ Action: ${step.action || 'Execute'} │`, font: { name: 'Courier New' } })] }),
                                    new Paragraph({ children: [new TextRun({ text: '          └───────────────────┘', font: { name: 'Courier New' } })] })
                                );
                            }
                            
                            if (index < workflow.steps.length - 1) {
                                paragraphs.push(
                                    new Paragraph({ children: [new TextRun({ text: '                    │', font: { name: 'Courier New' } })] }),
                                    new Paragraph({ children: [new TextRun({ text: '                    ▼', font: { name: 'Courier New' } })] })
                                );
                            }
                        });
                        
                        paragraphs.push(
                            new Paragraph({ children: [new TextRun({ text: '                    │', font: { name: 'Courier New' } })] }),
                            new Paragraph({
                                children: [new TextRun({ text: '               [Complete]', font: { name: 'Courier New' } })],
                                spacing: { after: 100 }
                            })
                        );
                    }
                    
                    // Note about SVG export
                    paragraphs.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: 'Note: A detailed workflow diagram has been exported as an SVG file for better visualization.',
                                    italics: true,
                                    color: '666666'
                                })
                            ],
                            spacing: { after: 100 }
                        })
                    );
                } catch (error) {
                    Inform.writeInfo('Could not generate workflow diagram', error);
                }

                if (workflow.trigger) {
                    paragraphs.push(
                        new Paragraph({
                            text: `Triggered By: ${workflow.trigger}`,
                            spacing: { after: 100 }
                        })
                    );
                }

                if (workflow.steps && workflow.steps.length > 0) {
                    paragraphs.push(
                        new Paragraph({
                            children: [
                                new TextRun({ text: 'Workflow Steps:', bold: true })
                            ],
                            spacing: { after: 50 }
                        })
                    );

                    for (const step of workflow.steps) {
                        paragraphs.push(
                            new Paragraph({
                                text: `${step.order}. ${step.name} (${step.type})`,
                                spacing: { after: 25 }
                            }),
                            new Paragraph({
                                text: `   Action: ${step.action}`,
                                spacing: { after: 50 }
                            })
                        );
                    }
                }

                if (workflow.errorHandling) {
                    paragraphs.push(
                        new Paragraph({
                            text: `Error Handling: ${workflow.errorHandling}`,
                            spacing: { after: 50 }
                        })
                    );
                }

                if (workflow.retryPolicy) {
                    paragraphs.push(
                        new Paragraph({
                            text: `Retry Policy: ${workflow.retryPolicy}`,
                            spacing: { after: 100 }
                        })
                    );
                }
            }
        }

        return paragraphs;
    }

    /**
     * Create enhanced Security Model section
     */
    private createSecurityModelSection(data: IEnhancedHLDData): (Paragraph | Table)[] {
        const paragraphs: (Paragraph | Table)[] = [
            new Paragraph({
                text: '8. Security Model and Permissions',
                heading: HeadingLevel.HEADING_1,
                numbering: { reference: 'default-numbering', level: 0 },
                pageBreakBefore: true
            })
        ];

        // Participant Roles with detailed permissions
        if (data.participantRoles && data.participantRoles.length > 0) {
            paragraphs.push(
                new Paragraph({
                    text: '8.1 Participant Roles and Permissions',
                    heading: HeadingLevel.HEADING_2,
                    numbering: { reference: 'default-numbering', level: 1 }
                }),
                new Paragraph({
                    text: 'The following roles are defined with their security permissions:',
                    spacing: { after: 200 }
                })
            );

            for (const role of data.participantRoles) {
                paragraphs.push(
                    new Paragraph({
                        text: role.name,
                        heading: HeadingLevel.HEADING_3,
                        spacing: { before: 200, after: 100 }
                    }),
                    new Paragraph({
                        text: `System Name: ${role.systemName}`,
                        spacing: { after: 50 }
                    }),
                    new Paragraph({
                        text: `Status: ${role.isActive ? 'Active' : 'Inactive'}`,
                        spacing: { after: 50 }
                    })
                );

                if (role.permissions && role.permissions.length > 0) {
                    paragraphs.push(
                        new Paragraph({
                            children: [
                                new TextRun({ text: 'Permissions:', bold: true })
                            ],
                            spacing: { after: 50 }
                        })
                    );

                    const permissionsTable = this.createPermissionsTable(role.permissions);
                    paragraphs.push(permissionsTable);
                } else {
                    paragraphs.push(
                        new Paragraph({
                            children: [
                                new TextRun({ text: 'No specific permissions configured', italics: true })
                            ],
                            spacing: { after: 100 }
                        })
                    );
                }
            }
        }

        // Create Permissions
        if (data.createPermissions && data.createPermissions.length > 0) {
            paragraphs.push(
                new Paragraph({
                    text: '8.2 Work Item Creation Permissions',
                    heading: HeadingLevel.HEADING_2,
                    numbering: { reference: 'default-numbering', level: 1 },
                    spacing: { before: 400 }
                }),
                new Paragraph({
                    text: 'The following subjects can create instances of this work-type:',
                    spacing: { after: 200 }
                })
            );

            const createPermTable = this.createPermissionsCreationTable(data.createPermissions);
            paragraphs.push(createPermTable);
        }

        return paragraphs;
    }

    /**
     * Create Business Rules section
     */
    private createBusinessRulesSection(data: IEnhancedHLDData): (Paragraph | Table)[] {
        const paragraphs: (Paragraph | Table)[] = [
            new Paragraph({
                text: '9. Business Rules',
                heading: HeadingLevel.HEADING_1,
                numbering: { reference: 'default-numbering', level: 0 },
                pageBreakBefore: true
            })
        ];

        if (data.businessRules && data.businessRules.length > 0) {
            paragraphs.push(
                new Paragraph({
                    text: 'The following business rules are configured:',
                    spacing: { after: 200 }
                })
            );

            const rulesTable = this.createBusinessRulesTable(data.businessRules);
            paragraphs.push(rulesTable);
        }

        return paragraphs;
    }

    /**
     * Create Forms and Templates section
     */
    private createFormsTemplatesSection(data: IEnhancedHLDData): (Paragraph | Table)[] {
        const paragraphs: (Paragraph | Table)[] = [
            new Paragraph({
                text: '10. Forms and Templates',
                heading: HeadingLevel.HEADING_1,
                numbering: { reference: 'default-numbering', level: 0 },
                pageBreakBefore: true
            })
        ];

        // Forms with FULL field details
        if (data.forms && data.forms.length > 0) {
            paragraphs.push(
                new Paragraph({
                    text: '10.1 Forms',
                    heading: HeadingLevel.HEADING_2,
                    numbering: { reference: 'default-numbering', level: 1 }
                }),
                new Paragraph({
                    text: 'The following forms are configured for data capture and interaction:',
                    spacing: { after: 200 }
                })
            );

            for (const form of data.forms) {
                // Handle various possible property names from API
                const formName = (form as any).Name || (form as any).name || 'Unnamed Form';
                const formId = (form as any).Id || (form as any).id || (form as any).systemName || 'N/A';
                const formDescription = (form as any).Description || (form as any).description || 'No description';
                
                paragraphs.push(
                    new Paragraph({
                        text: formName,
                        heading: HeadingLevel.HEADING_3,
                        spacing: { before: 300, after: 100 }
                    }),
                    new Paragraph({
                        text: `Form ID: ${formId}`,
                        spacing: { after: 50 }
                    }),
                    new Paragraph({
                        text: `Description: ${formDescription}`,
                        spacing: { after: 100 }
                    })
                );

                // Create detailed fields table - handle various property structures
                const fields = (form as any).Fields || (form as any).fields || form.fields || [];
                if (fields && fields.length > 0) {
                    paragraphs.push(
                        new Paragraph({
                            children: [
                                new TextRun({ text: 'Form Fields:', bold: true })
                            ],
                            spacing: { before: 100, after: 50 }
                        })
                    );

                    const fieldsTable = this.createFormFieldsTable(fields);
                    paragraphs.push(fieldsTable);
                }

                // Add form configuration details if available
                const config = (form as any).Config || (form as any).config || {};
                const hasValidation = config.validation || (form as any).validation;
                const hasAutoSave = config.autoSave || (form as any).autoSave;
                const hasWorkflow = config.workflowEnabled || (form as any).workflowEnabled;
                
                if (Object.keys(config).length > 0 || hasValidation || hasAutoSave || hasWorkflow) {
                    paragraphs.push(
                        new Paragraph({
                            children: [
                                new TextRun({ text: 'Form Configuration:', bold: true })
                            ],
                            spacing: { before: 100, after: 50 }
                        }),
                        new Paragraph({
                            text: `• Validation: ${hasValidation ? 'Enabled' : 'Disabled'}`,
                            bullet: { level: 0 }
                        }),
                        new Paragraph({
                            text: `• Auto-save: ${hasAutoSave ? 'Enabled' : 'Disabled'}`,
                            bullet: { level: 0 }
                        }),
                        new Paragraph({
                            text: `• Workflow Integration: ${hasWorkflow ? 'Yes' : 'No'}`,
                            bullet: { level: 0 },
                            spacing: { after: 200 }
                        })
                    );
                }
            }
        } else {
            paragraphs.push(
                new Paragraph({
                    text: 'No forms configured for this work type.',
                    spacing: { after: 200 }
                })
            );
        }

        // Templates
        if (data.templates && data.templates.length > 0) {
            paragraphs.push(
                new Paragraph({
                    text: '10.2 Document Templates',
                    heading: HeadingLevel.HEADING_2,
                    numbering: { reference: 'default-numbering', level: 1 },
                    spacing: { before: 400 }
                })
            );

            for (const template of data.templates) {
                paragraphs.push(
                    new Paragraph({
                        text: `• ${template.name} (${template.type})`,
                        bullet: { level: 0 },
                        spacing: { after: 50 }
                    })
                );
            }
        }

        return paragraphs;
    }

    /**
     * Create Integration section
     */
    private createIntegrationSection(data: IEnhancedHLDData): (Paragraph | Table)[] {
        const paragraphs: (Paragraph | Table)[] = [
            new Paragraph({
                text: '11. Integration Architecture',
                heading: HeadingLevel.HEADING_1,
                numbering: { reference: 'default-numbering', level: 0 },
                pageBreakBefore: true
            }),
            new Paragraph({
                text: 'This work-type supports the following integration capabilities:',
                spacing: { after: 200 }
            }),
            new Paragraph({
                text: '• REST API endpoints for CRUD operations',
                bullet: { level: 0 }
            }),
            new Paragraph({
                text: '• Webhook notifications for state changes',
                bullet: { level: 0 }
            }),
            new Paragraph({
                text: '• Event-driven architecture for real-time updates',
                bullet: { level: 0 }
            }),
            new Paragraph({
                text: '• Batch processing capabilities',
                bullet: { level: 0 }
            }),
            new Paragraph({
                text: '• External system integration via triggers',
                bullet: { level: 0 },
                spacing: { after: 400 }
            })
        ];

        if (data.integrations && data.integrations.length > 0) {
            paragraphs.push(
                new Paragraph({
                    text: '11.1 Configured Integrations',
                    heading: HeadingLevel.HEADING_2,
                    numbering: { reference: 'default-numbering', level: 1 }
                })
            );

            for (const integration of data.integrations) {
                paragraphs.push(
                    new Paragraph({
                        text: `• ${integration.name} (${integration.type})`,
                        bullet: { level: 0 },
                        spacing: { after: 50 }
                    })
                );
            }
        }

        return paragraphs;
    }

    // Helper methods for creating tables

    private createTitleFieldsTable(fields: ITitleField[]): Table {
        return new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                // Header row
                new TableRow({
                    tableHeader: true,
                    children: [
                        this.createHeaderCell('Field Name'),
                        this.createHeaderCell('Type'),
                        this.createHeaderCell('Source'),
                        this.createHeaderCell('Required'),
                        this.createHeaderCell('Format')
                    ]
                }),
                // Data rows
                ...fields.map(field => 
                    new TableRow({
                        children: [
                            this.createDataCell(field.name),
                            this.createDataCell(field.type),
                            this.createDataCell(field.source),
                            this.createDataCell(field.required ? 'Yes' : 'No'),
                            this.createDataCell(field.format || 'N/A')
                        ]
                    })
                )
            ]
        });
    }

    private createPhasesTable(phases: IPhase[]): Table {
        return new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                // Header row
                new TableRow({
                    tableHeader: true,
                    children: [
                        this.createHeaderCell('Phase'),
                        this.createHeaderCell('Order'),
                        this.createHeaderCell('Type'),
                        this.createHeaderCell('Allowed Actions'),
                        this.createHeaderCell('SLA')
                    ]
                }),
                // Data rows
                ...phases.map(phase => 
                    new TableRow({
                        children: [
                            this.createDataCell(phase.name),
                            this.createDataCell(phase.order.toString()),
                            this.createDataCell(
                                phase.isInitial ? 'Initial' : 
                                phase.isFinal ? 'Final' : 'Intermediate'
                            ),
                            this.createDataCell(phase.allowedActions.join(', ')),
                            this.createDataCell(
                                phase.sla ? `${phase.sla.duration} ${phase.sla.unit}` : 'N/A'
                            )
                        ]
                    })
                )
            ]
        });
    }

    private createTriggersTable(triggers: ITrigger[]): Table {
        return new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                // Header row
                new TableRow({
                    tableHeader: true,
                    children: [
                        this.createHeaderCell('Trigger Name'),
                        this.createHeaderCell('Type'),
                        this.createHeaderCell('Event'),
                        this.createHeaderCell('Action'),
                        this.createHeaderCell('Status')
                    ]
                }),
                // Data rows
                ...triggers.map(trigger => 
                    new TableRow({
                        children: [
                            this.createDataCell(trigger.name),
                            this.createDataCell(trigger.type),
                            this.createDataCell(trigger.event),
                            this.createDataCell(trigger.action),
                            this.createDataCell(trigger.enabled ? 'Enabled' : 'Disabled')
                        ]
                    })
                )
            ]
        });
    }

    private createKeyDatesTable(keyDates: IKeyDate[]): Table {
        return new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                // Header row
                new TableRow({
                    tableHeader: true,
                    children: [
                        this.createHeaderCell('Date Name'),
                        this.createHeaderCell('Type'),
                        this.createHeaderCell('Format'),
                        this.createHeaderCell('Required'),
                        this.createHeaderCell('Editable')
                    ]
                }),
                // Data rows
                ...keyDates.map(keyDate => 
                    new TableRow({
                        children: [
                            this.createDataCell(keyDate.name),
                            this.createDataCell(keyDate.type),
                            this.createDataCell(keyDate.format),
                            this.createDataCell(keyDate.required ? 'Yes' : 'No'),
                            this.createDataCell(keyDate.editable ? 'Yes' : 'No')
                        ]
                    })
                )
            ]
        });
    }

    private createPermissionsTable(permissions: any[]): Table {
        return new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                // Header row
                new TableRow({
                    tableHeader: true,
                    children: [
                        this.createHeaderCell('Permission'),
                        this.createHeaderCell('Description'),
                        this.createHeaderCell('Scope')
                    ]
                }),
                // Data rows
                ...permissions.map(perm => 
                    new TableRow({
                        children: [
                            this.createDataCell(perm.text || perm.name || 'N/A'),
                            this.createDataCell(perm.description || 'Standard permission'),
                            this.createDataCell(perm.scope || 'Work Item')
                        ]
                    })
                )
            ]
        });
    }

    private createPermissionsCreationTable(permissions: IGetWorkTypeCreatePermissionResult[]): Table {
        return new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                // Header row
                new TableRow({
                    tableHeader: true,
                    children: [
                        this.createHeaderCell('Subject'),
                        this.createHeaderCell('Type'),
                        this.createHeaderCell('Granted By'),
                        this.createHeaderCell('Date')
                    ]
                }),
                // Data rows
                ...permissions.map(perm => 
                    new TableRow({
                        children: [
                            this.createDataCell(perm.subjectName),
                            this.createDataCell(perm.subjectType),
                            this.createDataCell('System Administrator'),
                            this.createDataCell(new Date().toLocaleDateString())
                        ]
                    })
                )
            ]
        });
    }

    private createBusinessRulesTable(rules: IBusinessRule[]): Table {
        return new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                // Header row
                new TableRow({
                    tableHeader: true,
                    children: [
                        this.createHeaderCell('Rule Name'),
                        this.createHeaderCell('Condition'),
                        this.createHeaderCell('Action'),
                        this.createHeaderCell('Priority'),
                        this.createHeaderCell('Status')
                    ]
                }),
                // Data rows
                ...rules.map(rule => 
                    new TableRow({
                        children: [
                            this.createDataCell(rule.name),
                            this.createDataCell(rule.condition),
                            this.createDataCell(rule.action),
                            this.createDataCell(rule.priority.toString()),
                            this.createDataCell(rule.enabled ? 'Enabled' : 'Disabled')
                        ]
                    })
                )
            ]
        });
    }

    /**
     * Create comprehensive form fields table with detailed field information
     */
    private createFormFieldsTable(fields: any[]): Table {
        return new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                // Header row
                new TableRow({
                    tableHeader: true,
                    children: [
                        this.createHeaderCell('Field Name'),
                        this.createHeaderCell('Field Type'),
                        this.createHeaderCell('Required'),
                        this.createHeaderCell('Default Value'),
                        this.createHeaderCell('Validation'),
                        this.createHeaderCell('Help Text')
                    ]
                }),
                // Data rows with comprehensive field details
                ...fields.map(field => {
                    // Extract field properties with multiple fallbacks
                    const fieldName = field.name || field.Name || field.fieldName || field.FieldName || 'Unnamed Field';
                    const fieldType = field.type || field.Type || field.fieldType || field.FieldType || field.dataType || field.DataType || 'text';
                    const isRequired = field.required !== undefined ? field.required : (field.Required !== undefined ? field.Required : field.mandatory || field.Mandatory || false);
                    const defaultValue = field.defaultValue || field.DefaultValue || field.default || field.Default || '';
                    const validation = field.validation || field.Validation || field.validationRule || field.ValidationRule || '';
                    const helpText = field.helpText || field.HelpText || field.description || field.Description || field.tooltip || field.Tooltip || '';
                    const optionSet = field.optionSet || field.OptionSet || field.optionSetName || field.OptionSetName || '';
                    
                    // Determine display type with option set info
                    let displayType = fieldType;
                    if (optionSet) {
                        displayType = `${fieldType} (Option Set: ${optionSet})`;
                    } else if (fieldType === 'dropdown' || fieldType === 'select' || fieldType === 'list') {
                        const options = field.options || field.Options || field.values || field.Values || [];
                        if (options.length > 0) {
                            displayType = `${fieldType} [${options.slice(0, 3).join(', ')}${options.length > 3 ? '...' : ''}]`;
                        }
                    }
                    
                    // Format validation rules
                    let validationText = '';
                    if (validation) {
                        if (typeof validation === 'string') {
                            validationText = validation;
                        } else if (typeof validation === 'object') {
                            if (validation.rule) validationText = validation.rule;
                            else if (validation.pattern) validationText = `Pattern: ${validation.pattern}`;
                            else if (validation.min || validation.max) {
                                validationText = `Range: ${validation.min || '*'} - ${validation.max || '*'}`;
                            }
                        }
                    }
                    
                    // Add field constraints
                    const constraints = [];
                    if (field.minLength || field.MinLength) constraints.push(`Min Length: ${field.minLength || field.MinLength}`);
                    if (field.maxLength || field.MaxLength) constraints.push(`Max Length: ${field.maxLength || field.MaxLength}`);
                    if (field.min || field.Min) constraints.push(`Min: ${field.min || field.Min}`);
                    if (field.max || field.Max) constraints.push(`Max: ${field.max || field.Max}`);
                    if (field.pattern || field.Pattern) constraints.push(`Pattern: ${field.pattern || field.Pattern}`);
                    if (constraints.length > 0 && !validationText) {
                        validationText = constraints.join(', ');
                    }
                    
                    return new TableRow({
                        children: [
                            this.createDataCell(fieldName),
                            this.createDataCell(displayType),
                            this.createDataCell(isRequired ? 'Yes' : 'No'),
                            this.createDataCell(defaultValue.toString() || 'None'),
                            this.createDataCell(validationText || 'None'),
                            this.createDataCell(helpText || 'N/A')
                        ]
                    });
                })
            ]
        });
    }

    // Table cell helper methods
    private createHeaderCell(text: string): TableCell {
        return new TableCell({
            children: [new Paragraph({
                children: [
                    new TextRun({ text, bold: true, color: 'FFFFFF' })
                ]
            })],
            shading: { type: ShadingType.SOLID, color: '2E74B5' }
        });
    }

    private createDataCell(text: string): TableCell {
        return new TableCell({
            children: [new Paragraph({ text })]
        });
    }

    private createInfoRow(label: string, value: string): TableRow {
        return new TableRow({
            children: [
                new TableCell({
                    children: [new Paragraph({
                        children: [
                            new TextRun({ text: label, bold: true })
                        ]
                    })],
                    shading: { type: ShadingType.SOLID, color: 'F0F0F0' },
                    width: { size: 30, type: WidthType.PERCENTAGE }
                }),
                new TableCell({
                    children: [new Paragraph({ text: value })],
                    width: { size: 70, type: WidthType.PERCENTAGE }
                })
            ]
        });
    }

    // Other existing methods from base class
    private createTableOfContents(): Paragraph[] {
        return [
            new Paragraph({
                text: 'Table of Contents',
                heading: HeadingLevel.HEADING_1,
                pageBreakBefore: true
            }),
            new Paragraph({
                text: '[Auto-generated table of contents]',
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 }
            }),
            new Paragraph({
                text: '',
                pageBreakBefore: true
            })
        ];
    }

    private createExecutiveSummary(data: IEnhancedHLDData): Paragraph[] {
        return [
            new Paragraph({
                text: '1. Executive Summary',
                heading: HeadingLevel.HEADING_1,
                numbering: { reference: 'default-numbering', level: 0 }
            }),
            new Paragraph({
                text: `This document provides a comprehensive high-level design for the ${data.workType.name} work-type within the ShareDo platform, including detailed technical specifications, phase models, triggers, workflows, and security configurations.`,
                spacing: { after: 200 }
            }),
            new Paragraph({
                text: '1.1 Document Scope',
                heading: HeadingLevel.HEADING_2,
                numbering: { reference: 'default-numbering', level: 1 }
            }),
            new Paragraph({
                text: 'This document covers:',
                spacing: { after: 100 }
            }),
            new Paragraph({
                text: '• Complete work-type configuration and properties',
                bullet: { level: 0 }
            }),
            new Paragraph({
                text: '• Title and reference generation patterns',
                bullet: { level: 0 }
            }),
            new Paragraph({
                text: '• Phase models with transitions and guards',
                bullet: { level: 0 }
            }),
            new Paragraph({
                text: '• Triggers and workflow automation',
                bullet: { level: 0 }
            }),
            new Paragraph({
                text: '• Key dates and time-based actions',
                bullet: { level: 0 }
            }),
            new Paragraph({
                text: '• Security roles and permissions',
                bullet: { level: 0 }
            }),
            new Paragraph({
                text: '• Business rules and validations',
                bullet: { level: 0 },
                spacing: { after: 400 }
            })
        ];
    }

    private createSystemOverview(data: IEnhancedHLDData): (Paragraph | Table)[] {
        const paragraphs: (Paragraph | Table)[] = [
            new Paragraph({
                text: '2. System Overview',
                heading: HeadingLevel.HEADING_1,
                numbering: { reference: 'default-numbering', level: 0 },
                pageBreakBefore: true
            }),
            new Paragraph({
                text: '2.1 Work-Type Details',
                heading: HeadingLevel.HEADING_2,
                numbering: { reference: 'default-numbering', level: 1 }
            })
        ];

        // Create comprehensive properties table
        const propertiesTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                this.createInfoRow('Name', data.workType.name),
                this.createInfoRow('System Name', data.workType.systemName),
                this.createInfoRow('Description', data.workType.description),
                this.createInfoRow('Category', data.workType.category || 'N/A'),
                this.createInfoRow('Version', data.workType.version || 'N/A'),
                this.createInfoRow('Owner', data.workType.owner || 'N/A'),
                this.createInfoRow('Active', data.workType.isActive ? 'Yes' : 'No'),
                this.createInfoRow('Abstract', data.workType.isAbstract ? 'Yes' : 'No'),
                this.createInfoRow('Core Type', data.workType.isCoreType ? 'Yes' : 'No'),
                this.createInfoRow('Has Portals', data.workType.hasPortals ? 'Yes' : 'No'),
                this.createInfoRow('Icon', data.workType.icon),
                this.createInfoRow('Tile Color', data.workType.tileColour || 'Default'),
                this.createInfoRow('System Path', data.workType.systemNamePath),
                this.createInfoRow('Tags', data.workType.tags?.join(', ') || 'N/A')
            ]
        });

        paragraphs.push(propertiesTable);

        // Add derived types if any
        if (data.derivedTypes && data.derivedTypes.length > 0) {
            paragraphs.push(
                new Paragraph({
                    text: '2.2 Derived Types',
                    heading: HeadingLevel.HEADING_2,
                    numbering: { reference: 'default-numbering', level: 1 },
                    spacing: { before: 400 }
                }),
                new Paragraph({
                    text: 'The following work-types inherit from this type:',
                    spacing: { after: 200 }
                })
            );

            for (const derivedType of data.derivedTypes) {
                paragraphs.push(
                    new Paragraph({
                        text: `• ${derivedType.name} (${derivedType.systemName})`,
                        bullet: { level: 0 },
                        spacing: { after: 50 }
                    })
                );
            }
        }

        return paragraphs;
    }

    private createAppendices(data: IEnhancedHLDData): Paragraph[] {
        return [
            new Paragraph({
                text: 'Appendices',
                heading: HeadingLevel.HEADING_1,
                pageBreakBefore: true
            }),
            new Paragraph({
                text: 'A. Glossary',
                heading: HeadingLevel.HEADING_2
            }),
            new Paragraph({
                text: 'Work-Type: A template that defines the structure and behavior of work items.',
                spacing: { after: 100 }
            }),
            new Paragraph({
                text: 'Phase Model: Defines the lifecycle stages of a work item.',
                spacing: { after: 100 }
            }),
            new Paragraph({
                text: 'Phase Guard: Conditions that must be met for phase transitions.',
                spacing: { after: 100 }
            }),
            new Paragraph({
                text: 'Trigger: Automated action based on events or conditions.',
                spacing: { after: 100 }
            }),
            new Paragraph({
                text: 'Key Date: Important date fields that drive business processes.',
                spacing: { after: 100 }
            }),
            new Paragraph({
                text: 'Participant Role: A defined role with specific permissions.',
                spacing: { after: 400 }
            }),
            new Paragraph({
                text: 'B. Document History',
                heading: HeadingLevel.HEADING_2
            }),
            new Paragraph({
                text: `Version ${data.metadata.version} - ${data.metadata.createdDate.toLocaleDateString()}`,
                spacing: { after: 50 }
            }),
            new Paragraph({
                text: '• Initial comprehensive documentation',
                bullet: { level: 0 }
            }),
            new Paragraph({
                text: '• Included all configuration details',
                bullet: { level: 0 }
            }),
            new Paragraph({
                text: '• Added phase models and workflows',
                bullet: { level: 0 },
                spacing: { after: 400 }
            })
        ];
    }

    private createHeader(data: IEnhancedHLDData): Header {
        return new Header({
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `${data.workType.name} - Comprehensive HLD`,
                            size: 20
                        })
                    ],
                    alignment: AlignmentType.CENTER
                })
            ]
        });
    }

    private createFooter(): Footer {
        return new Footer({
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: 'Page ',
                            size: 20
                        }),
                        new TextRun({
                            children: [PageNumber.CURRENT],
                            size: 20
                        }),
                        new TextRun({
                            text: ' of ',
                            size: 20
                        }),
                        new TextRun({
                            children: [PageNumber.TOTAL_PAGES],
                            size: 20
                        })
                    ],
                    alignment: AlignmentType.CENTER
                })
            ]
        });
    }

    private getEnhancedDocumentStyles(): any {
        return {
            default: {
                heading1: {
                    run: {
                        size: 32,
                        bold: true,
                        color: '2E74B5'
                    },
                    paragraph: {
                        spacing: {
                            before: 240,
                            after: 120
                        }
                    }
                },
                heading2: {
                    run: {
                        size: 26,
                        bold: true,
                        color: '2E74B5'
                    },
                    paragraph: {
                        spacing: {
                            before: 200,
                            after: 100
                        }
                    }
                },
                heading3: {
                    run: {
                        size: 24,
                        bold: true,
                        color: '404040'
                    },
                    paragraph: {
                        spacing: {
                            before: 160,
                            after: 80
                        }
                    }
                },
                document: {
                    run: {
                        font: 'Calibri',
                        size: 22
                    },
                    paragraph: {
                        spacing: {
                            line: 276,
                            after: 100
                        }
                    }
                }
            }
        };
    }

    private getNumberingConfig(): any {
        return {
            config: [
                {
                    reference: 'default-numbering',
                    levels: [
                        {
                            level: 0,
                            format: NumberFormat.DECIMAL,
                            text: '%1.',
                            alignment: AlignmentType.LEFT,
                            style: {
                                paragraph: {
                                    indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) }
                                }
                            }
                        },
                        {
                            level: 1,
                            format: NumberFormat.DECIMAL,
                            text: '%1.%2',
                            alignment: AlignmentType.LEFT,
                            style: {
                                paragraph: {
                                    indent: { left: convertInchesToTwip(1), hanging: convertInchesToTwip(0.375) }
                                }
                            }
                        },
                        {
                            level: 2,
                            format: NumberFormat.DECIMAL,
                            text: '%1.%2.%3',
                            alignment: AlignmentType.LEFT,
                            style: {
                                paragraph: {
                                    indent: { left: convertInchesToTwip(1.5), hanging: convertInchesToTwip(0.5) }
                                }
                            }
                        }
                    ]
                }
            ]
        };
    }

    // Mock data methods (in production, these would fetch real data from APIs)

    private mockTitleGenerator(workType: IWorkType): ITitleGenerator {
        return {
            pattern: '[{WorkType}]-[{Year}]-[{Sequence}]: {Title}',
            description: `Automatic title generation for ${workType.name} work items`,
            fields: [
                {
                    name: 'WorkType',
                    type: 'string',
                    source: 'workType.code',
                    required: true
                },
                {
                    name: 'Year',
                    type: 'date',
                    source: 'system.currentYear',
                    format: 'YYYY',
                    required: true
                },
                {
                    name: 'Sequence',
                    type: 'number',
                    source: 'system.sequence',
                    format: '00000',
                    required: true
                },
                {
                    name: 'Title',
                    type: 'string',
                    source: 'user.input',
                    required: true
                }
            ],
            example: `${workType.systemName.toUpperCase()}-2024-00001: Sample Work Item Title`,
            uniqueConstraints: ['WorkType + Year + Sequence']
        };
    }

    private mockReferenceGenerator(workType: IWorkType): IReferenceGenerator {
        return {
            pattern: '{Prefix}{Year}{Sequence}',
            description: `Unique reference number generation for ${workType.name}`,
            prefix: workType.systemName.substring(0, 3).toUpperCase(),
            sequenceType: 'YEARLY_RESET',
            sequenceStart: 1,
            sequenceIncrement: 1,
            resetPeriod: 'Yearly',
            example: `${workType.systemName.substring(0, 3).toUpperCase()}202400001`
        };
    }

    private mockPhaseModel(workType: IWorkType): IPhaseModel {
        return {
            name: `${workType.name} Lifecycle`,
            description: `Standard phase model for ${workType.name} work items`,
            initialPhase: 'draft',
            finalPhases: ['completed', 'cancelled'],
            phases: [
                {
                    name: 'Draft',
                    systemName: 'draft',
                    description: 'Initial creation phase',
                    order: 1,
                    color: '#808080',
                    isInitial: true,
                    isFinal: false,
                    allowedActions: ['edit', 'delete', 'submit'],
                    sla: { duration: 24, unit: 'hours' }
                },
                {
                    name: 'In Review',
                    systemName: 'review',
                    description: 'Under review and approval',
                    order: 2,
                    color: '#FFA500',
                    isInitial: false,
                    isFinal: false,
                    allowedActions: ['approve', 'reject', 'comment'],
                    sla: { duration: 48, unit: 'hours' }
                },
                {
                    name: 'In Progress',
                    systemName: 'in_progress',
                    description: 'Active work in progress',
                    order: 3,
                    color: '#0000FF',
                    isInitial: false,
                    isFinal: false,
                    allowedActions: ['update', 'pause', 'complete'],
                    sla: { duration: 5, unit: 'days' }
                },
                {
                    name: 'Completed',
                    systemName: 'completed',
                    description: 'Successfully completed',
                    order: 4,
                    color: '#008000',
                    isInitial: false,
                    isFinal: true,
                    allowedActions: ['archive', 'export']
                },
                {
                    name: 'Cancelled',
                    systemName: 'cancelled',
                    description: 'Cancelled or terminated',
                    order: 5,
                    color: '#FF0000',
                    isInitial: false,
                    isFinal: true,
                    allowedActions: ['archive']
                }
            ],
            transitions: [
                {
                    name: 'Submit for Review',
                    fromPhase: 'draft',
                    toPhase: 'review',
                    automaticTransition: false,
                    requiresApproval: false,
                    guards: [
                        {
                            name: 'Completeness Check',
                            type: 'validation',
                            condition: 'allRequiredFieldsCompleted',
                            errorMessage: 'All required fields must be completed',
                            severity: 'error'
                        }
                    ]
                },
                {
                    name: 'Approve',
                    fromPhase: 'review',
                    toPhase: 'in_progress',
                    automaticTransition: false,
                    requiresApproval: true,
                    approvalRoles: ['Manager', 'Supervisor'],
                    guards: [
                        {
                            name: 'Approval Check',
                            type: 'permission',
                            condition: 'hasApprovalPermission',
                            errorMessage: 'User must have approval permission',
                            severity: 'error'
                        }
                    ]
                },
                {
                    name: 'Complete',
                    fromPhase: 'in_progress',
                    toPhase: 'completed',
                    automaticTransition: false,
                    requiresApproval: false,
                    guards: [
                        {
                            name: 'Completion Validation',
                            type: 'validation',
                            condition: 'allTasksCompleted',
                            errorMessage: 'All tasks must be completed',
                            severity: 'error'
                        }
                    ],
                    triggers: ['SendCompletionNotification', 'UpdateMetrics']
                }
            ]
        };
    }

    private mockTriggers(workType: IWorkType): ITrigger[] {
        return [
            {
                name: 'AutoAssignOnCreate',
                type: 'onCreate',
                event: 'WorkItemCreated',
                action: 'AssignToDefaultQueue',
                enabled: true,
                parameters: [
                    {
                        name: 'queueName',
                        value: 'DefaultQueue',
                        type: 'string',
                        source: 'configuration'
                    }
                ]
            },
            {
                name: 'NotificationOnPhaseChange',
                type: 'onPhaseChange',
                event: 'PhaseTransition',
                action: 'SendNotification',
                targetWorkflow: 'NotificationWorkflow',
                enabled: true,
                parameters: [
                    {
                        name: 'recipients',
                        value: 'participantRoles.all',
                        type: 'array',
                        source: 'workItem'
                    }
                ]
            },
            {
                name: 'EscalationOnSLABreach',
                type: 'scheduled',
                event: 'SLACheck',
                condition: 'phase.sla.exceeded',
                action: 'EscalateToManager',
                targetWorkflow: 'EscalationWorkflow',
                schedule: '0 */4 * * *',
                enabled: true
            },
            {
                name: 'ArchiveOnCompletion',
                type: 'onPhaseChange',
                event: 'PhaseTransition',
                condition: "toPhase == 'completed'",
                action: 'ArchiveWorkItem',
                targetWorkflow: 'ArchiveWorkflow',
                enabled: true
            }
        ];
    }

    private mockKeyDates(workType: IWorkType): IKeyDate[] {
        return [
            {
                name: 'Due Date',
                systemName: 'dueDate',
                description: 'Target completion date for the work item',
                type: 'date',
                format: 'YYYY-MM-DD',
                required: true,
                editable: true,
                triggers: ['DueDateReminder', 'SLACalculation'],
                validations: [
                    {
                        type: 'future',
                        condition: 'date > today',
                        errorMessage: 'Due date must be in the future'
                    }
                ]
            },
            {
                name: 'Start Date',
                systemName: 'startDate',
                description: 'When work begins on this item',
                type: 'datetime',
                format: 'YYYY-MM-DD HH:mm',
                required: false,
                editable: true,
                calculation: 'onPhaseChange(in_progress)',
                triggers: ['StartNotification']
            },
            {
                name: 'Review Deadline',
                systemName: 'reviewDeadline',
                description: 'Deadline for review completion',
                type: 'date',
                format: 'YYYY-MM-DD',
                required: false,
                editable: false,
                calculation: 'dueDate - 5 days',
                triggers: ['ReviewReminder'],
                validations: [
                    {
                        type: 'before',
                        condition: 'date < dueDate',
                        errorMessage: 'Review deadline must be before due date'
                    }
                ]
            },
            {
                name: 'Completion Date',
                systemName: 'completionDate',
                description: 'Actual completion date',
                type: 'datetime',
                format: 'YYYY-MM-DD HH:mm:ss',
                required: false,
                editable: false,
                source: 'system.currentDateTime',
                triggers: ['CompletionMetrics', 'PerformanceReport']
            }
        ];
    }

    private mockWorkflows(workType: IWorkType): IWorkflowDetails[] {
        return [
            {
                name: 'Approval Workflow',
                systemName: 'approvalWorkflow',
                description: 'Handles approval routing and decision recording',
                type: 'approval',
                trigger: 'PhaseTransition:review',
                steps: [
                    {
                        order: 1,
                        name: 'Identify Approvers',
                        type: 'query',
                        action: 'GetApproversForRole',
                        parameters: [
                            {
                                name: 'role',
                                type: 'string',
                                required: true,
                                defaultValue: 'Manager'
                            }
                        ]
                    },
                    {
                        order: 2,
                        name: 'Send Approval Request',
                        type: 'notification',
                        action: 'SendApprovalEmail',
                        parameters: [
                            {
                                name: 'template',
                                type: 'string',
                                required: true,
                                defaultValue: 'ApprovalRequestTemplate'
                            }
                        ]
                    },
                    {
                        order: 3,
                        name: 'Wait for Decision',
                        type: 'wait',
                        action: 'WaitForApprovalDecision',
                        condition: 'timeout < 48 hours'
                    },
                    {
                        order: 4,
                        name: 'Process Decision',
                        type: 'branch',
                        action: 'ProcessApprovalDecision',
                        onSuccess: 'TransitionToInProgress',
                        onFailure: 'ReturnToDraft'
                    }
                ],
                inputs: [
                    {
                        name: 'workItemId',
                        type: 'string',
                        required: true,
                        description: 'ID of the work item requiring approval'
                    }
                ],
                outputs: [
                    {
                        name: 'approvalDecision',
                        type: 'boolean',
                        required: true,
                        description: 'Approval decision result'
                    }
                ],
                errorHandling: 'Retry 3 times then escalate',
                retryPolicy: 'Exponential backoff'
            },
            {
                name: 'Notification Workflow',
                systemName: 'notificationWorkflow',
                description: 'Sends notifications to relevant parties',
                type: 'notification',
                steps: [
                    {
                        order: 1,
                        name: 'Determine Recipients',
                        type: 'query',
                        action: 'GetNotificationRecipients'
                    },
                    {
                        order: 2,
                        name: 'Prepare Message',
                        type: 'transform',
                        action: 'PrepareNotificationContent'
                    },
                    {
                        order: 3,
                        name: 'Send Notifications',
                        type: 'action',
                        action: 'SendMultiChannelNotification'
                    }
                ]
            },
            {
                name: 'Escalation Workflow',
                systemName: 'escalationWorkflow',
                description: 'Escalates items based on SLA or other conditions',
                type: 'escalation',
                trigger: 'SLABreach',
                steps: [
                    {
                        order: 1,
                        name: 'Check Escalation Level',
                        type: 'query',
                        action: 'GetCurrentEscalationLevel'
                    },
                    {
                        order: 2,
                        name: 'Identify Escalation Target',
                        type: 'query',
                        action: 'GetNextEscalationTarget'
                    },
                    {
                        order: 3,
                        name: 'Reassign Work Item',
                        type: 'action',
                        action: 'ReassignToEscalationTarget'
                    },
                    {
                        order: 4,
                        name: 'Send Escalation Notice',
                        type: 'notification',
                        action: 'SendEscalationNotification'
                    }
                ],
                errorHandling: 'Log and continue'
            }
        ];
    }

    private mockBusinessRules(workType: IWorkType): IBusinessRule[] {
        return [
            {
                name: 'Auto-assign Priority',
                description: 'Automatically set priority based on due date',
                condition: 'dueDate < today + 3 days',
                action: 'setPriority("High")',
                priority: 1,
                enabled: true
            },
            {
                name: 'Require Manager Approval',
                description: 'Require manager approval for high-value items',
                condition: 'estimatedValue > 10000',
                action: 'addApprovalRequirement("Manager")',
                priority: 2,
                enabled: true
            },
            {
                name: 'Prevent Weekend Due Dates',
                description: 'Adjust due dates that fall on weekends',
                condition: 'dayOfWeek(dueDate) IN (0, 6)',
                action: 'adjustDueDate(nextBusinessDay)',
                priority: 3,
                enabled: true
            },
            {
                name: 'Mandatory Fields Check',
                description: 'Ensure all mandatory fields are completed before submission',
                condition: 'phase == "draft" AND action == "submit"',
                action: 'validateMandatoryFields()',
                priority: 4,
                enabled: true
            }
        ];
    }

    private mockForms(workType: IWorkType): IFormDetails[] {
        return [
            {
                name: 'Initial Request Form',
                systemName: 'initialRequestForm',
                description: 'Form for creating new work items',
                fields: [
                    {
                        name: 'title',
                        label: 'Title',
                        type: 'text',
                        required: true,
                        helpText: 'Enter a descriptive title'
                    },
                    {
                        name: 'description',
                        label: 'Description',
                        type: 'textarea',
                        required: true,
                        helpText: 'Provide detailed description'
                    },
                    {
                        name: 'priority',
                        label: 'Priority',
                        type: 'dropdown',
                        required: true,
                        defaultValue: 'Medium'
                    },
                    {
                        name: 'dueDate',
                        label: 'Due Date',
                        type: 'date',
                        required: true
                    }
                ]
            },
            {
                name: 'Approval Form',
                systemName: 'approvalForm',
                description: 'Form for approval decisions',
                fields: [
                    {
                        name: 'decision',
                        label: 'Decision',
                        type: 'radio',
                        required: true
                    },
                    {
                        name: 'comments',
                        label: 'Comments',
                        type: 'textarea',
                        required: false
                    }
                ]
            }
        ];
    }

    private mockTemplates(workType: IWorkType): ITemplateDetails[] {
        return [
            {
                name: 'Work Item Summary',
                type: 'document',
                description: 'Summary document template',
                usage: 'Generate work item summaries'
            },
            {
                name: 'Status Report',
                type: 'report',
                description: 'Status report template',
                usage: 'Weekly status reporting'
            },
            {
                name: 'Approval Request Email',
                type: 'email',
                description: 'Email template for approval requests',
                usage: 'Automated approval notifications'
            },
            {
                name: 'Completion Certificate',
                type: 'document',
                description: 'Certificate of completion',
                usage: 'Generated upon work item completion'
            }
        ];
    }
}