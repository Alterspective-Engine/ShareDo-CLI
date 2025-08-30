/**
 * Test file for Configurable HLD Generator
 * 
 * Basic tests to verify the implementation works correctly
 */

import { expect } from 'chai';
import { ConfigurableHLDGenerator } from '../services/ConfigurableHLDGenerator';
import { IWorkType } from '../Request/WorkTypes/IGetWorkTypesRequestResult';
import { IWorkTypeExtended } from '../services/interfaces/IWorkTypeExtended';

describe('ConfigurableHLDGenerator', () => {
    let generator: ConfigurableHLDGenerator;

    beforeEach(() => {
        generator = ConfigurableHLDGenerator.getInstance();
    });

    describe('Template Loading', () => {
        it('should load all built-in templates', () => {
            const templates = generator.getAvailableTemplates();
            
            expect(templates).to.exist;
            expect(templates.length).to.be.greaterThan(0);
            
            // Verify all expected templates are present
            const templateIds = templates.map(t => t.id);
            expect(templateIds).to.include('business-analyst');
            expect(templateIds).to.include('system-admin');
            expect(templateIds).to.include('support-consultant');
            expect(templateIds).to.include('trainer');
            expect(templateIds).to.include('legal-admin-cheatsheet');
            expect(templateIds).to.include('lawyer-cheatsheet');
            expect(templateIds).to.include('manager-cheatsheet');
            expect(templateIds).to.include('sysadmin-cheatsheet');
        });

        it('should return correct template metadata', () => {
            const templates = generator.getAvailableTemplates();
            const businessAnalystTemplate = templates.find(t => t.id === 'business-analyst');
            
            expect(businessAnalystTemplate).to.exist;
            expect(businessAnalystTemplate?.name).to.equal('Business Process & Requirements Documentation');
            expect(businessAnalystTemplate?.description).to.include('business-analysis');
        });
    });

    describe('Template Types', () => {
        it('should have correct number of full HLD templates', () => {
            const templates = generator.getAvailableTemplates();
            const fullHLDs = templates.filter(t => t.description.includes('full-hld'));
            
            expect(fullHLDs.length).to.be.at.least(4);
        });

        it('should have correct number of cheat sheet templates', () => {
            const templates = generator.getAvailableTemplates();
            const cheatSheets = templates.filter(t => t.description.includes('cheat-sheet'));
            
            expect(cheatSheets.length).to.be.at.least(4);
        });

        it('should have training guide template', () => {
            const templates = generator.getAvailableTemplates();
            const trainingGuide = templates.find(t => t.description.includes('training-guide'));
            
            expect(trainingGuide).to.exist;
        });
    });

    describe('Document Generation', () => {
        it('should handle missing template gracefully', async () => {
            const mockWorkType: IWorkTypeExtended = {
                name: 'Test Work Type',
                systemName: 'test-work-type',
                description: 'Test description',
                isActive: true,
                isAbstract: false,
                systemNamePath: '/test-work-type/',
                icon: 'fa-test',
                isCoreType: false,
                derivedTypes: [],
                hasPortals: false,
                iconClass: 'fa-test'
            };

            // Mock ShareDo client
            const mockServer = {
                getBaseUrl: () => 'https://test.sharedo.com'
            } as any;

            // This should throw an error for unknown template
            try {
                await generator.generateWithTemplate(mockWorkType, mockServer, 'unknown-template');
                expect.fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.message).to.equal('Unknown template: unknown-template');
            }
        });

        it('should generate document for valid template', async () => {
            const mockWorkType: IWorkTypeExtended = {
                name: 'Test Work Type',
                systemName: 'test-work-type',
                description: 'Test description',
                isActive: true,
                isAbstract: false,
                systemNamePath: '/test-work-type/',
                icon: 'fa-test',
                isCoreType: false,
                derivedTypes: [],
                hasPortals: false,
                iconClass: 'fa-test'
            };

            const mockServer = {
                getBaseUrl: () => 'https://test.sharedo.com'
            } as any;

            // Generate a simple cheat sheet (faster than full HLD)
            const buffer = await generator.generateWithTemplate(
                mockWorkType, 
                mockServer, 
                'legal-admin-cheatsheet'
            );

            expect(buffer).to.exist;
            expect(buffer).to.be.instanceOf(Buffer);
            expect(buffer.length).to.be.greaterThan(0);
        });
    });

    describe('Audience Transformation', () => {
        it('should have different templates for different audiences', () => {
            const templates = generator.getAvailableTemplates();
            
            const audiences = new Set(
                templates.map(t => {
                    // Extract audience from description
                    const match = t.description.match(/for (\w+-?\w*)/);
                    return match ? match[1] : 'unknown';
                })
            );

            // Should have multiple distinct audiences
            expect(audiences.size).to.be.at.least(4);
        });
    });
});

// Integration test to verify the complete flow
describe('ConfigurableHLDGenerator Integration', () => {
    it('should generate different documents for different templates', async () => {
        const generator = ConfigurableHLDGenerator.getInstance();
        
        const mockWorkType: IWorkTypeExtended = {
            name: 'Integration Test Work Type',
            systemName: 'integration-test',
            description: 'Work type for integration testing',
            isActive: true,
            isAbstract: false,
            systemNamePath: '/integration-test/',
            icon: 'fa-test',
            isCoreType: false,
            derivedTypes: [],
            hasPortals: false,
            iconClass: 'fa-test',
            category: 'test',
            tags: ['test', 'integration']
        };

        const mockServer = {
            getBaseUrl: () => 'https://test.sharedo.com',
            get: async (endpoint: string) => {
                // Mock API responses
                if (endpoint.includes('participantroles')) {
                    return { items: [] };
                }
                if (endpoint.includes('permissions')) {
                    return { items: [] };
                }
                return {};
            }
        } as any;

        // Generate two different templates
        const technicalDoc = await generator.generateWithTemplate(
            mockWorkType,
            mockServer,
            'system-admin'
        );

        const businessDoc = await generator.generateWithTemplate(
            mockWorkType,
            mockServer,
            'business-analyst'
        );

        // Documents should be different sizes (different content)
        expect(technicalDoc.length).to.not.equal(businessDoc.length);
        
        // Both should be valid buffers
        expect(technicalDoc).to.be.instanceOf(Buffer);
        expect(businessDoc).to.be.instanceOf(Buffer);
    });
});