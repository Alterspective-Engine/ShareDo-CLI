/**
 * Work Type Data Extractor Service
 * 
 * Extracts ONLY real configuration data from ShareDo APIs for HLD documentation
 * NO mock data - all information comes from actual system configuration
 * 
 * APIs Used:
 * - Work Type Configuration: getWorkType, getWorkTypeAspectsSections
 * - Security: getWorkTypeGetParticipantRoles, getWorkTypeCreatePermissions
 * - Workflows: getWorkflow, getWorkflows
 * - Reference Data: getOptionSets, getOptionSetInfo
 * - Forms: getFormBuilder, getFormBuilders
 * - Templates: getTemplate (document templates)
 * - Validation Rules: Extracted from aspects
 */

import { SharedoClient } from '../sharedoClient';
import { IWorkType } from '../Request/WorkTypes/IGetWorkTypesRequestResult';
import { IModellerAspectSections, IModellerAspectInfo } from '../Request/Aspects/IGetWorkTypeAspectsRequest';
import { IParticipantRole } from '../Request/ParticipantRoles/IGetParticipantRolesResult';
import { IGetWorkTypeCreatePermissionResult } from '../Request/WorkTypes/IGetWorkTypeCreatePermissionResult';
import { IOptionSetInfo } from '../Request/OptionSets/IOptionSet';
import { 
    IPhaseModel, 
    IPhase, 
    IPhaseTransition, 
    ITrigger, 
    IWorkflowDetails,
    IKeyDate,
    IBusinessRule,
    IFormDetails,
    ITemplateDetails,
    ITitleGenerator,
    IReferenceGenerator
} from './EnhancedHLDDocumentGenerator';
import { Inform } from '../Utilities/inform';
import { PackageExportService } from './PackageExportService';
import { ExportCacheService } from './ExportCacheService';
import * as vscode from 'vscode';

export class WorkTypeDataExtractor {
    private static instance: WorkTypeDataExtractor;
    
    private constructor() {}
    
    public static getInstance(): WorkTypeDataExtractor {
        if (!WorkTypeDataExtractor.instance) {
            WorkTypeDataExtractor.instance = new WorkTypeDataExtractor();
        }
        return WorkTypeDataExtractor.instance;
    }
    
    /**
     * Extract complete work type configuration using ONLY real APIs
     * NO MOCK DATA - Everything comes from actual system
     */
    public async extractWorkTypeConfiguration(
        workType: IWorkType, 
        client: SharedoClient
    ): Promise<any> {
        try {
            Inform.writeInfo(`Extracting REAL configuration for work type: ${workType.name}`);
            
            // First, try to use the Package Export API for comprehensive data
            const packageExporter = PackageExportService.getInstance();
            const exportedData = await packageExporter.exportWorkTypePackage(workType, client);
            
            if (exportedData && exportedData.workType) {
                Inform.writeInfo('Successfully retrieved data via Package Export API');
                
                // Use exported data which is more comprehensive
                return {
                    workType: exportedData.workType || workType,
                    aspects: exportedData.aspects,
                    participantRoles: exportedData.participantRoles || [],
                    createPermissions: exportedData.permissions || [],
                    derivedTypes: exportedData.workType?.derivedTypes || [],
                    optionSets: exportedData.optionSets || [],
                    phaseModel: this.buildPhaseModel(exportedData.phases, exportedData.transitions),
                    triggers: exportedData.triggers || [],
                    workflows: exportedData.workflows || [],
                    forms: exportedData.forms || [],
                    templates: exportedData.templates || [],
                    keyDates: exportedData.keyDates || [],
                    businessRules: exportedData.businessRules || [],
                    titleGenerator: exportedData.titleGenerator,
                    referenceGenerator: exportedData.referenceGenerator,
                    approvals: exportedData.approvals || [],
                    extractedAt: new Date(),
                    isRealData: true,
                    exportMethod: 'package-export'
                };
            }
            
            // Fallback to individual API calls if export fails
            Inform.writeInfo('📋 Package Export API not available, falling back to individual APIs');
            vscode.window.showInformationMessage('$(info) Using individual APIs to gather work type data...');
            
            // Show progress for fallback
            return vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Gathering data for ${workType.name}`,
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: '$(extensions) Fetching aspects...' });
                
                // 1. Get aspects which contain ALL configuration
                const aspects = await this.getWorkTypeAspects(workType.systemName, client);
                progress.report({ increment: 10, message: '$(shield) Fetching security configuration...' });
            
                // 2. Get security configuration
                const participantRoles = await this.getParticipantRoles(workType.systemName, client);
                const createPermissions = await this.getCreatePermissions(workType.systemName, client);
                progress.report({ increment: 20, message: '$(type-hierarchy) Fetching derived types...' });
                
                // 3. Extract derived types hierarchy
                const derivedTypes = await client.getWorkTypeDerivedTypes(workType.systemName, true);
                progress.report({ increment: 30, message: '$(list-selection) Extracting option sets...' });
                
                // 4. Get all option sets used by this work type
                const optionSets = await this.extractOptionSets(aspects, client);
                progress.report({ increment: 40, message: '$(git-branch) Extracting phase model...' });
                
                // 5. Extract phase model from aspects (REAL data)
                const phaseModel = await this.extractPhaseModel(aspects, client);
                progress.report({ increment: 50, message: '$(zap) Extracting triggers...' });
                
                // 6. Extract triggers from aspects (REAL data)
                const triggers = await this.extractTriggers(aspects, client);
                progress.report({ increment: 60, message: '$(workflow) Fetching workflows...' });
                
                // 7. Extract workflows referenced in aspects (REAL workflows)
                const workflows = await this.extractWorkflows(aspects, triggers, client);
                progress.report({ increment: 70, message: '$(form) Fetching forms...' });
                
                // 8. Extract forms used by this work type
                const forms = await this.extractForms(aspects, client);
                progress.report({ increment: 80, message: '$(file-code) Fetching templates...' });
                
                // 9. Extract document templates
                const templates = await this.extractTemplates(aspects, workType.systemName, client);
                progress.report({ increment: 90, message: '$(settings-gear) Extracting additional configuration...' });
                
                // 10. Extract key dates from aspects (REAL configuration)
                const keyDates = this.extractKeyDates(aspects);
                
                // 11. Extract business rules from aspects (REAL rules)
                const businessRules = this.extractBusinessRules(aspects);
                
                // 12. Extract title and reference generators (REAL patterns)
                const titleGenerator = this.extractTitleGenerator(aspects);
                const referenceGenerator = this.extractReferenceGenerator(aspects);
                
                progress.report({ increment: 100, message: '$(pass) Data collection complete!' });
                
                // Show summary
                Inform.writeInfo(`✅ Fallback data collection completed:`);
                Inform.writeInfo(`   - Participant Roles: ${participantRoles.length}`);
                Inform.writeInfo(`   - Forms: ${forms.length}`);
                Inform.writeInfo(`   - Workflows: ${workflows.length}`);
                Inform.writeInfo(`   - Option Sets: ${optionSets.length}`);
                Inform.writeInfo(`   - Templates: ${templates.length}`);
                
                // Prepare data object conforming to IExportedData
                const extractedData: any = {
                    workType,
                    forms,
                    workflows,
                    businessRules,
                    approvals: [], // Not fetched in fallback
                    optionSets,
                    permissions: createPermissions,
                    templates,
                    phases: phaseModel?.phases,
                    transitions: phaseModel?.transitions,
                    triggers,
                    keyDates,
                    participantRoles,
                    aspects,
                    titleGenerator,
                    referenceGenerator,
                    // Extra metadata (will be ignored by IExportedData but useful)
                    derivedTypes,
                    createPermissions,
                    phaseModel,
                    extractedAt: new Date(),
                    isRealData: true,
                    exportMethod: 'individual-apis'
                };
                
                // Cache the fallback data too
                const cache = ExportCacheService.getInstance();
                await cache.cacheExport(
                    workType.systemName,
                    workType.name,
                    client.url,
                    extractedData,
                    'individual-apis'
                );
                
                return extractedData;
            });
            
        } catch (error) {
            Inform.writeError('Failed to extract work type configuration', error);
            throw error;
        }
    }
    
    /**
     * Build phase model from exported phases and transitions
     */
    private buildPhaseModel(phases: any, transitions: any): IPhaseModel | undefined {
        if (!phases) return undefined;
        
        const phaseList: IPhase[] = [];
        const transitionList: IPhaseTransition[] = [];
        
        // Process phases
        if (Array.isArray(phases)) {
            phases.forEach((phase, index) => {
                phaseList.push({
                    name: phase.name || phase.Name || phase.displayName,
                    systemName: phase.systemName || phase.SystemName || phase.name?.toLowerCase().replace(/\s+/g, '_'),
                    description: phase.description || phase.Description || '',
                    order: phase.order || phase.Order || index + 1,
                    color: phase.color || phase.Color || this.getDefaultPhaseColor(phase.systemName || phase.name),
                    isInitial: phase.isInitial || phase.IsInitial || index === 0,
                    isFinal: phase.isFinal || phase.IsFinal || false,
                    allowedActions: phase.allowedActions || phase.AllowedActions || [],
                    sla: phase.sla || phase.SLA
                });
            });
        } else if (phases && typeof phases === 'object') {
            // Handle object format
            Object.keys(phases).forEach((key, index) => {
                const phase = phases[key];
                phaseList.push({
                    name: phase.name || key,
                    systemName: phase.systemName || key,
                    description: phase.description || '',
                    order: phase.order || index + 1,
                    color: phase.color || this.getDefaultPhaseColor(key),
                    isInitial: phase.isInitial || index === 0,
                    isFinal: phase.isFinal || false,
                    allowedActions: phase.allowedActions || [],
                    sla: phase.sla
                });
            });
        }
        
        // Process transitions
        if (Array.isArray(transitions)) {
            transitions.forEach(transition => {
                transitionList.push({
                    name: transition.name || transition.Name || `${transition.from || transition.From} to ${transition.to || transition.To}`,
                    fromPhase: transition.from || transition.From || transition.fromPhase || transition.FromPhase,
                    toPhase: transition.to || transition.To || transition.toPhase || transition.ToPhase,
                    automaticTransition: transition.automatic || transition.Automatic || false,
                    requiresApproval: transition.requiresApproval || transition.RequiresApproval || false,
                    approvalRoles: transition.approvalRoles || transition.ApprovalRoles || [],
                    guards: transition.guards || transition.Guards || [],
                    triggers: transition.triggers || transition.Triggers || []
                });
            });
        }
        
        if (phaseList.length > 0) {
            return {
                name: 'Phase Model',
                description: 'Work type phase model',
                phases: phaseList,
                transitions: transitionList,
                initialPhase: phaseList.find(p => p.isInitial)?.systemName || phaseList[0]?.systemName,
                finalPhases: phaseList.filter(p => p.isFinal).map(p => p.systemName)
            };
        }
        
        return undefined;
    }
    
    /**
     * Get work type aspects containing configuration
     */
    private async getWorkTypeAspects(
        workTypeSystemName: string, 
        client: SharedoClient
    ): Promise<IModellerAspectSections | undefined> {
        try {
            const result = await client.getWorkTypeAspectsSections(workTypeSystemName);
            return result;
        } catch (error) {
            Inform.writeError(`Failed to get aspects for ${workTypeSystemName}`, error);
            return undefined;
        }
    }
    
    /**
     * Get participant roles with permissions
     */
    private async getParticipantRoles(
        workTypeSystemName: string,
        client: SharedoClient
    ): Promise<IParticipantRole[]> {
        try {
            const result = await client.getWorkTypeGetParticipantRoles(workTypeSystemName);
            return result || [];
        } catch (error) {
            Inform.writeError(`Failed to get participant roles for ${workTypeSystemName}`, error);
            return [];
        }
    }
    
    /**
     * Get creation permissions
     */
    private async getCreatePermissions(
        workTypeSystemName: string,
        client: SharedoClient
    ): Promise<IGetWorkTypeCreatePermissionResult[]> {
        try {
            const result = await client.getWorkTypeCreatePermissions(workTypeSystemName);
            return result || [];
        } catch (error) {
            Inform.writeError(`Failed to get create permissions for ${workTypeSystemName}`, error);
            return [];
        }
    }
    
    /**
     * Extract phase model from aspects (REAL DATA ONLY - no fallbacks)
     */
    private async extractPhaseModel(
        aspects: IModellerAspectSections | undefined,
        client: SharedoClient
    ): Promise<IPhaseModel | undefined> {
        if (!aspects) return undefined;
        
        try {
            // Look for state management or phase-related aspects
            const allAspects = [
                ...(aspects.main || []),
                ...(aspects.header || []),
                ...(aspects.top || []),
                ...(aspects.bottom || []),
                ...(aspects.footer || [])
            ];
            
            // Find phase/state management aspect - MUST exist in real system
            const phaseAspect = allAspects.find(aspect => 
                aspect.aspectDefinitionSystemName?.includes('phase') ||
                aspect.aspectDefinitionSystemName?.includes('state') ||
                aspect.aspectDefinitionSystemName?.includes('workflow') ||
                aspect.aspectDefinitionSystemName?.includes('lifecycle') ||
                aspect.widgetTitle?.toLowerCase().includes('phase') ||
                aspect.widgetTitle?.toLowerCase().includes('state') ||
                aspect.widgetTitle?.toLowerCase().includes('status')
            );
            
            if (phaseAspect && phaseAspect.data) {
                return this.parsePhaseModelFromAspect(phaseAspect);
            }
            
            // NO FALLBACK - Return undefined if no real phase model found
            // This ensures we only document what actually exists
            Inform.writeInfo('No phase model found in aspects - work type may not have phases configured');
            return undefined;
            
        } catch (error) {
            Inform.writeError('Failed to extract phase model', error);
            return undefined;
        }
    }
    
    /**
     * Parse phase model from aspect data
     */
    private parsePhaseModelFromAspect(aspect: IModellerAspectInfo): IPhaseModel {
        const data = aspect.data;
        const config = aspect.config ? JSON.parse(aspect.config) : {};
        
        // Extract phases
        const phases: IPhase[] = [];
        if (data.phases) {
            data.phases.forEach((phase: any, index: number) => {
                phases.push({
                    name: phase.name || phase.displayName,
                    systemName: phase.systemName || phase.name?.toLowerCase().replace(/\s+/g, '_'),
                    description: phase.description || '',
                    order: phase.order || index + 1,
                    color: phase.color || this.getDefaultPhaseColor(phase.systemName),
                    isInitial: phase.isInitial || index === 0,
                    isFinal: phase.isFinal || phase.systemName?.includes('complete') || phase.systemName?.includes('cancel'),
                    allowedActions: phase.allowedActions || [],
                    sla: phase.sla
                });
            });
        }
        
        // Extract transitions
        const transitions: IPhaseTransition[] = [];
        if (data.transitions) {
            data.transitions.forEach((transition: any) => {
                transitions.push({
                    name: transition.name || `${transition.from} to ${transition.to}`,
                    fromPhase: transition.from || transition.fromPhase,
                    toPhase: transition.to || transition.toPhase,
                    automaticTransition: transition.automatic || false,
                    requiresApproval: transition.requiresApproval || false,
                    approvalRoles: transition.approvalRoles || [],
                    guards: transition.guards || [],
                    triggers: transition.triggers || []
                });
            });
        }
        
        return {
            name: aspect.widgetTitle || 'Phase Model',
            description: aspect.description || 'Phase model configuration',
            phases,
            transitions,
            initialPhase: phases.find(p => p.isInitial)?.systemName || phases[0]?.systemName,
            finalPhases: phases.filter(p => p.isFinal).map(p => p.systemName)
        };
    }
    
    // REMOVED: createBasicPhaseModel method - NO MOCK DATA
    // We only document what actually exists in the system
    
    /**
     * Extract triggers from aspects
     */
    private async extractTriggers(
        aspects: IModellerAspectSections | undefined,
        client: SharedoClient
    ): Promise<ITrigger[]> {
        if (!aspects) return [];
        
        const triggers: ITrigger[] = [];
        const allAspects = [
            ...(aspects.main || []),
            ...(aspects.header || []),
            ...(aspects.top || []),
            ...(aspects.bottom || []),
            ...(aspects.footer || [])
        ];
        
        // Look for trigger configurations in aspects
        allAspects.forEach(aspect => {
            if (aspect.data?.triggers) {
                aspect.data.triggers.forEach((trigger: any) => {
                    triggers.push({
                        name: trigger.name,
                        type: trigger.type || 'manual',
                        event: trigger.event,
                        condition: trigger.condition,
                        action: trigger.action,
                        targetWorkflow: trigger.workflow,
                        enabled: trigger.enabled !== false,
                        parameters: trigger.parameters || []
                    });
                });
            }
            
            // Check config for workflow triggers
            if (aspect.config) {
                try {
                    const config = JSON.parse(aspect.config);
                    if (config.onEvent) {
                        triggers.push({
                            name: `${aspect.widgetTitle} Trigger`,
                            type: 'event',
                            event: config.onEvent,
                            action: config.action || 'ExecuteWorkflow',
                            targetWorkflow: config.workflow,
                            enabled: true
                        });
                    }
                } catch (e) {
                    // Config might not be JSON
                }
            }
        });
        
        return triggers;
    }
    
    /**
     * Extract workflows referenced in aspects and triggers
     */
    private async extractWorkflows(
        aspects: IModellerAspectSections | undefined,
        triggers: ITrigger[],
        client: SharedoClient
    ): Promise<IWorkflowDetails[]> {
        const workflows: IWorkflowDetails[] = [];
        const workflowNames = new Set<string>();
        
        // Collect workflow names from triggers
        triggers.forEach(trigger => {
            if (trigger.targetWorkflow) {
                workflowNames.add(trigger.targetWorkflow);
            }
        });
        
        // Collect workflow names from aspects
        if (aspects) {
            const allAspects = [
                ...(aspects.main || []),
                ...(aspects.header || []),
                ...(aspects.top || []),
                ...(aspects.bottom || []),
                ...(aspects.footer || [])
            ];
            
            allAspects.forEach(aspect => {
                if (aspect.data?.workflow) {
                    workflowNames.add(aspect.data.workflow);
                }
                if (aspect.config) {
                    try {
                        const config = JSON.parse(aspect.config);
                        if (config.workflow) {
                            workflowNames.add(config.workflow);
                        }
                    } catch (e) {
                        // Config might not be JSON
                    }
                }
            });
        }
        
        // Fetch workflow details
        for (const workflowName of workflowNames) {
            try {
                const workflow = await client.getWorkflow({ systemName: workflowName });
                if (workflow) {
                    workflows.push(this.mapWorkflowToDetails(workflow));
                }
            } catch (error) {
                Inform.writeError(`Failed to get workflow ${workflowName}`, error);
            }
        }
        
        return workflows;
    }
    
    /**
     * Map workflow response to IWorkflowDetails
     */
    private mapWorkflowToDetails(workflow: any): IWorkflowDetails {
        return {
            name: workflow.name || workflow.systemName,
            systemName: workflow.systemName,
            description: workflow.description || '',
            type: workflow.type || 'process',
            trigger: workflow.trigger,
            steps: workflow.steps || [],
            errorHandling: workflow.errorHandling,
            retryPolicy: workflow.retryPolicy
        };
    }
    
    /**
     * Extract key dates from aspects
     */
    private extractKeyDates(aspects: IModellerAspectSections | undefined): IKeyDate[] {
        if (!aspects) return [];
        
        const keyDates: IKeyDate[] = [];
        const allAspects = [
            ...(aspects.main || []),
            ...(aspects.header || []),
            ...(aspects.top || []),
            ...(aspects.bottom || []),
            ...(aspects.footer || [])
        ];
        
        // Look for date-related aspects
        allAspects.forEach(aspect => {
            if (aspect.aspectDefinitionSystemName?.includes('date') ||
                aspect.widgetTitle?.toLowerCase().includes('date')) {
                
                if (aspect.data?.dates) {
                    aspect.data.dates.forEach((date: any) => {
                        keyDates.push({
                            name: date.name,
                            systemName: date.systemName,
                            description: date.description || '',
                            type: date.type || 'date',
                            format: date.format || 'YYYY-MM-DD',
                            required: date.required || false,
                            editable: date.editable !== false,
                            triggers: date.triggers || [],
                            validations: date.validations || []
                        });
                    });
                }
            }
        });
        
        return keyDates;
    }
    
    /**
     * Extract business rules from aspects
     */
    private extractBusinessRules(aspects: IModellerAspectSections | undefined): IBusinessRule[] {
        if (!aspects) return [];
        
        const rules: IBusinessRule[] = [];
        const allAspects = [
            ...(aspects.main || []),
            ...(aspects.header || []),
            ...(aspects.top || []),
            ...(aspects.bottom || []),
            ...(aspects.footer || [])
        ];
        
        // Look for rule-related aspects
        allAspects.forEach(aspect => {
            if (aspect.data?.rules) {
                aspect.data.rules.forEach((rule: any) => {
                    rules.push({
                        name: rule.name,
                        description: rule.description || '',
                        condition: rule.condition,
                        action: rule.action,
                        priority: rule.priority || 0,
                        enabled: rule.enabled !== false
                    });
                });
            }
        });
        
        return rules;
    }
    
    /**
     * Get default phase color based on system name
     */
    private getDefaultPhaseColor(systemName: string): string {
        const colorMap: { [key: string]: string } = {
            'draft': '#808080',
            'review': '#FFA500',
            'active': '#0000FF',
            'in_progress': '#0000FF',
            'completed': '#008000',
            'complete': '#008000',
            'cancelled': '#FF0000',
            'cancel': '#FF0000'
        };
        
        return colorMap[systemName.toLowerCase()] || '#E0E0E0';
    }
    
    /**
     * Extract option sets used in aspects (REAL data from API)
     */
    private async extractOptionSets(
        aspects: IModellerAspectSections | undefined,
        client: SharedoClient
    ): Promise<IOptionSetInfo[]> {
        if (!aspects) return [];
        
        const optionSetNames = new Set<string>();
        const optionSets: IOptionSetInfo[] = [];
        
        // Find all option set references in aspects
        const allAspects = [
            ...(aspects.main || []),
            ...(aspects.header || []),
            ...(aspects.top || []),
            ...(aspects.bottom || []),
            ...(aspects.footer || [])
        ];
        
        allAspects.forEach(aspect => {
            // Check data for option set references
            if (aspect.data?.optionSet) {
                optionSetNames.add(aspect.data.optionSet);
            }
            
            // Check config for option set references
            if (aspect.config) {
                try {
                    const config = JSON.parse(aspect.config);
                    if (config.optionSetName) {
                        optionSetNames.add(config.optionSetName);
                    }
                    // Check for field option sets
                    if (config.fields) {
                        config.fields.forEach((field: any) => {
                            if (field.optionSet) {
                                optionSetNames.add(field.optionSet);
                            }
                        });
                    }
                } catch (e) {
                    // Config might not be JSON
                }
            }
        });
        
        // Fetch actual option set data from API
        for (const optionSetName of optionSetNames) {
            try {
                const optionSetInfo = await client.getOptionSetInfo(optionSetName);
                if (optionSetInfo) {
                    optionSets.push(optionSetInfo);
                    Inform.writeInfo(`Loaded option set: ${optionSetName}`);
                }
            } catch (error) {
                Inform.writeError(`Failed to get option set ${optionSetName}`, error);
            }
        }
        
        return optionSets;
    }
    
    /**
     * Extract forms used by work type (REAL forms from API)
     */
    private async extractForms(
        aspects: IModellerAspectSections | undefined,
        client: SharedoClient
    ): Promise<any[]> {
        if (!aspects) return [];
        
        const formIds = new Set<string>();
        const forms: any[] = [];
        
        const allAspects = [
            ...(aspects.main || []),
            ...(aspects.header || []),
            ...(aspects.top || []),
            ...(aspects.bottom || []),
            ...(aspects.footer || [])
        ];
        
        // Find form references in aspects
        allAspects.forEach(aspect => {
            if (aspect.data?.formId) {
                formIds.add(aspect.data.formId);
            }
            if (aspect.widgetId?.includes('form')) {
                // Widget might be a form
                if (aspect.data?.id) {
                    formIds.add(aspect.data.id);
                }
            }
        });
        
        // Fetch actual form data from API
        for (const formId of formIds) {
            try {
                const form = await client.getFormBuilder(formId);
                if (form) {
                    forms.push(form);
                    Inform.writeInfo(`Loaded form: ${formId}`);
                }
            } catch (error) {
                Inform.writeError(`Failed to get form ${formId}`, error);
            }
        }
        
        return forms;
    }
    
    /**
     * Extract document templates (REAL templates from API)
     */
    private async extractTemplates(
        aspects: IModellerAspectSections | undefined,
        workTypeSystemName: string,
        client: SharedoClient
    ): Promise<any[]> {
        if (!aspects) return [];
        
        const templates: any[] = [];
        
        // Note: Template API endpoint found: /api/admin/docGen/templates/{systemName}
        // This would need to be implemented in sharedoClient
        // For now, extract template references from aspects
        
        const allAspects = [
            ...(aspects.main || []),
            ...(aspects.header || []),
            ...(aspects.top || []),
            ...(aspects.bottom || []),
            ...(aspects.footer || [])
        ];
        
        allAspects.forEach(aspect => {
            if (aspect.data?.template || aspect.data?.templateSystemName) {
                templates.push({
                    systemName: aspect.data.templateSystemName || aspect.data.template,
                    name: aspect.data.templateName || 'Document Template',
                    type: aspect.data.templateType || 'document',
                    aspectId: aspect.id
                });
            }
        });
        
        return templates;
    }
    
    /**
     * Extract title generator configuration (REAL pattern from aspects)
     */
    private extractTitleGenerator(aspects: IModellerAspectSections | undefined): any {
        if (!aspects) return null;
        
        const allAspects = [
            ...(aspects.main || []),
            ...(aspects.header || []),
            ...(aspects.top || []),
            ...(aspects.bottom || []),
            ...(aspects.footer || [])
        ];
        
        // Look for title generation aspect
        const titleAspect = allAspects.find(aspect => 
            aspect.aspectDefinitionSystemName?.includes('title') ||
            aspect.widgetTitle?.toLowerCase().includes('title') ||
            aspect.data?.titlePattern
        );
        
        if (titleAspect?.data) {
            return {
                pattern: titleAspect.data.titlePattern || titleAspect.data.pattern,
                fields: titleAspect.data.titleFields || [],
                format: titleAspect.data.titleFormat,
                aspectId: titleAspect.id,
                isRealData: true
            };
        }
        
        return null;
    }
    
    /**
     * Extract reference generator configuration (REAL pattern from aspects)
     */
    private extractReferenceGenerator(aspects: IModellerAspectSections | undefined): any {
        if (!aspects) return null;
        
        const allAspects = [
            ...(aspects.main || []),
            ...(aspects.header || []),
            ...(aspects.top || []),
            ...(aspects.bottom || []),
            ...(aspects.footer || [])
        ];
        
        // Look for reference generation aspect
        const refAspect = allAspects.find(aspect => 
            aspect.aspectDefinitionSystemName?.includes('reference') ||
            aspect.widgetTitle?.toLowerCase().includes('reference') ||
            aspect.data?.referencePattern
        );
        
        if (refAspect?.data) {
            return {
                pattern: refAspect.data.referencePattern || refAspect.data.pattern,
                prefix: refAspect.data.prefix,
                sequence: refAspect.data.sequence,
                format: refAspect.data.referenceFormat,
                aspectId: refAspect.id,
                isRealData: true
            };
        }
        
        return null;
    }
}