/**
 * Workflow Templates
 * 
 * Pre-built workflow templates for common ShareDo patterns
 */

import { IWorkflowDefinition } from './WorkflowManager';

export interface IWorkflowTemplate {
    name: string;
    description: string;
    category: string;
    template: IWorkflowDefinition;
}

export class WorkflowTemplates {
    private static templates: IWorkflowTemplate[] = [
        {
            name: 'Simple Approval',
            description: 'Basic approval workflow with approve/reject paths',
            category: 'Approval',
            template: {
                systemName: 'simple-approval',
                name: 'Simple Approval Workflow',
                description: 'A basic approval workflow with approve and reject paths',
                overrideNotifications: false,
                exceptionNotifications: true,
                exceptionNotificationEmailAddresses: '',
                variables: [
                    {
                        systemName: 'approver',
                        name: 'Approver',
                        type: '/Identifier/Ods Entity Identifier',
                        isCollection: false,
                        isInputVariable: true,
                        isMandatory: true
                    },
                    {
                        systemName: 'approved',
                        name: 'Approved',
                        type: '/Boolean',
                        isCollection: false,
                        isInputVariable: false,
                        isMandatory: false
                    }
                ],
                steps: [
                    {
                        systemName: 'start',
                        name: 'Start',
                        description: 'Workflow entry point',
                        isStart: true,
                        isEnd: false,
                        isOptimal: true,
                        ideData: JSON.stringify({ x: 0, y: 0 }),
                        actions: [{
                            actionSystemName: 'startStep',
                            name: 'Start Approval',
                            config: { now: true },
                            connections: { execute: { step: 'approval' } }
                        }]
                    },
                    {
                        systemName: 'approval',
                        name: 'Approval Decision',
                        description: 'Wait for approval decision',
                        isStart: false,
                        isEnd: false,
                        isOptimal: false,
                        ideData: JSON.stringify({ x: 200, y: 0 }),
                        actions: [{
                            actionSystemName: 'ifElse',
                            name: 'Check Approval',
                            config: { condition: 'approved' },
                            connections: {
                                yes: { step: 'approved' },
                                no: { step: 'rejected' }
                            }
                        }]
                    },
                    {
                        systemName: 'approved',
                        name: 'Approved',
                        description: 'Approval granted',
                        isStart: false,
                        isEnd: true,
                        isOptimal: true,
                        ideData: JSON.stringify({ x: 400, y: -100 }),
                        actions: []
                    },
                    {
                        systemName: 'rejected',
                        name: 'Rejected',
                        description: 'Approval rejected',
                        isStart: false,
                        isEnd: true,
                        isOptimal: true,
                        ideData: JSON.stringify({ x: 400, y: 100 }),
                        actions: []
                    }
                ]
            }
        },
        {
            name: 'Document Review',
            description: 'Document review with notification workflow',
            category: 'Document',
            template: {
                systemName: 'document-review',
                name: 'Document Review Workflow',
                description: 'Review document and send notifications',
                overrideNotifications: false,
                exceptionNotifications: true,
                exceptionNotificationEmailAddresses: '',
                variables: [
                    {
                        systemName: 'documentId',
                        name: 'Document ID',
                        type: '/Identifier/Work Item Identifier',
                        isCollection: false,
                        isInputVariable: true,
                        isMandatory: true
                    },
                    {
                        systemName: 'reviewers',
                        name: 'Reviewers',
                        type: '/Identifier/Ods Entity Identifier',
                        isCollection: true,
                        isInputVariable: true,
                        isMandatory: true
                    }
                ],
                steps: [
                    {
                        systemName: 'start',
                        name: 'Start',
                        description: 'Start document review',
                        isStart: true,
                        isEnd: false,
                        isOptimal: true,
                        ideData: JSON.stringify({ x: 0, y: 0 }),
                        actions: [{
                            actionSystemName: 'startStep',
                            name: 'Begin Review',
                            config: { now: true },
                            connections: { execute: { step: 'notify' } }
                        }]
                    },
                    {
                        systemName: 'notify',
                        name: 'Notify Reviewers',
                        description: 'Send notifications to reviewers',
                        isStart: false,
                        isEnd: false,
                        isOptimal: false,
                        ideData: JSON.stringify({ x: 200, y: 0 }),
                        actions: [{
                            actionSystemName: 'createNotification',
                            name: 'Send Review Request',
                            config: {
                                notificationTypeSystemName: 'document-review-request',
                                title: 'Document Review Required',
                                toOdsIdsVariable: 'reviewers'
                            },
                            connections: { execute: { step: 'wait' } }
                        }]
                    },
                    {
                        systemName: 'wait',
                        name: 'Wait for Reviews',
                        description: 'Wait for all reviews to complete',
                        isStart: false,
                        isEnd: false,
                        isOptimal: false,
                        ideData: JSON.stringify({ x: 400, y: 0 }),
                        actions: [{
                            actionSystemName: 'when',
                            name: 'All Reviews Complete',
                            config: { waitForAll: true },
                            connections: { complete: { step: 'complete' } }
                        }]
                    },
                    {
                        systemName: 'complete',
                        name: 'Review Complete',
                        description: 'All reviews completed',
                        isStart: false,
                        isEnd: true,
                        isOptimal: true,
                        ideData: JSON.stringify({ x: 600, y: 0 }),
                        actions: []
                    }
                ]
            }
        },
        {
            name: 'Task Assignment',
            description: 'Assign and track task completion',
            category: 'Task',
            template: {
                systemName: 'task-assignment',
                name: 'Task Assignment Workflow',
                description: 'Create and assign tasks with follow-up',
                overrideNotifications: false,
                exceptionNotifications: true,
                exceptionNotificationEmailAddresses: '',
                variables: [
                    {
                        systemName: 'assignee',
                        name: 'Assignee',
                        type: '/Identifier/Ods Entity Identifier',
                        isCollection: false,
                        isInputVariable: true,
                        isMandatory: true
                    },
                    {
                        systemName: 'taskTitle',
                        name: 'Task Title',
                        type: '/String',
                        isCollection: false,
                        isInputVariable: true,
                        isMandatory: true
                    },
                    {
                        systemName: 'dueInDays',
                        name: 'Due In Days',
                        type: '/Number',
                        defaultValue: '7',
                        isCollection: false,
                        isInputVariable: true,
                        isMandatory: false
                    }
                ],
                steps: [
                    {
                        systemName: 'start',
                        name: 'Start',
                        description: 'Start task assignment',
                        isStart: true,
                        isEnd: false,
                        isOptimal: true,
                        ideData: JSON.stringify({ x: 0, y: 0 }),
                        actions: [{
                            actionSystemName: 'startStep',
                            name: 'Begin',
                            config: { now: true },
                            connections: { execute: { step: 'createTask' } }
                        }]
                    },
                    {
                        systemName: 'createTask',
                        name: 'Create Task',
                        description: 'Create and assign task',
                        isStart: false,
                        isEnd: false,
                        isOptimal: false,
                        ideData: JSON.stringify({ x: 200, y: 0 }),
                        actions: [{
                            actionSystemName: 'createTask',
                            name: 'Create Task',
                            config: {
                                taskType: 'task-activity-general',
                                taskTitleVariable: 'taskTitle',
                                assignToVariable: 'assignee',
                                dueInDaysVariable: 'dueInDays'
                            },
                            connections: { execute: { step: 'monitor' } }
                        }]
                    },
                    {
                        systemName: 'monitor',
                        name: 'Monitor Task',
                        description: 'Monitor task completion',
                        isStart: false,
                        isEnd: false,
                        isOptimal: false,
                        ideData: JSON.stringify({ x: 400, y: 0 }),
                        actions: [{
                            actionSystemName: 'when',
                            name: 'Task Complete',
                            config: { waitFor: 'taskComplete' },
                            connections: { complete: { step: 'complete' } }
                        }]
                    },
                    {
                        systemName: 'complete',
                        name: 'Complete',
                        description: 'Task completed',
                        isStart: false,
                        isEnd: true,
                        isOptimal: true,
                        ideData: JSON.stringify({ x: 600, y: 0 }),
                        actions: []
                    }
                ]
            }
        },
        {
            name: 'Data Collection',
            description: 'Collect and process data from multiple sources',
            category: 'Data',
            template: {
                systemName: 'data-collection',
                name: 'Data Collection Workflow',
                description: 'Collect data from multiple work items',
                overrideNotifications: false,
                exceptionNotifications: true,
                exceptionNotificationEmailAddresses: '',
                variables: [
                    {
                        systemName: 'workItemIds',
                        name: 'Work Item IDs',
                        type: '/Identifier/Work Item Identifier',
                        isCollection: true,
                        isInputVariable: true,
                        isMandatory: true
                    },
                    {
                        systemName: 'collectedData',
                        name: 'Collected Data',
                        type: '/String',
                        isCollection: true,
                        isInputVariable: false,
                        isMandatory: false
                    }
                ],
                steps: [
                    {
                        systemName: 'start',
                        name: 'Start',
                        description: 'Start data collection',
                        isStart: true,
                        isEnd: false,
                        isOptimal: true,
                        ideData: JSON.stringify({ x: 0, y: 0 }),
                        actions: [{
                            actionSystemName: 'startStep',
                            name: 'Begin Collection',
                            config: { now: true },
                            connections: { execute: { step: 'iterate' } }
                        }]
                    },
                    {
                        systemName: 'iterate',
                        name: 'Process Each Item',
                        description: 'Iterate through work items',
                        isStart: false,
                        isEnd: false,
                        isOptimal: false,
                        ideData: JSON.stringify({ x: 200, y: 0 }),
                        actions: [{
                            actionSystemName: 'forEach',
                            name: 'For Each Work Item',
                            config: {
                                sourceCollection: 'workItemIds',
                                currentValueVariable: 'currentItemId'
                            },
                            connections: { forEach: { step: 'loadData' } }
                        }]
                    },
                    {
                        systemName: 'loadData',
                        name: 'Load Data',
                        description: 'Load data from work item',
                        isStart: false,
                        isEnd: false,
                        isOptimal: false,
                        ideData: JSON.stringify({ x: 400, y: 0 }),
                        actions: [{
                            actionSystemName: 'loadData',
                            name: 'Load Work Item Data',
                            config: {
                                workItemIdVariable: 'currentItemId',
                                workItemType: 'matter'
                            },
                            connections: { execute: { step: 'process' } }
                        }]
                    },
                    {
                        systemName: 'process',
                        name: 'Process Data',
                        description: 'Process collected data',
                        isStart: false,
                        isEnd: false,
                        isOptimal: false,
                        ideData: JSON.stringify({ x: 600, y: 0 }),
                        actions: [{
                            actionSystemName: 'runScript',
                            name: 'Process Data',
                            config: {
                                script: '// Process data here'
                            },
                            connections: { execute: { step: 'complete' } }
                        }]
                    },
                    {
                        systemName: 'complete',
                        name: 'Complete',
                        description: 'Data collection complete',
                        isStart: false,
                        isEnd: true,
                        isOptimal: true,
                        ideData: JSON.stringify({ x: 800, y: 0 }),
                        actions: []
                    }
                ]
            }
        }
    ];

    /**
     * Get all available templates
     */
    static getTemplates(): IWorkflowTemplate[] {
        return this.templates;
    }

    /**
     * Get templates by category
     */
    static getTemplatesByCategory(category: string): IWorkflowTemplate[] {
        return this.templates.filter(t => t.category === category);
    }

    /**
     * Get template by name
     */
    static getTemplate(name: string): IWorkflowTemplate | undefined {
        return this.templates.find(t => t.name === name);
    }

    /**
     * Get all categories
     */
    static getCategories(): string[] {
        const categories = new Set(this.templates.map(t => t.category));
        return Array.from(categories);
    }

    /**
     * Create workflow from template
     */
    static createFromTemplate(templateName: string, systemName: string, name: string, description?: string): IWorkflowDefinition | undefined {
        const template = this.getTemplate(templateName);
        if (!template) {
            return undefined;
        }

        // Clone the template and update with new values
        const workflow = JSON.parse(JSON.stringify(template.template)) as IWorkflowDefinition;
        workflow.systemName = systemName;
        workflow.name = name;
        workflow.description = description || template.template.description;

        return workflow;
    }
}