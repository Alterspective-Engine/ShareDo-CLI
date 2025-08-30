/**
 * Configurable HLD Document Generator
 * 
 * Generates stakeholder-specific documentation by filtering and transforming
 * content from the existing Enhanced HLD Generator based on template configurations.
 */

import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import { 
    Document, 
    Packer, 
    Paragraph, 
    TextRun, 
    HeadingLevel,
    AlignmentType,
    Table,
    TableRow,
    TableCell,
    WidthType,
    BorderStyle,
    ShadingType
} from 'docx';
import { EnhancedHLDDocumentGenerator } from './EnhancedHLDDocumentGenerator';
import { IWorkType } from '../Request/WorkTypes/IGetWorkTypesRequestResult';
import { IWorkTypeExtended } from './interfaces/IWorkTypeExtended';
import { SharedoClient } from '../sharedoClient';
import { IEnhancedHLDData } from './EnhancedHLDDocumentGenerator';
import { ArtifactCrossReferenceService, IOrphanedArtifact, IGlobalConfigAnalysis } from './ArtifactCrossReferenceService';

// Enhanced data interfaces for improved functionality
export interface IEnhancedDocumentData extends IEnhancedHLDData {
    orphanedArtifacts: IOrphanedArtifact[];
    crossReferences: Map<string, any>;
    globalConfigAnalysis: IGlobalConfigAnalysis;
    orphanedArtifactsReport?: {
        count: number;
        artifacts: IOrphanedArtifact[];
        summary: string;
    };
    configurationAnalysis?: {
        globalSettings: any;
        worktypeSpecific: any;
        dependencies: any;
        conflicts: any;
        summary: string;
    };
    enrichedSections?: any[];
}

// Template configuration interfaces
export interface IDocumentTemplate {
    id: string;
    name: string;
    type: 'full-hld' | 'cheat-sheet' | 'training-guide';
    audience: string;
    focusAreas: string[];
    sections: ISectionConfig[];
    format: IFormatConfig;
    includeElements: IIncludeElements;
    excludes?: string[];
}

export interface ISectionConfig {
    id: string;
    title: string;
    include: boolean;
    content?: string[];
    detailLevel?: 'full' | 'detailed' | 'summary' | 'basic';
    diagrams?: string[];
    includeCode?: boolean;
    includeScreenshots?: boolean;
    includeExamples?: boolean;
    includeCommands?: boolean;
    exercises?: boolean;
    scenarios?: string[];
    duration?: string;
}

export interface IFormatConfig {
    style: 'formal' | 'quick-ref' | 'training';
    length: 'comprehensive' | 'summary' | 'card';
    visuals: 'diagrams' | 'screenshots' | 'both' | 'none';
}

export interface IIncludeElements {
    tableOfContents: boolean;
    glossary: boolean;
    index: boolean;
    appendices: boolean;
    exercises: boolean;
    quickReference: boolean;
}

export type AudienceType = 
    | 'business-analysis'
    | 'technical-operations'
    | 'support-operations'
    | 'trainers'
    | 'legal-admin'
    | 'end-user'
    | 'lawyer'
    | 'manager';

/**
 * Main configurable HLD generator class
 */
export class ConfigurableHLDGenerator {
    private static instance: ConfigurableHLDGenerator;
    private enhancedGenerator: EnhancedHLDDocumentGenerator;
    private templates: Map<string, IDocumentTemplate> = new Map();
    private templateCache: Map<string, any> = new Map();
    private crossReferenceService: ArtifactCrossReferenceService;
    private fullExportPath: string;

    private constructor() {
        this.enhancedGenerator = EnhancedHLDDocumentGenerator.getInstance();
        this.crossReferenceService = new ArtifactCrossReferenceService();
        this.fullExportPath = 'C:\\GitHub\\LearnSD\\fullExport\\data'; // Default path
        this.loadTemplates();
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): ConfigurableHLDGenerator {
        if (!ConfigurableHLDGenerator.instance) {
            ConfigurableHLDGenerator.instance = new ConfigurableHLDGenerator();
        }
        return ConfigurableHLDGenerator.instance;
    }

    /**
     * Load all template configurations
     */
    private async loadTemplates(): Promise<void> {
        const templateDir = path.join(__dirname, '..', '..', 'templates');
        
        // Load built-in templates
        const builtInTemplates = [
            'business-analyst',
            'system-admin',
            'support-consultant',
            'trainer',
            'legal-admin-cheatsheet',
            'lawyer-cheatsheet',
            'manager-cheatsheet',
            'sysadmin-cheatsheet'
        ];

        for (const templateId of builtInTemplates) {
            try {
                const config = await this.loadTemplateConfig(templateId);
                if (config) {
                    this.templates.set(templateId, config);
                }
            } catch (error: any) {
                console.warn(`Failed to load template ${templateId}:`, error?.message || error);
            }
        }
    }

    /**
     * Load a single template configuration
     */
    private async loadTemplateConfig(templateId: string): Promise<IDocumentTemplate | null> {
        // For now, return inline configurations
        // In production, these would be loaded from JSON/YAML files
        return this.getBuiltInTemplate(templateId);
    }

    /**
     * Set the full export path for enhanced analysis
     */
    public setFullExportPath(path: string): void {
        this.fullExportPath = path;
    }

    /**
     * Generate HLD with specified template (enhanced with cross-reference analysis)
     */
    public async generateWithTemplate(
        workType: IWorkType,
        server: SharedoClient,
        templateId: string
    ): Promise<Buffer> {
        const template = this.templates.get(templateId);
        if (!template) {
            throw new Error(`Unknown template: ${templateId}`);
        }

        // Load cross-reference data if available
        try {
            await this.crossReferenceService.loadFullExport(this.fullExportPath);
        } catch (error: any) {
            console.warn('Could not load cross-reference data:', error?.message || error);
        }

        // Collect all data using enhanced generator with cross-references
        const fullData = await this.collectEnhancedData(workType, server);

        // Filter data based on template
        const filteredData = this.filterDataForTemplate(fullData, template);

        // Transform content for audience
        const transformedData = this.transformForAudience(filteredData, template);
        
        // Enrich with cross-reference data
        const enrichedData = this.enrichWithCrossReferences(transformedData, template);

        // Generate document based on template type
        switch (template.type) {
            case 'cheat-sheet':
                return this.generateCheatSheet(enrichedData, template);
            case 'training-guide':
                return this.generateTrainingGuide(enrichedData, template);
            case 'full-hld':
            default:
                return this.generateFullDocument(enrichedData, template);
        }
    }

    /**
     * Collect all available data with cross-reference enhancements
     */
    private async collectEnhancedData(
        workType: IWorkType,
        server: SharedoClient
    ): Promise<IEnhancedDocumentData> {
        // Get base data from enhanced generator
        const baseData = await this.collectAllData(workType, server);
        
        // Add cross-reference enhancements
        const orphanedArtifacts = this.crossReferenceService.findOrphanedArtifacts();
        const globalConfigAnalysis = this.crossReferenceService.analyzeGlobalConfiguration();
        
        // Build cross-reference map for the current worktype
        const crossReferences = new Map();
        const worktypeArtifacts = this.crossReferenceService.searchArtifacts(workType.systemName);
        
        for (const artifact of worktypeArtifacts) {
            crossReferences.set(artifact.id, artifact.data);
        }
        
        return {
            ...baseData,
            orphanedArtifacts,
            crossReferences,
            globalConfigAnalysis
        };
    }

    /**
     * Collect base data (original method)
     */
    private async collectAllData(
        workType: IWorkType,
        server: SharedoClient
    ): Promise<IEnhancedHLDData> {
        // Use existing enhanced generator's data collection
        // This is a simplified version - in reality, would call actual methods
        const extendedWorkType = workType as IWorkTypeExtended;
        const data: IEnhancedHLDData = {
            metadata: {
                title: `${workType.name} Documentation`,
                version: '1.0',
                author: 'ShareDo HLD Generator',
                createdDate: new Date(),
                lastModified: new Date(),
                serverUrl: server.getBaseUrl(),
                documentId: `hld-${workType.systemName}-${Date.now()}`,
                classification: 'Internal',
                confidentiality: 'Confidential'
            },
            workType: {
                name: workType.name,
                systemName: workType.systemName,
                description: workType.description || '',
                isActive: workType.isActive,
                isAbstract: workType.isAbstract,
                isCoreType: workType.isCoreType || false,
                hasPortals: false,
                icon: extendedWorkType.iconClass || 'fa-cogs',
                systemNamePath: workType.systemNamePath,
                category: extendedWorkType.category,
                tags: extendedWorkType.tags || []
            },
            derivedTypes: [],
            participantRoles: [],
            createPermissions: [],
            // Additional data would be fetched here
        };

        return data;
    }

    /**
     * Filter data based on template configuration
     */
    private filterDataForTemplate(
        data: IEnhancedHLDData,
        template: IDocumentTemplate
    ): any {
        const filtered: any = { ...data };

        // Remove excluded sections
        if (template.excludes) {
            for (const exclude of template.excludes) {
                delete filtered[exclude];
            }
        }

        // Filter sections based on configuration
        const includedSections: any = {};
        for (const section of template.sections) {
            if (section.include) {
                const sectionData = this.extractSectionData(filtered, section);
                if (sectionData) {
                    includedSections[section.id] = sectionData;
                }
            }
        }

        filtered.sections = includedSections;
        return filtered;
    }

    /**
     * Extract data for a specific section
     */
    private extractSectionData(data: any, section: ISectionConfig): any {
        // Map section IDs to data properties
        const sectionMapping: { [key: string]: string[] } = {
            'overview': ['workType', 'metadata'],
            'business-process': ['phaseModel', 'workflows'],
            'data-model': ['businessRules', 'forms'],
            'user-stories': ['workflows', 'triggers'],
            'integration-touchpoints': ['integrations'],
            'system-architecture': ['workType', 'phaseModel'],
            'configuration-guide': ['triggers', 'keyDates'],
            'security-configuration': ['participantRoles', 'createPermissions'],
            'maintenance-procedures': ['workflows'],
            'monitoring-alerts': ['triggers'],
            'troubleshooting': ['businessRules'],
            'administration-tasks': ['phaseModel', 'participantRoles'],
            'user-management': ['participantRoles', 'createPermissions'],
            'workflow-configuration': ['workflows', 'triggers'],
            'document-templates': ['templates', 'forms']
        };

        const dataKeys = sectionMapping[section.id] || [section.id];
        const sectionData: any = {};

        for (const key of dataKeys) {
            if (data[key]) {
                sectionData[key] = data[key];
            }
        }

        return Object.keys(sectionData).length > 0 ? sectionData : null;
    }

    /**
     * Transform content based on audience
     */
    private transformForAudience(data: any, template: IDocumentTemplate): any {
        const transformed = { ...data };

        switch (template.audience) {
            case 'business-analysis':
                return this.transformForBusinessAnalyst(transformed);
            case 'technical-operations':
                return this.transformForSystemAdmin(transformed);
            case 'support-operations':
                return this.transformForSupport(transformed);
            case 'trainers':
                return this.transformForTrainers(transformed);
            case 'legal-admin':
            case 'end-user':
            case 'lawyer':
            case 'manager':
                return this.transformForEndUser(transformed, template.audience);
            default:
                return transformed;
        }
    }

    /**
     * Transform content for business analysts
     */
    private transformForBusinessAnalyst(data: any): any {
        // Focus on process, requirements, data flow
        // Remove technical implementation details
        const transformed = { ...data };
        
        // Remove technical fields
        delete transformed.executionEngine;
        delete transformed.eventEngine;
        delete transformed.systemVariables;
        
        // Simplify technical terms
        if (transformed.phaseModel) {
            transformed.businessProcess = {
                ...transformed.phaseModel,
                description: 'Business process workflow and decision points'
            };
            delete transformed.phaseModel;
        }

        return transformed;
    }

    /**
     * Transform content for system administrators
     */
    private transformForSystemAdmin(data: any): any {
        // Include all technical details
        // Add command examples and scripts
        const transformed = { ...data };
        
        // Add technical context
        transformed.technicalDetails = {
            commands: this.generateCommandExamples(),
            scripts: this.generateMaintenanceScripts(),
            configuration: this.generateConfigurationExamples()
        };

        return transformed;
    }

    /**
     * Transform content for support consultants
     */
    private transformForSupport(data: any): any {
        // Focus on configuration and administration
        // Include UI navigation and common issues
        const transformed = { ...data };
        
        transformed.supportGuide = {
            commonIssues: this.generateCommonIssues(),
            navigationGuide: this.generateNavigationGuide(),
            adminTasks: this.generateAdminTasks()
        };

        return transformed;
    }

    /**
     * Transform content for trainers
     */
    private transformForTrainers(data: any): any {
        // Structure as learning modules
        // Add exercises and scenarios
        const transformed = { ...data };
        
        transformed.trainingModules = this.generateTrainingModules(data);
        transformed.exercises = this.generateExercises(data);
        transformed.assessments = this.generateAssessments(data);

        return transformed;
    }

    /**
     * Transform content for end users
     */
    private transformForEndUser(data: any, audienceType: string): any {
        // Simplify language and focus on tasks
        const transformed = { ...data };
        
        // Remove complex technical details
        delete transformed.systemArchitecture;
        delete transformed.technicalImplementation;
        
        // Add task-focused content
        transformed.tasks = this.generateTaskGuides(audienceType);
        transformed.quickActions = this.generateQuickActions(audienceType);

        return transformed;
    }

    /**
     * Generate full HLD document
     */
    private async generateFullDocument(
        data: any,
        template: IDocumentTemplate
    ): Promise<Buffer> {
        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    ...this.generateTitlePage(data, template),
                    new Paragraph({ pageBreakBefore: true }),
                    ...this.generateTableOfContents(template),
                    new Paragraph({ pageBreakBefore: true }),
                    ...this.generateDocumentSections(data, template),
                    ...this.generateAppendices(data, template)
                ]
            }]
        });

        return await Packer.toBuffer(doc);
    }

    /**
     * Generate cheat sheet document
     */
    private async generateCheatSheet(
        data: any,
        template: IDocumentTemplate
    ): Promise<Buffer> {
        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    ...this.generateCheatSheetHeader(template),
                    ...this.generateQuickReferenceSections(data, template),
                    ...this.generateCheatSheetFooter(template)
                ]
            }]
        });

        return await Packer.toBuffer(doc);
    }

    /**
     * Generate training guide document
     */
    private async generateTrainingGuide(
        data: any,
        template: IDocumentTemplate
    ): Promise<Buffer> {
        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    ...this.generateTrainingHeader(template),
                    ...this.generateTrainingModulesContent(data, template),
                    ...this.generateExercisesContent(data, template),
                    ...this.generateAssessmentContent(data, template)
                ]
            }]
        });

        return await Packer.toBuffer(doc);
    }

    /**
     * Generate title page
     */
    private generateTitlePage(data: any, template: IDocumentTemplate): Paragraph[] {
        return [
            new Paragraph({
                text: template.name,
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 }
            }),
            new Paragraph({
                text: data.workType?.name || 'Work Type Documentation',
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 }
            }),
            new Paragraph({
                text: `Generated: ${new Date().toLocaleDateString()}`,
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 }
            }),
            new Paragraph({
                text: `Version: ${data.metadata?.version || '1.0'}`,
                alignment: AlignmentType.CENTER
            })
        ];
    }

    /**
     * Generate table of contents
     */
    private generateTableOfContents(template: IDocumentTemplate): Paragraph[] {
        if (!template.includeElements.tableOfContents) {
            return [];
        }

        const toc = [
            new Paragraph({
                text: 'Table of Contents',
                heading: HeadingLevel.HEADING_1,
                spacing: { after: 400 }
            })
        ];

        template.sections.forEach((section, index) => {
            if (section.include) {
                toc.push(
                    new Paragraph({
                        text: `${index + 1}. ${section.title}`,
                        spacing: { after: 200 }
                    })
                );
            }
        });

        return toc;
    }

    /**
     * Generate document sections
     */
    private generateDocumentSections(data: any, template: IDocumentTemplate): Paragraph[] {
        const sections: Paragraph[] = [];

        for (const sectionConfig of template.sections) {
            if (sectionConfig.include && data.sections?.[sectionConfig.id]) {
                sections.push(
                    new Paragraph({
                        text: sectionConfig.title,
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 400, after: 200 }
                    })
                );

                const sectionContent = this.generateSectionContent(
                    data.sections[sectionConfig.id],
                    sectionConfig,
                    template
                );
                sections.push(...sectionContent);
            }
        }

        return sections;
    }

    /**
     * Generate content for a specific section
     */
    private generateSectionContent(
        sectionData: any,
        config: ISectionConfig,
        template: IDocumentTemplate
    ): Paragraph[] {
        const content: Paragraph[] = [];

        // Add section description if available
        if (sectionData.description) {
            content.push(
                new Paragraph({
                    text: sectionData.description,
                    spacing: { after: 200 }
                })
            );
        }

        // Add content based on detail level
        const detailLevel = config.detailLevel || 'detailed';
        content.push(...this.formatContentByDetailLevel(sectionData, detailLevel));

        // Add examples if requested
        if (config.includeExamples && sectionData.examples) {
            content.push(
                new Paragraph({
                    text: 'Examples:',
                    heading: HeadingLevel.HEADING_3,
                    spacing: { before: 200, after: 100 }
                })
            );
            content.push(...this.formatExamples(sectionData.examples));
        }

        // Add code if requested
        if (config.includeCode && sectionData.code) {
            content.push(...this.formatCode(sectionData.code));
        }

        return content;
    }

    /**
     * Format content based on detail level
     */
    private formatContentByDetailLevel(data: any, level: string): Paragraph[] {
        const content: Paragraph[] = [];

        switch (level) {
            case 'full':
                // Include everything
                content.push(...this.formatFullDetail(data));
                break;
            case 'detailed':
                // Include most things, skip deep technical details
                content.push(...this.formatDetailedContent(data));
                break;
            case 'summary':
                // Include key points only
                content.push(...this.formatSummary(data));
                break;
            case 'basic':
                // Include minimal information
                content.push(...this.formatBasic(data));
                break;
        }

        return content;
    }

    /**
     * Helper methods for content generation
     */
    private generateCommandExamples(): any {
        return {
            serviceControl: [
                'systemctl status sharedo-service',
                'systemctl restart sharedo-service',
                'systemctl enable sharedo-service'
            ],
            monitoring: [
                'tail -f /var/log/sharedo/application.log',
                'journalctl -u sharedo-service -f',
                'htop -F sharedo'
            ]
        };
    }

    private generateMaintenanceScripts(): any {
        return {
            backup: 'backup-sharedo.sh',
            restore: 'restore-sharedo.sh',
            cleanup: 'cleanup-logs.sh',
            healthCheck: 'health-check.sh'
        };
    }

    private generateConfigurationExamples(): any {
        return {
            environment: '/etc/sharedo/environment',
            application: '/etc/sharedo/application.yml',
            logging: '/etc/sharedo/logback.xml'
        };
    }

    private generateCommonIssues(): any {
        return [
            {
                issue: 'User cannot access work type',
                solution: 'Check participant roles and permissions'
            },
            {
                issue: 'Document generation fails',
                solution: 'Verify template configuration and data availability'
            },
            {
                issue: 'Workflow not progressing',
                solution: 'Check phase guards and transition conditions'
            }
        ];
    }

    private generateNavigationGuide(): any {
        return {
            dashboard: 'Home > Dashboard',
            workTypes: 'Administration > Work Types',
            users: 'Administration > Users & Roles',
            templates: 'Configuration > Document Templates'
        };
    }

    private generateAdminTasks(): any {
        return [
            'Create and configure work types',
            'Manage user roles and permissions',
            'Configure workflow automation',
            'Set up document templates',
            'Monitor system performance'
        ];
    }

    private generateTrainingModules(data: any): any {
        return [
            {
                module: 1,
                title: 'System Basics',
                duration: '2 hours',
                topics: ['Navigation', 'Terminology', 'Core Concepts']
            },
            {
                module: 2,
                title: 'Core Processes',
                duration: '4 hours',
                topics: ['Workflows', 'Phases', 'Transitions']
            },
            {
                module: 3,
                title: 'Roles & Permissions',
                duration: '2 hours',
                topics: ['User Roles', 'Permissions', 'Delegation']
            }
        ];
    }

    private generateExercises(data: any): any {
        return [
            {
                exercise: 'Create a new matter',
                steps: ['Navigate to...', 'Click...', 'Enter...']
            },
            {
                exercise: 'Assign roles',
                steps: ['Open matter...', 'Go to roles...', 'Select...']
            }
        ];
    }

    private generateAssessments(data: any): any {
        return {
            quiz: [
                'What are the main phases in the workflow?',
                'How do you assign a participant role?',
                'What triggers a phase transition?'
            ],
            practical: 'Complete a full matter lifecycle'
        };
    }

    private generateTaskGuides(audienceType: string): any {
        const tasksByAudience: { [key: string]: string[] } = {
            'legal-admin': [
                'Create new matters',
                'Assign roles',
                'Generate reports',
                'Manage documents'
            ],
            'lawyer': [
                'View my matters',
                'Add time entries',
                'Upload documents',
                'Request approvals'
            ],
            'manager': [
                'Monitor team workload',
                'Approve requests',
                'Generate team reports',
                'Reassign work'
            ]
        };

        return tasksByAudience[audienceType] || [];
    }

    private generateQuickActions(audienceType: string): any {
        return {
            shortcuts: ['Ctrl+N: New Matter', 'Ctrl+S: Save', 'Ctrl+P: Print'],
            frequentActions: ['Create', 'Assign', 'Approve', 'Generate']
        };
    }

    // Cheat sheet specific methods
    private generateCheatSheetHeader(template: IDocumentTemplate): Paragraph[] {
        return [
            new Paragraph({
                text: template.name,
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 }
            }),
            new Paragraph({
                text: 'Quick Reference Guide',
                heading: HeadingLevel.HEADING_2,
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 }
            })
        ];
    }

    private generateQuickReferenceSections(data: any, template: IDocumentTemplate): Paragraph[] {
        const sections: Paragraph[] = [];
        
        // Add quick reference content based on template
        for (const section of template.sections) {
            if (section.include) {
                sections.push(
                    new Paragraph({
                        text: section.title,
                        heading: HeadingLevel.HEADING_2,
                        spacing: { before: 200, after: 100 }
                    })
                );
                
                // Add bullet points or tables for quick reference
                sections.push(...this.generateQuickReferenceContent(section));
            }
        }

        return sections;
    }

    private generateQuickReferenceContent(section: ISectionConfig): Paragraph[] {
        // Generate concise, actionable content
        return [
            new Paragraph({
                text: '• Quick action 1',
                spacing: { after: 50 }
            }),
            new Paragraph({
                text: '• Quick action 2',
                spacing: { after: 50 }
            }),
            new Paragraph({
                text: '• Quick action 3',
                spacing: { after: 50 }
            })
        ];
    }

    private generateCheatSheetFooter(template: IDocumentTemplate): Paragraph[] {
        return [
            new Paragraph({
                text: 'For detailed information, refer to the full documentation',
                alignment: AlignmentType.CENTER,
                spacing: { before: 400 }
            })
        ];
    }

    // Training guide specific methods
    private generateTrainingHeader(template: IDocumentTemplate): Paragraph[] {
        return [
            new Paragraph({
                text: template.name,
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 }
            })
        ];
    }

    private generateTrainingModulesContent(data: any, template: IDocumentTemplate): Paragraph[] {
        const content: Paragraph[] = [];
        
        if (data.trainingModules) {
            for (const module of data.trainingModules) {
                content.push(
                    new Paragraph({
                        text: `Module ${module.module}: ${module.title}`,
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 400, after: 200 }
                    }),
                    new Paragraph({
                        text: `Duration: ${module.duration}`,
                        spacing: { after: 100 }
                    })
                );
                
                for (const topic of module.topics) {
                    content.push(
                        new Paragraph({
                            text: `• ${topic}`,
                            spacing: { after: 50 }
                        })
                    );
                }
            }
        }

        return content;
    }

    private generateExercisesContent(data: any, template: IDocumentTemplate): Paragraph[] {
        const content: Paragraph[] = [];
        
        if (data.exercises) {
            content.push(
                new Paragraph({
                    text: 'Exercises',
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 400, after: 200 }
                })
            );
            
            for (const exercise of data.exercises) {
                content.push(
                    new Paragraph({
                        text: exercise.exercise,
                        heading: HeadingLevel.HEADING_2,
                        spacing: { before: 200, after: 100 }
                    })
                );
                
                for (const step of exercise.steps) {
                    content.push(
                        new Paragraph({
                            text: `• ${step}`,
                            spacing: { after: 50 }
                        })
                    );
                }
            }
        }

        return content;
    }

    private generateAssessmentContent(data: any, template: IDocumentTemplate): Paragraph[] {
        const content: Paragraph[] = [];
        
        if (data.assessments) {
            content.push(
                new Paragraph({
                    text: 'Assessment',
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 400, after: 200 }
                })
            );
            
            if (data.assessments.quiz) {
                content.push(
                    new Paragraph({
                        text: 'Quiz Questions:',
                        heading: HeadingLevel.HEADING_2,
                        spacing: { before: 200, after: 100 }
                    })
                );
                
                data.assessments.quiz.forEach((question: string, index: number) => {
                    content.push(
                        new Paragraph({
                            text: `${index + 1}. ${question}`,
                            spacing: { after: 100 }
                        })
                    );
                });
            }
        }

        return content;
    }

    private generateAppendices(data: any, template: IDocumentTemplate): Paragraph[] {
        if (!template.includeElements.appendices) {
            return [];
        }

        return [
            new Paragraph({ pageBreakBefore: true }),
            new Paragraph({
                text: 'Appendices',
                heading: HeadingLevel.HEADING_1,
                spacing: { after: 400 }
            }),
            new Paragraph({
                text: 'Additional reference materials and resources',
                spacing: { after: 200 }
            })
        ];
    }

    // Format helper methods
    private formatFullDetail(data: any): Paragraph[] {
        const paragraphs: Paragraph[] = [];
        
        for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'string') {
                paragraphs.push(
                    new Paragraph({
                        text: `${key}: ${value}`,
                        spacing: { after: 100 }
                    })
                );
            } else if (typeof value === 'object' && value !== null) {
                paragraphs.push(
                    new Paragraph({
                        text: key,
                        heading: HeadingLevel.HEADING_3,
                        spacing: { before: 200, after: 100 }
                    })
                );
                paragraphs.push(...this.formatObject(value));
            }
        }
        
        return paragraphs;
    }

    private formatDetailedContent(data: any): Paragraph[] {
        // Similar to full but skip certain technical fields
        const skipFields = ['technicalImplementation', 'systemInternals', 'debugging'];
        const paragraphs: Paragraph[] = [];
        
        for (const [key, value] of Object.entries(data)) {
            if (!skipFields.includes(key)) {
                if (typeof value === 'string') {
                    paragraphs.push(
                        new Paragraph({
                            text: `${key}: ${value}`,
                            spacing: { after: 100 }
                        })
                    );
                }
            }
        }
        
        return paragraphs;
    }

    private formatSummary(data: any): Paragraph[] {
        // Extract key points only
        const summary = this.extractSummary(data);
        return [
            new Paragraph({
                text: summary,
                spacing: { after: 200 }
            })
        ];
    }

    private formatBasic(data: any): Paragraph[] {
        // Minimal information
        const basic = this.extractBasicInfo(data);
        return [
            new Paragraph({
                text: basic,
                spacing: { after: 200 }
            })
        ];
    }

    private formatExamples(examples: any[]): Paragraph[] {
        return examples.map(example => 
            new Paragraph({
                text: `Example: ${JSON.stringify(example)}`,
                spacing: { after: 100 }
            })
        );
    }

    private formatCode(code: any): Paragraph[] {
        return [
            new Paragraph({
                text: 'Code:',
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 200, after: 100 }
            }),
            new Paragraph({
                text: JSON.stringify(code, null, 2),
                spacing: { after: 200 }
            })
        ];
    }

    private formatObject(obj: any): Paragraph[] {
        const paragraphs: Paragraph[] = [];
        
        for (const [key, value] of Object.entries(obj)) {
            paragraphs.push(
                new Paragraph({
                    text: `• ${key}: ${JSON.stringify(value)}`,
                    spacing: { after: 50 }
                })
            );
        }
        
        return paragraphs;
    }

    private extractSummary(data: any): string {
        // Extract key information for summary
        const summary: string[] = [];
        
        if (data.name) summary.push(`Name: ${data.name}`);
        if (data.description) summary.push(`Description: ${data.description}`);
        if (data.purpose) summary.push(`Purpose: ${data.purpose}`);
        
        return summary.join('. ');
    }

    private extractBasicInfo(data: any): string {
        // Extract only the most basic information
        if (typeof data === 'string') return data;
        if (data.name) return data.name;
        if (data.title) return data.title;
        return 'Information available';
    }

    private stripTechnicalDetails(content: any): any {
        // Remove technical jargon and implementation details
        if (typeof content === 'string') {
            return content.replace(/\b(API|SQL|JSON|XML|HTTP)\b/gi, '');
        }
        return content;
    }

    private simplifyForUsers(content: any): any {
        // Simplify language for end users
        if (typeof content === 'string') {
            return content
                .replace(/workflow/gi, 'process')
                .replace(/participant role/gi, 'team member')
                .replace(/phase transition/gi, 'status change');
        }
        return content;
    }

    /**
     * Get list of available templates
     */
    public getAvailableTemplates(): Array<{ id: string; name: string; description: string }> {
        const templates: Array<{ id: string; name: string; description: string }> = [];
        
        this.templates.forEach((template, id) => {
            templates.push({
                id,
                name: template.name,
                description: `${template.type} for ${template.audience}`
            });
        });

        return templates;
    }

    /**
     * Get built-in template configurations
     */
    private getBuiltInTemplate(templateId: string): IDocumentTemplate | null {
        const templates: { [key: string]: IDocumentTemplate } = {
            'business-analyst': {
                id: 'business-analyst',
                name: 'Business Process & Requirements Documentation',
                type: 'full-hld',
                audience: 'business-analysis',
                focusAreas: ['process-flow', 'business-rules', 'data-mapping', 'integration'],
                sections: [
                    {
                        id: 'overview',
                        title: 'Executive Summary',
                        include: true,
                        detailLevel: 'summary'
                    },
                    {
                        id: 'business-process',
                        title: 'Business Process Model',
                        include: true,
                        detailLevel: 'detailed',
                        diagrams: ['process-flow', 'decision-tree']
                    },
                    {
                        id: 'data-model',
                        title: 'Data Model & Information Flow',
                        include: true,
                        detailLevel: 'detailed'
                    },
                    {
                        id: 'user-stories',
                        title: 'User Stories & Requirements',
                        include: true,
                        detailLevel: 'full'
                    },
                    {
                        id: 'integration-touchpoints',
                        title: 'System Integration Points',
                        include: true,
                        detailLevel: 'summary'
                    }
                ],
                format: {
                    style: 'formal',
                    length: 'comprehensive',
                    visuals: 'diagrams'
                },
                includeElements: {
                    tableOfContents: true,
                    glossary: true,
                    index: false,
                    appendices: true,
                    exercises: false,
                    quickReference: false
                },
                excludes: ['technical-implementation', 'code-samples']
            },
            'system-admin': {
                id: 'system-admin',
                name: 'System Administration & Technical Guide',
                type: 'full-hld',
                audience: 'technical-operations',
                focusAreas: ['configuration', 'maintenance', 'monitoring', 'troubleshooting'],
                sections: [
                    {
                        id: 'system-architecture',
                        title: 'System Architecture',
                        include: true,
                        detailLevel: 'full',
                        includeCode: true,
                        diagrams: ['architecture', 'deployment']
                    },
                    {
                        id: 'configuration-guide',
                        title: 'Configuration Management',
                        include: true,
                        detailLevel: 'full',
                        includeCode: true,
                        includeCommands: true
                    },
                    {
                        id: 'security-configuration',
                        title: 'Security & Access Control',
                        include: true,
                        detailLevel: 'full'
                    },
                    {
                        id: 'maintenance-procedures',
                        title: 'Maintenance & Operations',
                        include: true,
                        detailLevel: 'full',
                        includeCommands: true,
                        includeExamples: true
                    },
                    {
                        id: 'monitoring-alerts',
                        title: 'Monitoring & Alerting',
                        include: true,
                        detailLevel: 'full',
                        includeExamples: true
                    },
                    {
                        id: 'troubleshooting',
                        title: 'Troubleshooting Guide',
                        include: true,
                        detailLevel: 'full',
                        includeCommands: true
                    }
                ],
                format: {
                    style: 'formal',
                    length: 'comprehensive',
                    visuals: 'both'
                },
                includeElements: {
                    tableOfContents: true,
                    glossary: false,
                    index: true,
                    appendices: true,
                    exercises: false,
                    quickReference: true
                }
            },
            'support-consultant': {
                id: 'support-consultant',
                name: 'Work Type Administration & Support Guide',
                type: 'full-hld',
                audience: 'support-operations',
                focusAreas: ['worktype-admin', 'user-support', 'configuration'],
                sections: [
                    {
                        id: 'overview',
                        title: 'Work Type Overview',
                        include: true,
                        detailLevel: 'summary'
                    },
                    {
                        id: 'administration-tasks',
                        title: 'Work Type Administration',
                        include: true,
                        detailLevel: 'detailed',
                        includeScreenshots: true
                    },
                    {
                        id: 'user-management',
                        title: 'User & Role Management',
                        include: true,
                        detailLevel: 'detailed',
                        includeExamples: true
                    },
                    {
                        id: 'workflow-configuration',
                        title: 'Workflow Configuration',
                        include: true,
                        detailLevel: 'detailed'
                    },
                    {
                        id: 'document-templates',
                        title: 'Document Template Management',
                        include: true,
                        detailLevel: 'detailed'
                    }
                ],
                format: {
                    style: 'formal',
                    length: 'comprehensive',
                    visuals: 'screenshots'
                },
                includeElements: {
                    tableOfContents: true,
                    glossary: true,
                    index: false,
                    appendices: true,
                    exercises: false,
                    quickReference: true
                }
            },
            'trainer': {
                id: 'trainer',
                name: 'Training Guide & Curriculum',
                type: 'training-guide',
                audience: 'trainers',
                focusAreas: ['curriculum', 'exercises', 'scenarios', 'assessment'],
                sections: [
                    {
                        id: 'training-overview',
                        title: 'Training Program Overview',
                        include: true,
                        detailLevel: 'full'
                    },
                    {
                        id: 'module-basics',
                        title: 'Module 1: System Basics',
                        include: true,
                        exercises: true,
                        duration: '2 hours'
                    },
                    {
                        id: 'module-processes',
                        title: 'Module 2: Core Processes',
                        include: true,
                        exercises: true,
                        scenarios: ['new-matter', 'phase-change'],
                        duration: '4 hours'
                    },
                    {
                        id: 'module-roles',
                        title: 'Module 3: Roles & Responsibilities',
                        include: true,
                        exercises: true,
                        duration: '2 hours'
                    }
                ],
                format: {
                    style: 'training',
                    length: 'comprehensive',
                    visuals: 'both'
                },
                includeElements: {
                    tableOfContents: true,
                    glossary: true,
                    index: false,
                    appendices: true,
                    exercises: true,
                    quickReference: false
                }
            },
            'legal-admin-cheatsheet': {
                id: 'legal-admin-cheatsheet',
                name: 'Legal Administrator Quick Reference',
                type: 'cheat-sheet',
                audience: 'legal-admin',
                focusAreas: ['daily-tasks', 'shortcuts', 'troubleshooting'],
                sections: [
                    {
                        id: 'daily-tasks',
                        title: 'Daily Tasks Checklist',
                        include: true,
                        detailLevel: 'basic'
                    },
                    {
                        id: 'common-actions',
                        title: 'Common Actions',
                        include: true,
                        detailLevel: 'basic'
                    },
                    {
                        id: 'quick-fixes',
                        title: 'Troubleshooting Quick Fixes',
                        include: true,
                        detailLevel: 'basic'
                    }
                ],
                format: {
                    style: 'quick-ref',
                    length: 'card',
                    visuals: 'none'
                },
                includeElements: {
                    tableOfContents: false,
                    glossary: false,
                    index: false,
                    appendices: false,
                    exercises: false,
                    quickReference: true
                }
            },
            'lawyer-cheatsheet': {
                id: 'lawyer-cheatsheet',
                name: 'Lawyer Quick Reference Guide',
                type: 'cheat-sheet',
                audience: 'lawyer',
                focusAreas: ['matter-management', 'document-access', 'collaboration'],
                sections: [
                    {
                        id: 'my-work',
                        title: 'My Work',
                        include: true,
                        detailLevel: 'basic'
                    },
                    {
                        id: 'matter-actions',
                        title: 'Matter Actions',
                        include: true,
                        detailLevel: 'basic'
                    },
                    {
                        id: 'document-access',
                        title: 'Document Access',
                        include: true,
                        detailLevel: 'basic'
                    }
                ],
                format: {
                    style: 'quick-ref',
                    length: 'card',
                    visuals: 'none'
                },
                includeElements: {
                    tableOfContents: false,
                    glossary: false,
                    index: false,
                    appendices: false,
                    exercises: false,
                    quickReference: true
                }
            },
            'manager-cheatsheet': {
                id: 'manager-cheatsheet',
                name: 'Manager Dashboard Guide',
                type: 'cheat-sheet',
                audience: 'manager',
                focusAreas: ['team-oversight', 'performance-monitoring', 'reporting'],
                sections: [
                    {
                        id: 'team-overview',
                        title: 'Team Overview',
                        include: true,
                        detailLevel: 'basic'
                    },
                    {
                        id: 'management-actions',
                        title: 'Management Actions',
                        include: true,
                        detailLevel: 'basic'
                    },
                    {
                        id: 'monitoring',
                        title: 'Monitoring',
                        include: true,
                        detailLevel: 'basic'
                    }
                ],
                format: {
                    style: 'quick-ref',
                    length: 'card',
                    visuals: 'none'
                },
                includeElements: {
                    tableOfContents: false,
                    glossary: false,
                    index: false,
                    appendices: false,
                    exercises: false,
                    quickReference: true
                }
            },
            'sysadmin-cheatsheet': {
                id: 'sysadmin-cheatsheet',
                name: 'System Admin Command Reference',
                type: 'cheat-sheet',
                audience: 'technical-operations',
                focusAreas: ['commands', 'configuration', 'emergency'],
                sections: [
                    {
                        id: 'critical-commands',
                        title: 'Critical Commands',
                        include: true,
                        detailLevel: 'basic',
                        includeCommands: true
                    },
                    {
                        id: 'config-locations',
                        title: 'Configuration Locations',
                        include: true,
                        detailLevel: 'basic'
                    },
                    {
                        id: 'emergency-procedures',
                        title: 'Emergency Procedures',
                        include: true,
                        detailLevel: 'basic'
                    }
                ],
                format: {
                    style: 'quick-ref',
                    length: 'card',
                    visuals: 'none'
                },
                includeElements: {
                    tableOfContents: false,
                    glossary: false,
                    index: false,
                    appendices: false,
                    exercises: false,
                    quickReference: true
                }
            }
        };

        return templates[templateId] || null;
    }

    /**
     * Enrich data with cross-reference information
     */
    private enrichWithCrossReferences(
        data: IEnhancedDocumentData,
        template: IDocumentTemplate
    ): IEnhancedDocumentData {
        const enrichedData = { ...data };

        // Add orphaned artifacts section if relevant for template
        if (template.includeElements.appendices && data.orphanedArtifacts.length > 0) {
            enrichedData.orphanedArtifactsReport = {
                count: data.orphanedArtifacts.length,
                artifacts: data.orphanedArtifacts,
                summary: this.generateOrphanedArtifactsSummary(data.orphanedArtifacts)
            };
        }

        // Add global configuration analysis if relevant
        if (template.focusAreas.includes('system-configuration') || 
            template.audience === 'System Admin') {
            enrichedData.configurationAnalysis = {
                globalSettings: data.globalConfigAnalysis.globalSettings,
                worktypeSpecific: data.globalConfigAnalysis.worktypeSettings,
                dependencies: data.globalConfigAnalysis.dependencies,
                conflicts: data.globalConfigAnalysis.conflicts,
                summary: this.generateConfigurationSummary(data.globalConfigAnalysis)
            };
        }

        // Enrich sections with cross-reference data
        enrichedData.enrichedSections = this.buildEnrichedSections(data, template);

        return enrichedData;
    }

    /**
     * Generate summary of orphaned artifacts
     */
    private generateOrphanedArtifactsSummary(orphanedArtifacts: IOrphanedArtifact[]): any {
        const byType = orphanedArtifacts.reduce((acc, artifact) => {
            acc[artifact.type] = (acc[artifact.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            totalCount: orphanedArtifacts.length,
            byType,
            commonReasons: this.analyzeOrphanReasons(orphanedArtifacts),
            recommendations: this.generateOrphanRecommendations(orphanedArtifacts)
        };
    }

    /**
     * Analyze common reasons for orphaned artifacts
     */
    private analyzeOrphanReasons(orphanedArtifacts: IOrphanedArtifact[]): Array<{reason: string, count: number}> {
        const reasonCount = orphanedArtifacts.reduce((acc, artifact) => {
            acc[artifact.reason] = (acc[artifact.reason] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(reasonCount)
            .map(([reason, count]) => ({ reason, count }))
            .sort((a, b) => b.count - a.count);
    }

    /**
     * Generate recommendations for orphaned artifacts
     */
    private generateOrphanRecommendations(orphanedArtifacts: IOrphanedArtifact[]): string[] {
        const recommendations: string[] = [];

        const templateOrphans = orphanedArtifacts.filter(a => a.type === 'document-template');
        if (templateOrphans.length > 0) {
            recommendations.push(`Review ${templateOrphans.length} document templates that are not linked to work types`);
        }

        const ruleOrphans = orphanedArtifacts.filter(a => a.type === 'business-rule');
        if (ruleOrphans.length > 0) {
            recommendations.push(`Verify ${ruleOrphans.length} business rules are properly associated with work types`);
        }

        const approvalOrphans = orphanedArtifacts.filter(a => a.type === 'approval');
        if (approvalOrphans.length > 0) {
            recommendations.push(`Check ${approvalOrphans.length} approval processes for proper workflow integration`);
        }

        return recommendations;
    }

    /**
     * Generate summary of configuration analysis
     */
    private generateConfigurationSummary(analysis: IGlobalConfigAnalysis): any {
        return {
            globalSettingsCount: analysis.globalSettings.length,
            worktypeSettingsCount: analysis.worktypeSettings.length,
            overrideCount: analysis.worktypeSettings.filter(w => w.overridesGlobal).length,
            conflictCount: analysis.conflicts.length,
            highImpactChanges: analysis.dependencies.filter(d => d.impactLevel === 'high').length,
            recommendations: this.generateConfigRecommendations(analysis)
        };
    }

    /**
     * Generate configuration recommendations
     */
    private generateConfigRecommendations(analysis: IGlobalConfigAnalysis): string[] {
        const recommendations: string[] = [];

        const highImpactSettings = analysis.dependencies.filter(d => d.impactLevel === 'high');
        if (highImpactSettings.length > 0) {
            recommendations.push(`${highImpactSettings.length} global settings require careful change management`);
        }

        if (analysis.conflicts.length > 0) {
            recommendations.push(`Review ${analysis.conflicts.length} configuration conflicts for potential issues`);
        }

        const criticalDeps = analysis.dependencies.filter(d => d.changeRisk.startsWith('Critical'));
        if (criticalDeps.length > 0) {
            recommendations.push(`${criticalDeps.length} settings affect multiple worktypes - coordinate changes carefully`);
        }

        return recommendations;
    }

    /**
     * Build enriched sections with cross-reference data
     */
    private buildEnrichedSections(data: IEnhancedDocumentData, template: IDocumentTemplate): any {
        const enriched: any = {};

        // Add cross-reference enrichment to relevant sections
        template.sections.forEach(section => {
            if (section.id === 'participant-roles' && data.crossReferences.size > 0) {
                enriched[section.id] = this.enrichParticipantRolesSection(data);
            }
            
            if (section.id === 'document-templates' && data.crossReferences.size > 0) {
                enriched[section.id] = this.enrichDocumentTemplatesSection(data);
            }
            
            if (section.id === 'business-rules' && data.crossReferences.size > 0) {
                enriched[section.id] = this.enrichBusinessRulesSection(data);
            }

            if (section.id === 'system-configuration' && data.globalConfigAnalysis) {
                enriched[section.id] = this.enrichSystemConfigurationSection(data);
            }
        });

        return enriched;
    }

    /**
     * Enrich participant roles section with cross-reference data
     */
    private enrichParticipantRolesSection(data: IEnhancedDocumentData): any {
        const roles = [];
        
        // Find role artifacts in cross-references
        for (const [id, artifact] of data.crossReferences) {
            if (artifact._metadata?.type === 'role' || 
                artifact.ParticipantRoles || 
                id.includes('role')) {
                roles.push({
                    id,
                    name: artifact.Name || artifact.BaseSharedo?.Name || id,
                    description: artifact.Description || artifact.BaseSharedo?.Description,
                    permissions: artifact.Permissions || [],
                    isInternal: artifact.IsInternal,
                    canDelegate: artifact.CanDelegate
                });
            }
        }

        return {
            count: roles.length,
            roles,
            analysis: this.analyzeRoles(roles)
        };
    }

    /**
     * Enrich document templates section
     */
    private enrichDocumentTemplatesSection(data: IEnhancedDocumentData): any {
        const templates = [];
        
        for (const [id, artifact] of data.crossReferences) {
            if (artifact._metadata?.type === 'document-template') {
                templates.push({
                    id,
                    name: artifact.Name || artifact.BaseSharedo?.Name || id,
                    type: artifact.Type || 'Unknown',
                    description: artifact.Description || artifact.BaseSharedo?.Description,
                    isActive: artifact.IsActive !== false
                });
            }
        }

        return {
            count: templates.length,
            templates,
            byType: this.groupTemplatesByType(templates)
        };
    }

    /**
     * Enrich business rules section
     */
    private enrichBusinessRulesSection(data: IEnhancedDocumentData): any {
        const rules = [];
        
        for (const [id, artifact] of data.crossReferences) {
            if (artifact._metadata?.type === 'business-rule') {
                rules.push({
                    id,
                    name: artifact.Name || artifact.BaseSharedo?.Name || id,
                    description: artifact.Description || artifact.BaseSharedo?.Description,
                    conditions: artifact.Conditions || [],
                    actions: artifact.Actions || []
                });
            }
        }

        return {
            count: rules.length,
            rules,
            complexity: this.analyzeRuleComplexity(rules)
        };
    }

    /**
     * Enrich system configuration section
     */
    private enrichSystemConfigurationSection(data: IEnhancedDocumentData): any {
        const analysis = data.globalConfigAnalysis;
        
        return {
            globalSettings: {
                total: analysis.globalSettings.length,
                byCategory: this.groupGlobalSettingsByCategory(analysis.globalSettings),
                highImpact: analysis.dependencies.filter(d => d.impactLevel === 'high')
            },
            worktypeSpecific: {
                total: analysis.worktypeSettings.length,
                overrides: analysis.worktypeSettings.filter(w => w.overridesGlobal).length,
                byCategory: this.groupWorktypeSettingsByCategory(analysis.worktypeSettings)
            },
            dependencies: analysis.dependencies,
            conflicts: analysis.conflicts
        };
    }

    // Helper methods for analysis
    private analyzeRoles(roles: any[]): any {
        return {
            hasPermissions: roles.filter(r => r.permissions?.length > 0).length,
            canDelegate: roles.filter(r => r.canDelegate).length,
            internal: roles.filter(r => r.isInternal).length,
            external: roles.filter(r => !r.isInternal).length
        };
    }

    private groupTemplatesByType(templates: any[]): Record<string, number> {
        return templates.reduce((acc, template) => {
            acc[template.type] = (acc[template.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }

    private analyzeRuleComplexity(rules: any[]): any {
        return {
            simple: rules.filter(r => (r.conditions?.length || 0) <= 2 && (r.actions?.length || 0) <= 1).length,
            moderate: rules.filter(r => (r.conditions?.length || 0) > 2 && (r.conditions?.length || 0) <= 5).length,
            complex: rules.filter(r => (r.conditions?.length || 0) > 5 || (r.actions?.length || 0) > 3).length
        };
    }

    private groupGlobalSettingsByCategory(settings: any[]): Record<string, number> {
        return settings.reduce((acc, setting) => {
            acc[setting.category] = (acc[setting.category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }

    private groupWorktypeSettingsByCategory(settings: any[]): Record<string, number> {
        return settings.reduce((acc, setting) => {
            acc[setting.category] = (acc[setting.category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }
}

// Export singleton instance
export const configurableHLDGenerator = ConfigurableHLDGenerator.getInstance();