/**
 * High-Level Design Document Generator Service
 * 
 * Generates comprehensive HLD documents from ShareDo work-types
 */

import * as vscode from 'vscode';
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
    NumberFormat,
    TableOfContents,
    SectionType,
    convertInchesToTwip,
    ImageRun
} from 'docx';
import { SharedoClient } from '../sharedoClient';
import { IWorkType } from '../Request/WorkTypes/IGetWorkTypesRequestResult';
import { IParticipantRole } from '../Request/ParticipantRoles/IGetParticipantRolesResult';
import { IGetWorkTypeCreatePermissionResult } from '../Request/WorkTypes/IGetWorkTypeCreatePermissionResult';
import { Inform } from '../Utilities/inform';
import * as path from 'path';

// Interfaces for HLD data structure
export interface IHLDMetadata {
    title: string;
    version: string;
    author: string;
    createdDate: Date;
    lastModified: Date;
    serverUrl: string;
    documentId: string;
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
}

export interface IHLDData {
    metadata: IHLDMetadata;
    workType: IWorkTypeDetails;
    derivedTypes: IWorkType[];
    participantRoles: IParticipantRole[];
    createPermissions: IGetWorkTypeCreatePermissionResult[];
    aspects?: any[];
    workflows?: any[];
    templates?: any[];
    forms?: any[];
}

export class HLDDocumentGenerator {
    private static instance: HLDDocumentGenerator;

    private constructor() {}

    /**
     * Get singleton instance
     */
    public static getInstance(): HLDDocumentGenerator {
        if (!HLDDocumentGenerator.instance) {
            HLDDocumentGenerator.instance = new HLDDocumentGenerator();
        }
        return HLDDocumentGenerator.instance;
    }

    /**
     * Generate HLD document for a work-type
     */
    public async generateHLD(workType: IWorkType, server: SharedoClient): Promise<Buffer> {
        try {
            Inform.writeInfo(`Generating HLD document for work-type: ${workType.name}`);
            
            // Collect all data
            const data = await this.collectWorkTypeData(workType, server);
            
            // Create document
            const doc = this.createDocument(data);
            
            // Generate buffer
            const buffer = await Packer.toBuffer(doc);
            
            Inform.writeInfo(`HLD document generated successfully for ${workType.name}`);
            return buffer;
            
        } catch (error) {
            Inform.writeError('HLDDocumentGenerator.generateHLD', error);
            throw error;
        }
    }

    /**
     * Collect all work-type related data
     */
    private async collectWorkTypeData(workType: IWorkType, server: SharedoClient): Promise<IHLDData> {
        const metadata: IHLDMetadata = {
            title: `High-Level Design: ${workType.name}`,
            version: '1.0',
            author: vscode.env.machineId || 'ShareDo VS Code Extension',
            createdDate: new Date(),
            lastModified: new Date(),
            serverUrl: server.url,
            documentId: `HLD-${workType.systemName}-${Date.now()}`
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
            systemNamePath: workType.systemNamePath
        };

        // Fetch additional data
        const participantRoles = await server.getWorkTypeGetParticipantRoles(workType.systemName) || [];
        const createPermissions = await server.getWorkTypeCreatePermissions(workType.systemName) || [];
        
        // Get aspects if available (placeholder for future implementation)
        let aspects: any[] = [];
        // TODO: Implement aspect fetching when API is available

        return {
            metadata,
            workType: workTypeDetails,
            derivedTypes: workType.derivedTypes || [],
            participantRoles,
            createPermissions,
            aspects
        };
    }

    /**
     * Create the Word document
     */
    private createDocument(data: IHLDData): Document {
        const doc = new Document({
            creator: data.metadata.author,
            title: data.metadata.title,
            description: `High-Level Design document for ${data.workType.name}`,
            styles: this.getDocumentStyles(),
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
                    children: this.createCoverPage(data)
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
                        ...this.createTechnicalArchitecture(data),
                        ...this.createDataModel(data),
                        ...this.createSecurityModel(data),
                        ...this.createIntegrations(data),
                        ...this.createAppendices(data)
                    ]
                }
            ]
        });

        return doc;
    }

    /**
     * Create cover page
     */
    private createCoverPage(data: IHLDData): (Paragraph | Table)[] {
        return [
            new Paragraph({
                text: '',
                spacing: { before: convertInchesToTwip(2) }
            }),
            new Paragraph({
                text: 'HIGH-LEVEL DESIGN DOCUMENT',
                heading: HeadingLevel.TITLE,
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
                spacing: { after: 600 }
            }),
            new Paragraph({
                text: '',
                spacing: { before: convertInchesToTwip(1) }
            }),
            this.createInfoTable(data),
            new Paragraph({
                text: '',
                spacing: { before: convertInchesToTwip(2) }
            }),
            new Paragraph({
                text: 'Generated by ShareDo VS Code Extension',
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 }
            }),
            new Paragraph({
                text: data.metadata.createdDate.toLocaleDateString(),
                alignment: AlignmentType.CENTER
            })
        ];
    }

    /**
     * Create document info table
     */
    private createInfoTable(data: IHLDData): Table {
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
                new TableRow({
                    children: [
                        new TableCell({
                            children: [new Paragraph({
                                children: [
                                    new TextRun({ text: 'Document Version', bold: true })
                                ]
                            })],
                            shading: { type: ShadingType.SOLID, color: 'E0E0E0' },
                            width: { size: 30, type: WidthType.PERCENTAGE }
                        }),
                        new TableCell({
                            children: [new Paragraph({ text: data.metadata.version })],
                            width: { size: 70, type: WidthType.PERCENTAGE }
                        })
                    ]
                }),
                new TableRow({
                    children: [
                        new TableCell({
                            children: [new Paragraph({
                                children: [
                                    new TextRun({ text: 'Server', bold: true })
                                ]
                            })],
                            shading: { type: ShadingType.SOLID, color: 'E0E0E0' }
                        }),
                        new TableCell({
                            children: [new Paragraph({ text: data.metadata.serverUrl })]
                        })
                    ]
                }),
                new TableRow({
                    children: [
                        new TableCell({
                            children: [new Paragraph({
                                children: [
                                    new TextRun({ text: 'Created Date', bold: true })
                                ]
                            })],
                            shading: { type: ShadingType.SOLID, color: 'E0E0E0' }
                        }),
                        new TableCell({
                            children: [new Paragraph({ text: data.metadata.createdDate.toLocaleString() })]
                        })
                    ]
                }),
                new TableRow({
                    children: [
                        new TableCell({
                            children: [new Paragraph({
                                children: [
                                    new TextRun({ text: 'Document ID', bold: true })
                                ]
                            })],
                            shading: { type: ShadingType.SOLID, color: 'E0E0E0' }
                        }),
                        new TableCell({
                            children: [new Paragraph({ text: data.metadata.documentId })]
                        })
                    ]
                })
            ]
        });
    }

    /**
     * Create table of contents
     */
    private createTableOfContents(): Paragraph[] {
        return [
            new Paragraph({
                text: 'Table of Contents',
                heading: HeadingLevel.HEADING_1,
                pageBreakBefore: true
            }),
            // Note: TableOfContents is typically auto-generated by Word
            // For now, we'll add a placeholder
            new Paragraph({
                text: '[Table of Contents will be generated here]',
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 }
            }),
            new Paragraph({
                text: '',
                pageBreakBefore: true
            })
        ];
    }

    /**
     * Create executive summary
     */
    private createExecutiveSummary(data: IHLDData): Paragraph[] {
        return [
            new Paragraph({
                text: '1. Executive Summary',
                heading: HeadingLevel.HEADING_1,
                numbering: { reference: 'default-numbering', level: 0 }
            }),
            new Paragraph({
                text: `This document provides a comprehensive high-level design for the ${data.workType.name} work-type within the ShareDo platform.`,
                spacing: { after: 200 }
            }),
            new Paragraph({
                text: '1.1 Purpose',
                heading: HeadingLevel.HEADING_2,
                numbering: { reference: 'default-numbering', level: 1 }
            }),
            new Paragraph({
                text: `The purpose of this document is to outline the technical architecture, data model, security considerations, and integration points for the ${data.workType.name} work-type.`,
                spacing: { after: 200 }
            }),
            new Paragraph({
                text: '1.2 Scope',
                heading: HeadingLevel.HEADING_2,
                numbering: { reference: 'default-numbering', level: 1 }
            }),
            new Paragraph({
                text: 'This document covers:',
                spacing: { after: 100 }
            }),
            new Paragraph({
                text: '• System architecture and components',
                bullet: { level: 0 }
            }),
            new Paragraph({
                text: '• Data model and relationships',
                bullet: { level: 0 }
            }),
            new Paragraph({
                text: '• Security and access control',
                bullet: { level: 0 }
            }),
            new Paragraph({
                text: '• Integration requirements',
                bullet: { level: 0 }
            }),
            new Paragraph({
                text: '• Participant roles and permissions',
                bullet: { level: 0 },
                spacing: { after: 400 }
            })
        ];
    }

    /**
     * Create system overview section
     */
    private createSystemOverview(data: IHLDData): (Paragraph | Table)[] {
        const paragraphs: Paragraph[] = [
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

        // Create properties table
        const propertiesTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                this.createTableRow('Name', data.workType.name),
                this.createTableRow('System Name', data.workType.systemName),
                this.createTableRow('Description', data.workType.description),
                this.createTableRow('Active', data.workType.isActive ? 'Yes' : 'No'),
                this.createTableRow('Abstract', data.workType.isAbstract ? 'Yes' : 'No'),
                this.createTableRow('Core Type', data.workType.isCoreType ? 'Yes' : 'No'),
                this.createTableRow('Has Portals', data.workType.hasPortals ? 'Yes' : 'No'),
                this.createTableRow('Icon', data.workType.icon),
                this.createTableRow('System Path', data.workType.systemNamePath)
            ]
        });

        // Add table to array (cast needed due to mixed types)
        (paragraphs as (Paragraph | Table)[]).push(propertiesTable);

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
                    text: 'The following work-types are derived from this type:',
                    spacing: { after: 200 }
                })
            );

            data.derivedTypes.forEach(derivedType => {
                paragraphs.push(
                    new Paragraph({
                        text: `• ${derivedType.name} (${derivedType.systemName})`,
                        bullet: { level: 0 }
                    })
                );
            });
        }

        return paragraphs;
    }

    /**
     * Create technical architecture section
     */
    private createTechnicalArchitecture(data: IHLDData): Paragraph[] {
        return [
            new Paragraph({
                text: '3. Technical Architecture',
                heading: HeadingLevel.HEADING_1,
                numbering: { reference: 'default-numbering', level: 0 },
                pageBreakBefore: true
            }),
            new Paragraph({
                text: '3.1 Component Overview',
                heading: HeadingLevel.HEADING_2,
                numbering: { reference: 'default-numbering', level: 1 }
            }),
            new Paragraph({
                text: `The ${data.workType.name} work-type is built on the ShareDo platform architecture and consists of the following key components:`,
                spacing: { after: 200 }
            }),
            new Paragraph({
                text: '• Workflow Engine - Handles business process automation',
                bullet: { level: 0 }
            }),
            new Paragraph({
                text: '• Form Builder - Manages dynamic form generation',
                bullet: { level: 0 }
            }),
            new Paragraph({
                text: '• Template System - Document and communication templates',
                bullet: { level: 0 }
            }),
            new Paragraph({
                text: '• Security Layer - Role-based access control',
                bullet: { level: 0 }
            }),
            new Paragraph({
                text: '• Integration Framework - External system connectivity',
                bullet: { level: 0 },
                spacing: { after: 400 }
            })
        ];
    }

    /**
     * Create data model section
     */
    private createDataModel(data: IHLDData): Paragraph[] {
        const paragraphs: Paragraph[] = [
            new Paragraph({
                text: '4. Data Model',
                heading: HeadingLevel.HEADING_1,
                numbering: { reference: 'default-numbering', level: 0 },
                pageBreakBefore: true
            }),
            new Paragraph({
                text: '4.1 Core Entities',
                heading: HeadingLevel.HEADING_2,
                numbering: { reference: 'default-numbering', level: 1 }
            }),
            new Paragraph({
                text: `The ${data.workType.name} work-type manages the following core data entities:`,
                spacing: { after: 200 }
            })
        ];

        // Add aspects if available
        if (data.aspects && data.aspects.length > 0) {
            paragraphs.push(
                new Paragraph({
                    text: '4.2 Aspects',
                    heading: HeadingLevel.HEADING_2,
                    numbering: { reference: 'default-numbering', level: 1 },
                    spacing: { before: 400 }
                }),
                new Paragraph({
                    text: 'The following aspects are configured for this work-type:',
                    spacing: { after: 200 }
                })
            );

            data.aspects.forEach(aspect => {
                paragraphs.push(
                    new Paragraph({
                        text: `• ${aspect.name || aspect}`,
                        bullet: { level: 0 }
                    })
                );
            });
        }

        return paragraphs;
    }

    /**
     * Create security model section
     */
    private createSecurityModel(data: IHLDData): (Paragraph | Table)[] {
        const paragraphs: Paragraph[] = [
            new Paragraph({
                text: '5. Security Model',
                heading: HeadingLevel.HEADING_1,
                numbering: { reference: 'default-numbering', level: 0 },
                pageBreakBefore: true
            }),
            new Paragraph({
                text: '5.1 Participant Roles',
                heading: HeadingLevel.HEADING_2,
                numbering: { reference: 'default-numbering', level: 1 }
            })
        ];

        if (data.participantRoles && data.participantRoles.length > 0) {
            paragraphs.push(
                new Paragraph({
                    text: 'The following participant roles are defined:',
                    spacing: { after: 200 }
                })
            );

            // Create roles table
            const rolesTable = new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    // Header row
                    new TableRow({
                        tableHeader: true,
                        children: [
                            new TableCell({
                                children: [new Paragraph({
                                    children: [
                                        new TextRun({ text: 'Role Name', bold: true })
                                    ]
                                })],
                                shading: { type: ShadingType.SOLID, color: '2E74B5' }
                            }),
                            new TableCell({
                                children: [new Paragraph({
                                    children: [
                                        new TextRun({ text: 'System Name', bold: true })
                                    ]
                                })],
                                shading: { type: ShadingType.SOLID, color: '2E74B5' }
                            }),
                            new TableCell({
                                children: [new Paragraph({
                                    children: [
                                        new TextRun({ text: 'Active', bold: true })
                                    ]
                                })],
                                shading: { type: ShadingType.SOLID, color: '2E74B5' }
                            }),
                            new TableCell({
                                children: [new Paragraph({
                                    children: [
                                        new TextRun({ text: 'Permissions', bold: true })
                                    ]
                                })],
                                shading: { type: ShadingType.SOLID, color: '2E74B5' }
                            })
                        ]
                    }),
                    // Data rows
                    ...data.participantRoles.map(role => 
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [new Paragraph({ text: role.name })]
                                }),
                                new TableCell({
                                    children: [new Paragraph({ text: role.systemName })]
                                }),
                                new TableCell({
                                    children: [new Paragraph({ text: role.isActive ? 'Yes' : 'No' })]
                                }),
                                new TableCell({
                                    children: [new Paragraph({ 
                                        text: role.permissions ? `${role.permissions.length} permissions` : '0 permissions'
                                    })]
                                })
                            ]
                        })
                    )
                ]
            });

            // Add table to array (cast needed due to mixed types)
            (paragraphs as (Paragraph | Table)[]).push(rolesTable);
        } else {
            paragraphs.push(
                new Paragraph({
                    text: 'No participant roles defined for this work-type.',
                    spacing: { after: 200 }
                })
            );
        }

        // Add create permissions
        if (data.createPermissions && data.createPermissions.length > 0) {
            paragraphs.push(
                new Paragraph({
                    text: '5.2 Create Permissions',
                    heading: HeadingLevel.HEADING_2,
                    numbering: { reference: 'default-numbering', level: 1 },
                    spacing: { before: 400 }
                }),
                new Paragraph({
                    text: 'The following subjects have permission to create instances of this work-type:',
                    spacing: { after: 200 }
                })
            );

            data.createPermissions.forEach(permission => {
                paragraphs.push(
                    new Paragraph({
                        text: `• ${permission.subjectName} (${permission.subjectType})`,
                        bullet: { level: 0 }
                    })
                );
            });
        }

        return paragraphs;
    }

    /**
     * Create integrations section
     */
    private createIntegrations(data: IHLDData): Paragraph[] {
        return [
            new Paragraph({
                text: '6. Integration Architecture',
                heading: HeadingLevel.HEADING_1,
                numbering: { reference: 'default-numbering', level: 0 },
                pageBreakBefore: true
            }),
            new Paragraph({
                text: '6.1 Integration Points',
                heading: HeadingLevel.HEADING_2,
                numbering: { reference: 'default-numbering', level: 1 }
            }),
            new Paragraph({
                text: `The ${data.workType.name} work-type supports the following integration capabilities:`,
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
                bullet: { level: 0 },
                spacing: { after: 400 }
            })
        ];
    }

    /**
     * Create appendices
     */
    private createAppendices(data: IHLDData): Paragraph[] {
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
                text: 'Work-Type: A template or blueprint that defines the structure and behavior of work items in ShareDo.',
                spacing: { after: 100 }
            }),
            new Paragraph({
                text: 'Participant Role: A defined role that users can have in relation to a work item.',
                spacing: { after: 100 }
            }),
            new Paragraph({
                text: 'Aspect: A reusable component that adds specific functionality to a work-type.',
                spacing: { after: 400 }
            }),
            new Paragraph({
                text: 'B. References',
                heading: HeadingLevel.HEADING_2
            }),
            new Paragraph({
                text: '• ShareDo Platform Documentation',
                bullet: { level: 0 }
            }),
            new Paragraph({
                text: '• Work-Type Configuration Guide',
                bullet: { level: 0 }
            }),
            new Paragraph({
                text: '• Security Best Practices',
                bullet: { level: 0 },
                spacing: { after: 400 }
            })
        ];
    }

    /**
     * Create header
     */
    private createHeader(data: IHLDData): Header {
        return new Header({
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `${data.workType.name} - High-Level Design`,
                            size: 20
                        })
                    ],
                    alignment: AlignmentType.CENTER
                })
            ]
        });
    }

    /**
     * Create footer
     */
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

    /**
     * Helper method to create table rows
     */
    private createTableRow(label: string, value: string): TableRow {
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

    /**
     * Get document styles
     */
    private getDocumentStyles(): any {
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

    /**
     * Get numbering configuration
     */
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
                        }
                    ]
                }
            ]
        };
    }
}