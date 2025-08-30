/**
 * Mock Data Tester for Configurable HLD Generator
 * 
 * Uses real JSON data from fullExport to test document generation
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { ConfigurableHLDGenerator } from '../services/ConfigurableHLDGenerator';
import { IEnhancedHLDData } from '../services/EnhancedHLDDocumentGenerator';
import { IWorkType } from '../Request/WorkTypes/IGetWorkTypesRequestResult';
import { IWorkTypeExtended } from '../services/interfaces/IWorkTypeExtended';
import { SharedoClient } from '../sharedoClient';

export class MockDataTester {
    private generator: ConfigurableHLDGenerator;
    private mockDataPath: string;

    constructor() {
        this.generator = ConfigurableHLDGenerator.getInstance();
        this.mockDataPath = 'C:\\GitHub\\LearnSD\\fullExport\\data';
    }

    /**
     * Load JSON data from fullExport
     */
    async loadMockData(filename: string): Promise<any> {
        const filePath = path.join(this.mockDataPath, filename);
        const content = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(content);
    }

    /**
     * Convert JSON data to IWorkType format
     */
    convertToWorkType(jsonData: any): IWorkTypeExtended {
        const baseSharedo = jsonData.BaseSharedo;
        
        return {
            name: baseSharedo.Name,
            systemName: baseSharedo.SystemName,
            description: baseSharedo.Description || 'No description available',
            isActive: baseSharedo.IsActive,
            isAbstract: baseSharedo.IsAbstract,
            isCoreType: baseSharedo.IsCoreCaseType,
            systemNamePath: baseSharedo.SystemNamePath,
            icon: baseSharedo.IconClass || 'fa-cogs',
            derivedTypes: [],
            hasPortals: false,
            tileColour: baseSharedo.TileColour,
            // Extended properties
            iconClass: baseSharedo.IconClass,
            category: baseSharedo.CategoryOptionSetSystemName,
            tags: this.extractTags(jsonData),
            shortName: baseSharedo.ShortName,
            allowsTimeEntry: baseSharedo.AllowsTimeEntry,
            canGenerateEmail: baseSharedo.CanGenerateEmail,
            parentSystemName: baseSharedo.ParentSystemName
        };
    }

    /**
     * Extract relevant tags from JSON data
     */
    private extractTags(jsonData: any): string[] {
        const tags: string[] = [];
        
        if (jsonData.BaseSharedo?.ParentSystemName) {
            tags.push(jsonData.BaseSharedo.ParentSystemName);
        }
        
        if (jsonData.BaseSharedo?.AllowsTimeEntry) {
            tags.push('time-recording');
        }
        
        if (jsonData.BaseSharedo?.CanGenerateEmail) {
            tags.push('email-generation');
        }
        
        if (jsonData.FeatureFrameworkEntries?.length > 0) {
            tags.push('feature-rich');
        }
        
        if (jsonData.PhasePlan) {
            tags.push('workflow');
        }
        
        return tags;
    }

    /**
     * Create enhanced HLD data from JSON
     */
    createEnhancedHLDData(jsonData: any, workType: IWorkType): IEnhancedHLDData {
        return {
            metadata: {
                title: `${workType.name} Documentation`,
                version: '1.0',
                author: 'ShareDo HLD Generator (Mock Data Test)',
                createdDate: new Date(),
                lastModified: new Date(),
                serverUrl: 'https://demo.sharedo.com',
                documentId: `hld-${workType.systemName}-${Date.now()}`,
                classification: 'Internal',
                confidentiality: 'Confidential'
            },
            workType: {
                name: workType.name,
                systemName: workType.systemName,
                description: workType.description,
                isActive: workType.isActive,
                isAbstract: workType.isAbstract,
                isCoreType: workType.isCoreType || false,
                hasPortals: this.hasPortals(jsonData),
                icon: (workType as IWorkTypeExtended).iconClass || 'fa-cogs',
                systemNamePath: workType.systemNamePath,
                category: (workType as IWorkTypeExtended).category,
                tags: (workType as IWorkTypeExtended).tags,
                tileColour: (workType as any).tileColour,
                owner: 'System Administrator',
                version: '1.0'
            },
            derivedTypes: this.extractDerivedTypes(jsonData),
            participantRoles: this.extractParticipantRoles(jsonData),
            createPermissions: this.extractCreatePermissions(jsonData),
            titleGenerator: this.extractTitleGenerator(jsonData),
            referenceGenerator: this.extractReferenceGenerator(jsonData),
            phaseModel: this.extractPhaseModel(jsonData),
            triggers: this.extractTriggers(jsonData),
            keyDates: this.extractKeyDates(jsonData),
            workflows: this.extractWorkflows(jsonData),
            aspects: this.extractAspects(jsonData),
            forms: this.extractForms(jsonData),
            templates: this.extractTemplates(jsonData),
            businessRules: this.extractBusinessRules(jsonData),
            integrations: this.extractIntegrations(jsonData),
            optionSets: this.extractOptionSets(jsonData)
        };
    }

    private hasPortals(jsonData: any): boolean {
        return jsonData.PortalWorkTypes?.length > 0 || false;
    }

    private extractDerivedTypes(jsonData: any): any[] {
        // Extract child types from relationships
        const relationships = jsonData.Relationships || [];
        return relationships
            .filter((rel: any) => rel.ParentSharedoTypeSystemName === jsonData.BaseSharedo?.SystemName)
            .map((rel: any) => ({
                systemName: rel.ChildSharedoTypeSystemName,
                relationshipType: rel.SharedoRelationshipTypeSystemName
            }));
    }

    private extractParticipantRoles(jsonData: any): any[] {
        const roles = jsonData.ParticipantRoles || [];
        return roles.map((role: any) => ({
            systemName: role.SystemName,
            name: role.Name,
            description: role.Description,
            isInternal: role.IsInternal,
            canDelegate: role.CanDelegate,
            permissions: role.Permissions || []
        }));
    }

    private extractCreatePermissions(jsonData: any): any[] {
        return jsonData.CreatePermissions || [];
    }

    private extractTitleGenerator(jsonData: any): any {
        const titleGen = jsonData.TitleGenerator;
        if (!titleGen) return null;
        
        return {
            pattern: titleGen.Pattern,
            fields: titleGen.Fields || [],
            separator: titleGen.Separator || ' - '
        };
    }

    private extractReferenceGenerator(jsonData: any): any {
        const refGen = jsonData.ReferenceGenerator;
        if (!refGen) return null;
        
        return {
            pattern: refGen.Pattern,
            prefix: refGen.Prefix,
            suffix: refGen.Suffix,
            increment: refGen.Increment
        };
    }

    private extractPhaseModel(jsonData: any): any {
        const phasePlan = jsonData.PhasePlan;
        const phases = jsonData.Phases || [];
        const transitions = jsonData.PhaseTransitions || [];
        
        if (!phasePlan && phases.length === 0) return null;
        
        return {
            systemName: phasePlan?.SystemName || 'default-phases',
            name: phasePlan?.Name || 'Phase Model',
            phases: phases.map((phase: any) => ({
                systemName: phase.SystemName,
                name: phase.Name,
                description: phase.Description,
                isStart: phase.IsStart,
                isOpen: phase.IsOpen,
                iconClass: phase.IconClass,
                expectedDuration: phase.ExpectedDurationSeconds
            })),
            transitions: transitions.map((trans: any) => ({
                from: trans.FromPhaseSystemName,
                to: trans.ToPhaseSystemName,
                name: trans.Name,
                isOptimumPath: trans.IsOptimumPath,
                isUserDriven: trans.IsUserDriven
            })),
            graphLayout: phasePlan?.GraphLayout
        };
    }

    private extractTriggers(jsonData: any): any[] {
        const triggers = jsonData.Triggers || [];
        return triggers.map((trigger: any) => ({
            id: trigger.Id,
            name: trigger.Name,
            description: trigger.Description,
            eventType: trigger.EventType,
            conditions: trigger.Conditions || [],
            actions: trigger.Actions || []
        }));
    }

    private extractKeyDates(jsonData: any): any[] {
        const keyDates = jsonData.KeyDates || [];
        return keyDates.map((kd: any) => ({
            systemName: kd.SystemName,
            name: kd.Name,
            description: kd.Description,
            isRequired: kd.IsRequired,
            category: kd.Category
        }));
    }

    private extractWorkflows(jsonData: any): any[] {
        const workflows = jsonData.Workflows || jsonData.VisualWorkflows || [];
        return workflows.map((wf: any) => ({
            id: wf.Id,
            name: wf.Name,
            description: wf.Description,
            steps: wf.Steps || [],
            isActive: wf.IsActive
        }));
    }

    private extractAspects(jsonData: any): any[] {
        const aspects = jsonData.Aspects || [];
        return aspects.map((aspect: any) => ({
            systemName: aspect.SystemName,
            name: aspect.Name,
            category: aspect.Category,
            value: aspect.Value,
            description: aspect.Description
        }));
    }

    private extractForms(jsonData: any): any[] {
        const forms = jsonData.Forms || [];
        return forms.map((form: any) => ({
            id: form.Id,
            name: form.Name,
            description: form.Description,
            fields: form.Fields || []
        }));
    }

    private extractTemplates(jsonData: any): any[] {
        const templates = jsonData.DocumentTemplates || [];
        return templates.map((template: any) => ({
            id: template.Id,
            name: template.Name,
            type: template.Type,
            description: template.Description
        }));
    }

    private extractBusinessRules(jsonData: any): any[] {
        const rules = jsonData.BusinessRules || [];
        return rules.map((rule: any) => ({
            id: rule.Id,
            name: rule.Name,
            description: rule.Description,
            conditions: rule.Conditions || [],
            actions: rule.Actions || []
        }));
    }

    private extractIntegrations(jsonData: any): any[] {
        const integrations = jsonData.Integrations || [];
        return integrations.map((integration: any) => ({
            id: integration.Id,
            name: integration.Name,
            type: integration.Type,
            endpoint: integration.Endpoint,
            description: integration.Description
        }));
    }

    private extractOptionSets(jsonData: any): any[] {
        return jsonData.OptionSets || [];
    }

    /**
     * Create a mock ShareDo client
     */
    createMockClient(): SharedoClient {
        return {
            getBaseUrl: () => 'https://demo.sharedo.com',
            get: async (endpoint: string) => {
                // Return mock data based on endpoint
                if (endpoint.includes('participantroles')) {
                    return { items: [] };
                }
                if (endpoint.includes('permissions')) {
                    return { items: [] };
                }
                if (endpoint.includes('workflows')) {
                    return { items: [] };
                }
                return { items: [] };
            },
            post: async () => ({}),
            put: async () => ({}),
            delete: async () => ({})
        } as any;
    }

    /**
     * Test document generation with mock data
     */
    async testDocumentGeneration(
        jsonFilename: string,
        templateId: string
    ): Promise<{ buffer: Buffer; workType: IWorkType; data: IEnhancedHLDData }> {
        console.log(`Testing ${templateId} with ${jsonFilename}...`);
        
        // Load and convert data
        const jsonData = await this.loadMockData(jsonFilename);
        const workType = this.convertToWorkType(jsonData);
        const mockClient = this.createMockClient();
        
        // Create enhanced data
        const enhancedData = this.createEnhancedHLDData(jsonData, workType);
        
        // Override the generator's data collection to use our mock data
        const originalMethod = (this.generator as any).collectAllData;
        (this.generator as any).collectAllData = async () => enhancedData;
        
        try {
            // Generate document
            const buffer = await this.generator.generateWithTemplate(
                workType,
                mockClient,
                templateId
            );
            
            return { buffer, workType, data: enhancedData };
        } finally {
            // Restore original method
            (this.generator as any).collectAllData = originalMethod;
        }
    }

    /**
     * Save test results
     */
    async saveTestResults(
        results: { buffer: Buffer; workType: IWorkType; data: IEnhancedHLDData },
        templateId: string,
        outputDir: string
    ): Promise<string> {
        await fs.mkdir(outputDir, { recursive: true });
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `${results.workType.systemName}_${templateId}_${timestamp}.docx`;
        const filepath = path.join(outputDir, filename);
        
        await fs.writeFile(filepath, results.buffer);
        return filepath;
    }

    /**
     * Run comprehensive test suite
     */
    async runTestSuite(): Promise<any> {
        const testFiles = [
            'sharedo-type-matter-dispute-claimant-cica-75b62c18-30a2-4efb-9a65-b33700080a4f.json',
            'sharedo-type-matter-dispute-claimant-3633672c-a1e1-49ed-8b50-b33700080a4f.json',
            'sharedo-type-core-matter-corporate-6fbb77bc-f1d4-4f77-a6f8-b33700080a4f.json'
        ];

        const templates = [
            'business-analyst',
            'system-admin',
            'support-consultant',
            'legal-admin-cheatsheet',
            'lawyer-cheatsheet'
        ];

        const results: any = {
            summary: {
                totalTests: testFiles.length * templates.length,
                successful: 0,
                failed: 0,
                startTime: new Date(),
                endTime: null as Date | null
            },
            tests: [] as any[],
            errors: [] as any[]
        };

        const outputDir = path.join(__dirname, '..', '..', 'test-output');

        for (const testFile of testFiles) {
            for (const template of templates) {
                try {
                    console.log(`Testing ${template} with ${testFile}...`);
                    
                    const testResult = await this.testDocumentGeneration(testFile, template);
                    const savedPath = await this.saveTestResults(testResult, template, outputDir);
                    
                    const testInfo = {
                        testFile,
                        template,
                        workType: testResult.workType.name,
                        success: true,
                        documentPath: savedPath,
                        documentSize: testResult.buffer.length,
                        dataAnalysis: this.analyzeData(testResult.data),
                        timestamp: new Date()
                    };
                    
                    results.tests.push(testInfo);
                    results.summary.successful++;
                    
                    console.log(`✅ Success: ${template} for ${testResult.workType.name} (${testResult.buffer.length} bytes)`);
                    
                } catch (error) {
                    const errorInfo = {
                        testFile,
                        template,
                        error: error instanceof Error ? error.message : String(error),
                        timestamp: new Date()
                    };
                    
                    results.errors.push(errorInfo);
                    results.summary.failed++;
                    
                    console.log(`❌ Failed: ${template} with ${testFile} - ${errorInfo.error}`);
                }
            }
        }

        results.summary.endTime = new Date();
        return results;
    }

    /**
     * Analyze data quality
     */
    private analyzeData(data: IEnhancedHLDData): any {
        return {
            hasPhaseModel: !!data.phaseModel,
            phaseCount: data.phaseModel?.phases?.length || 0,
            participantRoleCount: data.participantRoles?.length || 0,
            triggerCount: data.triggers?.length || 0,
            workflowCount: data.workflows?.length || 0,
            aspectCount: data.aspects?.length || 0,
            businessRuleCount: data.businessRules?.length || 0,
            hasIntegrations: (data.integrations?.length || 0) > 0,
            hasTitleGenerator: !!data.titleGenerator,
            hasReferenceGenerator: !!data.referenceGenerator
        };
    }
}

// Export for use in tests
export default MockDataTester;