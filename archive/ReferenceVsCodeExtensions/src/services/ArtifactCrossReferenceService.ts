/**
 * Artifact Cross-Reference Service
 * 
 * Provides functionality to:
 * 1. Identify orphaned artifacts that don't link to work items
 * 2. Create cross-reference lookup system for artifact enrichment
 * 3. Distinguish between worktype-level and global configuration settings
 * 4. Analyze dependencies between global settings and worktypes
 */

import * as fs from 'fs/promises';
import * as path from 'path';

// Interfaces for enhanced functionality
export interface IOrphanedArtifact {
    id: string;
    type: string;
    name: string;
    filename: string;
    systemName?: string;
    description?: string;
    parentType?: string;
    reason: string; // Why it's considered orphaned
}

export interface ICrossReference {
    artifactId: string;
    type: string;
    data: any;
    relationships: IRelationship[];
}

export interface IRelationship {
    relatedId: string;
    relatedType: string;
    relationshipType: string;
    direction: 'parent' | 'child' | 'sibling';
}

export interface IGlobalConfigAnalysis {
    globalSettings: IGlobalSetting[];
    worktypeSettings: IWorktypeSetting[];
    dependencies: IDependencyMap[];
    conflicts: IConflict[];
}

export interface IGlobalSetting {
    id: string;
    name: string;
    type: string;
    filename: string;
    systemName: string;
    description?: string;
    affectedWorktypes: string[];
    category: 'system' | 'feature' | 'security' | 'integration' | 'ui' | 'business';
}

export interface IWorktypeSetting {
    id: string;
    name: string;
    type: string;
    filename: string;
    worktypeId: string;
    worktypeName: string;
    category: 'workflow' | 'roles' | 'features' | 'templates' | 'validation';
    overridesGlobal: boolean;
    globalSettingId?: string;
}

export interface IDependencyMap {
    globalSettingId: string;
    globalSettingName: string;
    dependentWorktypes: string[];
    impactLevel: 'high' | 'medium' | 'low';
    changeRisk: string;
}

export interface IConflict {
    type: 'override' | 'incompatible' | 'duplicate';
    globalId: string;
    worktypeId: string;
    description: string;
    resolution: string;
}

export class ArtifactCrossReferenceService {
    private crossReferences: Map<string, ICrossReference> = new Map();
    private artifactData: Map<string, any> = new Map();
    private workTypeArtifacts: Set<string> = new Set();
    private globalArtifacts: Set<string> = new Set();

    /**
     * Load and analyze all artifacts from the export directory
     */
    async loadFullExport(exportPath: string): Promise<void> {
        console.log(`Loading full export from ${exportPath}...`);
        
        try {
            const files = await fs.readdir(exportPath);
            const jsonFiles = files.filter(f => f.endsWith('.json'));
            
            console.log(`Found ${jsonFiles.length} JSON files to analyze`);

            // Load all JSON files
            for (const filename of jsonFiles) {
                await this.loadArtifactFile(path.join(exportPath, filename), filename);
            }

            // Build cross-references
            this.buildCrossReferences();
            
            // Categorize artifacts
            this.categorizeArtifacts();

            console.log(`Loaded ${this.artifactData.size} artifacts`);
            console.log(`Built ${this.crossReferences.size} cross-references`);
        } catch (error) {
            console.error('Failed to load full export:', error);
            throw error;
        }
    }

    /**
     * Load a single artifact file
     */
    private async loadArtifactFile(filePath: string, filename: string): Promise<void> {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const data = JSON.parse(content);
            
            if (data && typeof data === 'object') {
                const artifactId = this.extractArtifactId(data, filename);
                this.artifactData.set(artifactId, {
                    ...data,
                    _metadata: {
                        filename,
                        filePath,
                        type: this.determineArtifactType(data, filename),
                        loadedAt: new Date()
                    }
                });
            }
        } catch (error: any) {
            console.warn(`Failed to load artifact ${filename}:`, error?.message || error);
        }
    }

    /**
     * Extract artifact ID from data or filename
     */
    private extractArtifactId(data: any, filename: string): string {
        // Try common ID fields
        if (data.Id) return data.Id;
        if (data.BaseSharedo?.Id) return data.BaseSharedo.Id;
        if (data.SystemName) return data.SystemName;
        if (data.BaseSharedo?.SystemName) return data.BaseSharedo.SystemName;
        
        // Extract from filename (remove extension and potential GUID suffix)
        const nameWithoutExt = filename.replace('.json', '');
        const parts = nameWithoutExt.split('-');
        
        // If last part looks like a GUID, remove it
        if (parts.length > 1 && parts[parts.length - 1].match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            return parts.slice(0, -1).join('-');
        }
        
        return nameWithoutExt;
    }

    /**
     * Determine artifact type from data and filename
     */
    private determineArtifactType(data: any, filename: string): string {
        // Check filename patterns first
        if (filename.startsWith('sharedo-type-')) return 'worktype';
        if (filename.startsWith('global-')) return 'global-setting';
        if (filename.startsWith('document-template-')) return 'document-template';
        if (filename.startsWith('business-rule-')) return 'business-rule';
        if (filename.startsWith('approval-')) return 'approval';
        if (filename.startsWith('list-view-')) return 'list-view';
        if (filename.startsWith('execution-engine-')) return 'execution-engine';
        if (filename.startsWith('EventEngine')) return 'event-engine';
        
        // Check data structure
        if (data.BaseSharedo && data.BaseSharedo.SystemName) {
            if (data.Phases || data.PhaseTransitions) return 'worktype';
            if (data.ParticipantRoles) return 'worktype';
        }
        
        if (data.FeatureFrameworkEntries) return 'worktype';
        if (data.GlobalFeature) return 'global-feature';
        if (data.DocumentTemplate) return 'document-template';
        if (data.BusinessRule) return 'business-rule';
        
        return 'unknown';
    }

    /**
     * Build cross-references between artifacts
     */
    private buildCrossReferences(): void {
        for (const [artifactId, data] of this.artifactData) {
            const relationships = this.findRelationships(artifactId, data);
            
            this.crossReferences.set(artifactId, {
                artifactId,
                type: data._metadata.type,
                data,
                relationships
            });
        }
    }

    /**
     * Find relationships for an artifact
     */
    private findRelationships(artifactId: string, data: any): IRelationship[] {
        const relationships: IRelationship[] = [];
        
        // Check for parent relationships
        if (data.BaseSharedo?.ParentSystemName) {
            relationships.push({
                relatedId: data.BaseSharedo.ParentSystemName,
                relatedType: 'worktype',
                relationshipType: 'inherits-from',
                direction: 'parent'
            });
        }

        // Check for phase relationships
        if (data.Phases) {
            data.Phases.forEach((phase: any) => {
                if (phase.SystemName) {
                    relationships.push({
                        relatedId: phase.SystemName,
                        relatedType: 'phase',
                        relationshipType: 'contains',
                        direction: 'child'
                    });
                }
            });
        }

        // Check for role relationships
        if (data.ParticipantRoles) {
            data.ParticipantRoles.forEach((role: any) => {
                if (role.SystemName) {
                    relationships.push({
                        relatedId: role.SystemName,
                        relatedType: 'role',
                        relationshipType: 'defines',
                        direction: 'child'
                    });
                }
            });
        }

        // Check for template relationships
        if (data.DocumentTemplates) {
            data.DocumentTemplates.forEach((template: any) => {
                if (template.Id || template.SystemName) {
                    relationships.push({
                        relatedId: template.Id || template.SystemName,
                        relatedType: 'document-template',
                        relationshipType: 'uses',
                        direction: 'child'
                    });
                }
            });
        }

        // Check feature framework entries
        if (data.FeatureFrameworkEntries) {
            data.FeatureFrameworkEntries.forEach((feature: any) => {
                if (feature.FeatureSystemName) {
                    relationships.push({
                        relatedId: feature.FeatureSystemName,
                        relatedType: 'global-feature',
                        relationshipType: 'implements',
                        direction: 'sibling'
                    });
                }
            });
        }

        return relationships;
    }

    /**
     * Categorize artifacts as worktype-specific or global
     */
    private categorizeArtifacts(): void {
        for (const [artifactId, data] of this.artifactData) {
            const type = data._metadata.type;
            
            // Global artifacts
            if (type.startsWith('global-') || 
                type === 'event-engine' ||
                type === 'execution-engine' ||
                data._metadata.filename.startsWith('global-') ||
                data._metadata.filename.startsWith('EventEngine')) {
                this.globalArtifacts.add(artifactId);
            }
            // Worktype-specific artifacts  
            else if (type === 'worktype' || 
                     this.hasWorktypeReference(data)) {
                this.workTypeArtifacts.add(artifactId);
            }
        }
    }

    /**
     * Check if artifact has worktype reference
     */
    private hasWorktypeReference(data: any): boolean {
        // Check for direct worktype references
        if (data.WorkTypeSystemName) return true;
        if (data.BaseSharedo?.SystemName && data.BaseSharedo.SystemName.includes('matter')) return true;
        
        // Check for worktype-specific patterns in content
        if (data.Phases || data.PhaseTransitions || data.ParticipantRoles) return true;
        
        return false;
    }

    /**
     * Find orphaned artifacts
     */
    findOrphanedArtifacts(): IOrphanedArtifact[] {
        const orphaned: IOrphanedArtifact[] = [];
        
        for (const [artifactId, data] of this.artifactData) {
            const crossRef = this.crossReferences.get(artifactId);
            
            if (!crossRef) continue;
            
            // Check if artifact has no relationships or broken relationships
            const hasValidRelationships = crossRef.relationships.some(rel => 
                this.artifactData.has(rel.relatedId)
            );
            
            // Check if it's a standalone artifact that should be linked
            const shouldBeLinked = this.shouldArtifactBeLinked(data, crossRef.type);
            
            if (shouldBeLinked && !hasValidRelationships) {
                orphaned.push({
                    id: artifactId,
                    type: crossRef.type,
                    name: this.extractArtifactName(data),
                    filename: data._metadata.filename,
                    systemName: data.BaseSharedo?.SystemName || data.SystemName,
                    description: data.BaseSharedo?.Description || data.Description,
                    reason: this.determineOrphanReason(data, crossRef)
                });
            }
        }

        return orphaned;
    }

    /**
     * Extract artifact name for display
     */
    private extractArtifactName(data: any): string {
        return data.BaseSharedo?.Name || 
               data.Name || 
               data.Title || 
               data.SystemName || 
               data._metadata?.filename || 
               'Unknown';
    }

    /**
     * Determine if artifact should be linked to something
     */
    private shouldArtifactBeLinked(data: any, type: string): boolean {
        // Templates should be linked to worktypes
        if (type === 'document-template') return true;
        
        // Business rules should be linked to worktypes
        if (type === 'business-rule') return true;
        
        // Approvals should be linked to worktypes
        if (type === 'approval') return true;
        
        // List views might be linked to worktypes
        if (type === 'list-view' && !data._metadata.filename.includes('core-')) return true;
        
        return false;
    }

    /**
     * Determine why an artifact is orphaned
     */
    private determineOrphanReason(data: any, crossRef: ICrossReference): string {
        if (crossRef.relationships.length === 0) {
            return 'No relationships defined';
        }
        
        const brokenRels = crossRef.relationships.filter(rel => 
            !this.artifactData.has(rel.relatedId)
        );
        
        if (brokenRels.length > 0) {
            return `Broken relationships: ${brokenRels.map(r => r.relatedId).join(', ')}`;
        }
        
        return 'Relationships exist but may not be properly linked to work items';
    }

    /**
     * Analyze global vs worktype-specific configuration settings
     */
    analyzeGlobalConfiguration(): IGlobalConfigAnalysis {
        const globalSettings: IGlobalSetting[] = [];
        const worktypeSettings: IWorktypeSetting[] = [];
        
        // Analyze global settings
        for (const artifactId of this.globalArtifacts) {
            const data = this.artifactData.get(artifactId);
            if (!data) continue;
            
            const setting: IGlobalSetting = {
                id: artifactId,
                name: this.extractArtifactName(data),
                type: data._metadata.type,
                filename: data._metadata.filename,
                systemName: data.BaseSharedo?.SystemName || data.SystemName || artifactId,
                description: data.BaseSharedo?.Description || data.Description,
                affectedWorktypes: this.findAffectedWorktypes(artifactId),
                category: this.categorizeGlobalSetting(data)
            };
            
            globalSettings.push(setting);
        }

        // Analyze worktype settings
        for (const artifactId of this.workTypeArtifacts) {
            const data = this.artifactData.get(artifactId);
            if (!data) continue;
            
            // Skip main worktype definitions, focus on configuration elements
            if (data._metadata.type === 'worktype') continue;
            
            const setting: IWorktypeSetting = {
                id: artifactId,
                name: this.extractArtifactName(data),
                type: data._metadata.type,
                filename: data._metadata.filename,
                worktypeId: this.findRelatedWorktype(artifactId),
                worktypeName: this.getWorktypeName(this.findRelatedWorktype(artifactId)),
                category: this.categorizeWorktypeSetting(data),
                overridesGlobal: this.checksIfOverridesGlobal(data, globalSettings),
                globalSettingId: this.findOverriddenGlobalSetting(data, globalSettings)
            };
            
            worktypeSettings.push(setting);
        }

        // Build dependency map
        const dependencies = this.buildDependencyMap(globalSettings, worktypeSettings);
        
        // Find conflicts
        const conflicts = this.findConfigurationConflicts(globalSettings, worktypeSettings);

        return {
            globalSettings,
            worktypeSettings,
            dependencies,
            conflicts
        };
    }

    /**
     * Find which worktypes are affected by a global setting
     */
    private findAffectedWorktypes(globalSettingId: string): string[] {
        const affected: string[] = [];
        
        // Check which worktypes reference this global setting
        for (const [artifactId, data] of this.artifactData) {
            if (data._metadata.type === 'worktype') {
                // Check feature framework entries
                if (data.FeatureFrameworkEntries) {
                    const hasReference = data.FeatureFrameworkEntries.some((entry: any) => 
                        entry.FeatureSystemName === globalSettingId ||
                        entry.FeatureId === globalSettingId
                    );
                    
                    if (hasReference) {
                        affected.push(data.BaseSharedo?.SystemName || artifactId);
                    }
                }
            }
        }
        
        return affected;
    }

    /**
     * Categorize global setting type
     */
    private categorizeGlobalSetting(data: any): 'system' | 'feature' | 'security' | 'integration' | 'ui' | 'business' {
        const filename = data._metadata.filename.toLowerCase();
        
        if (filename.includes('security') || filename.includes('auth')) return 'security';
        if (filename.includes('integration') || filename.includes('api')) return 'integration';
        if (filename.includes('ui') || filename.includes('menu')) return 'ui';
        if (filename.includes('feature')) return 'feature';
        if (filename.includes('business') || filename.includes('rule')) return 'business';
        
        return 'system';
    }

    /**
     * Categorize worktype setting
     */
    private categorizeWorktypeSetting(data: any): 'workflow' | 'roles' | 'features' | 'templates' | 'validation' {
        const type = data._metadata.type;
        
        if (type === 'document-template') return 'templates';
        if (type === 'business-rule') return 'validation';
        if (type === 'approval') return 'workflow';
        if (data.ParticipantRoles) return 'roles';
        if (data.FeatureFrameworkEntries) return 'features';
        
        return 'workflow';
    }

    /**
     * Check if worktype setting overrides global setting
     */
    private checksIfOverridesGlobal(data: any, globalSettings: IGlobalSetting[]): boolean {
        // Look for patterns that indicate override behavior
        if (data.OverridesGlobal === true) return true;
        
        // Check if there's a corresponding global setting
        return this.findOverriddenGlobalSetting(data, globalSettings) !== undefined;
    }

    /**
     * Find the global setting that this worktype setting overrides
     */
    private findOverriddenGlobalSetting(data: any, globalSettings: IGlobalSetting[]): string | undefined {
        // Look for naming patterns or explicit references
        const settingName = this.extractArtifactName(data).toLowerCase();
        
        return globalSettings.find(global => 
            global.name.toLowerCase().includes(settingName) ||
            settingName.includes(global.name.toLowerCase())
        )?.id;
    }

    /**
     * Find related worktype for an artifact
     */
    private findRelatedWorktype(artifactId: string): string {
        const crossRef = this.crossReferences.get(artifactId);
        if (!crossRef) return 'unknown';
        
        // Look for parent worktype relationship
        const worktypeRel = crossRef.relationships.find(rel => 
            rel.relatedType === 'worktype' || 
            this.artifactData.get(rel.relatedId)?._metadata?.type === 'worktype'
        );
        
        return worktypeRel?.relatedId || 'unknown';
    }

    /**
     * Get worktype name by ID
     */
    private getWorktypeName(worktypeId: string): string {
        const data = this.artifactData.get(worktypeId);
        return data?.BaseSharedo?.Name || data?.Name || worktypeId;
    }

    /**
     * Build dependency map between global settings and worktypes
     */
    private buildDependencyMap(globalSettings: IGlobalSetting[], worktypeSettings: IWorktypeSetting[]): IDependencyMap[] {
        return globalSettings.map(global => {
            const dependentWorktypes = global.affectedWorktypes;
            const impactLevel = this.assessImpactLevel(global, worktypeSettings);
            
            return {
                globalSettingId: global.id,
                globalSettingName: global.name,
                dependentWorktypes,
                impactLevel,
                changeRisk: this.assessChangeRisk(global, dependentWorktypes.length)
            };
        });
    }

    /**
     * Assess impact level of global setting changes
     */
    private assessImpactLevel(global: IGlobalSetting, worktypeSettings: IWorktypeSetting[]): 'high' | 'medium' | 'low' {
        if (global.category === 'security' || global.category === 'system') return 'high';
        if (global.affectedWorktypes.length > 5) return 'high';
        if (global.affectedWorktypes.length > 2) return 'medium';
        return 'low';
    }

    /**
     * Assess risk of changing a global setting
     */
    private assessChangeRisk(global: IGlobalSetting, affectedCount: number): string {
        if (affectedCount === 0) return 'Low - No worktypes affected';
        if (affectedCount === 1) return 'Medium - One worktype affected';
        if (affectedCount <= 3) return 'High - Multiple worktypes affected';
        return 'Critical - Many worktypes affected, requires thorough testing';
    }

    /**
     * Find configuration conflicts
     */
    private findConfigurationConflicts(globalSettings: IGlobalSetting[], worktypeSettings: IWorktypeSetting[]): IConflict[] {
        const conflicts: IConflict[] = [];
        
        // Find override conflicts
        worktypeSettings.forEach(worktype => {
            if (worktype.overridesGlobal && worktype.globalSettingId) {
                const global = globalSettings.find(g => g.id === worktype.globalSettingId);
                if (global) {
                    conflicts.push({
                        type: 'override',
                        globalId: global.id,
                        worktypeId: worktype.id,
                        description: `Worktype ${worktype.worktypeName} overrides global setting ${global.name}`,
                        resolution: 'Verify override is intentional and properly configured'
                    });
                }
            }
        });
        
        return conflicts;
    }

    /**
     * Get enriched artifact data by ID
     */
    getArtifactById(artifactId: string): any {
        return this.artifactData.get(artifactId);
    }

    /**
     * Get cross-reference data for artifact
     */
    getCrossReference(artifactId: string): ICrossReference | undefined {
        return this.crossReferences.get(artifactId);
    }

    /**
     * Get all artifacts of specific type
     */
    getArtifactsByType(type: string): Map<string, any> {
        const result = new Map();
        
        for (const [id, data] of this.artifactData) {
            if (data._metadata.type === type) {
                result.set(id, data);
            }
        }
        
        return result;
    }

    /**
     * Search for artifacts by name or system name
     */
    searchArtifacts(searchTerm: string): Array<{id: string, data: any}> {
        const results: Array<{id: string, data: any}> = [];
        const term = searchTerm.toLowerCase();
        
        for (const [id, data] of this.artifactData) {
            const name = this.extractArtifactName(data).toLowerCase();
            const systemName = (data.BaseSharedo?.SystemName || data.SystemName || '').toLowerCase();
            
            if (name.includes(term) || systemName.includes(term)) {
                results.push({ id, data });
            }
        }
        
        return results;
    }
}