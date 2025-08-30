/**
 * Diagram Generator Service
 * 
 * Generates visual diagrams for phase models and workflows
 * Creates SVG diagrams that can be embedded in Word documents
 */

import { createCanvas, Canvas, CanvasRenderingContext2D, registerFont } from 'canvas';
const svg2img = require('svg2img');
import { IPhase, IPhaseTransition, IPhaseGuard, IWorkflowDetails, IWorkflowStep } from './EnhancedHLDDocumentGenerator';

export interface IDiagramStyle {
    colors: {
        draft: string;
        review: string;
        inProgress: string;
        completed: string;
        cancelled: string;
        default: string;
        guardError: string;
        guardWarning: string;
        guardInfo: string;
        automatic: string;
        manual: string;
        approval: string;
    };
    fonts: {
        title: string;
        label: string;
        small: string;
    };
    spacing: {
        nodeWidth: number;
        nodeHeight: number;
        horizontalGap: number;
        verticalGap: number;
        padding: number;
    };
}

export class DiagramGenerator {
    private static instance: DiagramGenerator;
    private style: IDiagramStyle;

    private constructor() {
        this.style = this.getDefaultStyle();
    }

    public static getInstance(): DiagramGenerator {
        if (!DiagramGenerator.instance) {
            DiagramGenerator.instance = new DiagramGenerator();
        }
        return DiagramGenerator.instance;
    }

    private getDefaultStyle(): IDiagramStyle {
        return {
            colors: {
                draft: '#808080',
                review: '#FFA500',
                inProgress: '#0000FF',
                completed: '#008000',
                cancelled: '#FF0000',
                default: '#E0E0E0',
                guardError: '#FF4444',
                guardWarning: '#FFA500',
                guardInfo: '#4444FF',
                automatic: '#00AA00',
                manual: '#0066CC',
                approval: '#AA00AA'
            },
            fonts: {
                title: '16px Arial',
                label: '12px Arial',
                small: '10px Arial'
            },
            spacing: {
                nodeWidth: 150,
                nodeHeight: 80,
                horizontalGap: 100,
                verticalGap: 120,
                padding: 50
            }
        };
    }

    /**
     * Generate Phase Model Diagram as SVG
     */
    public generatePhaseModelSVG(
        phases: IPhase[],
        transitions: IPhaseTransition[]
    ): string {
        const positions = this.calculatePhasePositions(phases);
        const { width, height } = this.calculateCanvasSize(positions);

        let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
        
        // Add styles
        svg += this.getSVGStyles();
        
        // Add arrow marker definitions
        svg += this.getSVGDefs();

        // Draw transitions (arrows) first so they appear behind nodes
        transitions.forEach(transition => {
            svg += this.drawTransitionSVG(transition, positions);
        });

        // Draw phase nodes
        phases.forEach(phase => {
            svg += this.drawPhaseSVG(phase, positions);
        });

        // Add legend
        svg += this.drawLegendSVG(width, height);

        svg += '</svg>';
        return svg;
    }

    /**
     * Generate Workflow Diagram as SVG
     */
    public generateWorkflowSVG(workflow: IWorkflowDetails): string {
        const steps = workflow.steps || [];
        const positions = this.calculateWorkflowPositions(steps);
        const { width, height } = this.calculateCanvasSize(positions);

        let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
        
        // Add styles
        svg += this.getSVGStyles();
        
        // Add arrow marker definitions
        svg += this.getSVGDefs();

        // Draw title
        svg += `<text x="${width/2}" y="30" class="workflow-title" text-anchor="middle">${workflow.name}</text>`;

        // Draw connections between steps
        for (let i = 0; i < steps.length - 1; i++) {
            svg += this.drawWorkflowConnectionSVG(steps[i], steps[i + 1], positions);
        }

        // Draw workflow steps
        steps.forEach(step => {
            svg += this.drawWorkflowStepSVG(step, positions, workflow);
        });

        // Add workflow metadata
        svg += this.drawWorkflowMetadataSVG(workflow, width, height);

        svg += '</svg>';
        return svg;
    }

    /**
     * Calculate positions for phase nodes
     */
    private calculatePhasePositions(phases: IPhase[]): Map<string, { x: number, y: number }> {
        const positions = new Map<string, { x: number, y: number }>();
        const { nodeWidth, nodeHeight, horizontalGap, verticalGap, padding } = this.style.spacing;

        // Group phases by their order/level
        const levels = new Map<number, IPhase[]>();
        phases.forEach(phase => {
            const level = phase.order || 1;
            if (!levels.has(level)) {
                levels.set(level, []);
            }
            levels.get(level)!.push(phase);
        });

        // Position nodes by level
        let currentY = padding;
        Array.from(levels.keys()).sort((a, b) => a - b).forEach(level => {
            const phasesAtLevel = levels.get(level)!;
            const totalWidth = phasesAtLevel.length * nodeWidth + (phasesAtLevel.length - 1) * horizontalGap;
            let currentX = padding + (Math.max(3 * nodeWidth + 2 * horizontalGap - totalWidth, 0) / 2);

            phasesAtLevel.forEach(phase => {
                positions.set(phase.systemName, { x: currentX, y: currentY });
                currentX += nodeWidth + horizontalGap;
            });

            currentY += nodeHeight + verticalGap;
        });

        // Special positioning for initial and final phases
        phases.forEach(phase => {
            if (phase.isInitial) {
                const pos = positions.get(phase.systemName)!;
                positions.set(phase.systemName, { x: padding, y: pos.y });
            }
            if (phase.isFinal) {
                const pos = positions.get(phase.systemName)!;
                const maxX = Math.max(...Array.from(positions.values()).map(p => p.x));
                if (phase.systemName === 'completed') {
                    positions.set(phase.systemName, { x: maxX, y: pos.y - verticalGap / 2 });
                } else if (phase.systemName === 'cancelled') {
                    positions.set(phase.systemName, { x: maxX, y: pos.y + verticalGap / 2 });
                }
            }
        });

        return positions;
    }

    /**
     * Calculate positions for workflow steps
     */
    private calculateWorkflowPositions(steps: IWorkflowStep[]): Map<number, { x: number, y: number }> {
        const positions = new Map<number, { x: number, y: number }>();
        const { nodeWidth, nodeHeight, horizontalGap, verticalGap, padding } = this.style.spacing;

        // Create a flow layout
        let currentX = padding;
        let currentY = padding + 50; // Leave space for title
        let column = 0;
        const maxColumns = 4;

        steps.forEach((step, index) => {
            positions.set(step.order, { x: currentX, y: currentY });
            
            column++;
            if (column >= maxColumns) {
                column = 0;
                currentX = padding;
                currentY += nodeHeight + verticalGap;
            } else {
                currentX += nodeWidth + horizontalGap;
            }
        });

        return positions;
    }

    /**
     * Calculate canvas size based on positions
     */
    private calculateCanvasSize(positions: Map<any, { x: number, y: number }>): { width: number, height: number } {
        const { nodeWidth, nodeHeight, padding } = this.style.spacing;
        
        let maxX = 0;
        let maxY = 0;
        
        positions.forEach(pos => {
            maxX = Math.max(maxX, pos.x);
            maxY = Math.max(maxY, pos.y);
        });

        return {
            width: maxX + nodeWidth + padding * 2,
            height: maxY + nodeHeight + padding * 2 + 100 // Extra space for legend
        };
    }

    /**
     * Draw a phase node in SVG
     */
    private drawPhaseSVG(phase: IPhase, positions: Map<string, { x: number, y: number }>): string {
        const pos = positions.get(phase.systemName);
        if (!pos) return '';

        const { nodeWidth, nodeHeight } = this.style.spacing;
        const color = this.getPhaseColor(phase);
        
        let svg = '';

        // Draw node background with rounded corners
        svg += `<rect x="${pos.x}" y="${pos.y}" width="${nodeWidth}" height="${nodeHeight}" 
                rx="10" ry="10" fill="${color}" stroke="#333" stroke-width="2" opacity="0.9"/>`;

        // Add phase icon
        svg += this.drawPhaseIcon(phase, pos.x + 10, pos.y + 10);

        // Add phase name
        svg += `<text x="${pos.x + nodeWidth/2}" y="${pos.y + 35}" 
                class="phase-name" text-anchor="middle" fill="white" font-weight="bold">
                ${phase.name}
                </text>`;

        // Add phase type badge
        if (phase.isInitial) {
            svg += `<rect x="${pos.x + 5}" y="${pos.y + nodeHeight - 25}" width="40" height="20" 
                    rx="10" ry="10" fill="#00FF00" opacity="0.8"/>`;
            svg += `<text x="${pos.x + 25}" y="${pos.y + nodeHeight - 10}" 
                    class="badge-text" text-anchor="middle" fill="#000">START</text>`;
        }
        if (phase.isFinal) {
            svg += `<rect x="${pos.x + nodeWidth - 45}" y="${pos.y + nodeHeight - 25}" width="40" height="20" 
                    rx="10" ry="10" fill="#FF0000" opacity="0.8"/>`;
            svg += `<text x="${pos.x + nodeWidth - 25}" y="${pos.y + nodeHeight - 10}" 
                    class="badge-text" text-anchor="middle" fill="#FFF">END</text>`;
        }

        // Add SLA indicator if present
        if (phase.sla) {
            svg += `<circle cx="${pos.x + nodeWidth - 15}" cy="${pos.y + 15}" r="10" 
                    fill="#FFD700" stroke="#333" stroke-width="1"/>`;
            svg += `<text x="${pos.x + nodeWidth - 15}" y="${pos.y + 19}" 
                    class="sla-text" text-anchor="middle" fill="#000" font-size="10">
                    ${phase.sla.duration}${phase.sla.unit.charAt(0)}
                    </text>`;
        }

        // Add allowed actions count
        if (phase.allowedActions && phase.allowedActions.length > 0) {
            svg += `<text x="${pos.x + nodeWidth/2}" y="${pos.y + 55}" 
                    class="action-count" text-anchor="middle" fill="white" font-size="10">
                    ${phase.allowedActions.length} actions
                    </text>`;
        }

        return svg;
    }

    /**
     * Draw phase icon
     */
    private drawPhaseIcon(phase: IPhase, x: number, y: number): string {
        const iconMap: { [key: string]: string } = {
            'draft': '✏️',
            'review': '👁️',
            'in_progress': '⚙️',
            'completed': '✅',
            'cancelled': '❌'
        };

        const icon = iconMap[phase.systemName] || '📄';
        
        return `<text x="${x}" y="${y + 15}" font-size="20">${icon}</text>`;
    }

    /**
     * Draw transition arrow in SVG
     */
    private drawTransitionSVG(
        transition: IPhaseTransition,
        positions: Map<string, { x: number, y: number }>
    ): string {
        const fromPos = positions.get(transition.fromPhase);
        const toPos = positions.get(transition.toPhase);
        if (!fromPos || !toPos) return '';

        const { nodeWidth, nodeHeight } = this.style.spacing;
        
        // Calculate arrow path
        const startX = fromPos.x + nodeWidth / 2;
        const startY = fromPos.y + nodeHeight;
        const endX = toPos.x + nodeWidth / 2;
        const endY = toPos.y;

        // Determine arrow style based on transition type
        let strokeColor = this.style.colors.manual;
        let strokeDasharray = '';
        
        if (transition.automaticTransition) {
            strokeColor = this.style.colors.automatic;
            strokeDasharray = '5,5';
        }
        if (transition.requiresApproval) {
            strokeColor = this.style.colors.approval;
        }

        let svg = '';

        // Draw curved arrow
        const controlY = (startY + endY) / 2;
        svg += `<path d="M ${startX} ${startY} Q ${(startX + endX) / 2} ${controlY} ${endX} ${endY}"
                fill="none" stroke="${strokeColor}" stroke-width="2" 
                stroke-dasharray="${strokeDasharray}" marker-end="url(#arrowhead)"/>`;

        // Add transition label
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        svg += `<rect x="${midX - 40}" y="${midY - 10}" width="80" height="20" 
                fill="white" stroke="${strokeColor}" stroke-width="1" rx="5" ry="5"/>`;
        svg += `<text x="${midX}" y="${midY + 4}" 
                class="transition-label" text-anchor="middle" font-size="10">
                ${transition.name}
                </text>`;

        // Add guard indicators
        if (transition.guards && transition.guards.length > 0) {
            const guardX = midX + 35;
            const guardY = midY - 5;
            
            // Count guard types
            const errorCount = transition.guards.filter(g => g.severity === 'error').length;
            const warningCount = transition.guards.filter(g => g.severity === 'warning').length;
            
            if (errorCount > 0) {
                svg += `<circle cx="${guardX}" cy="${guardY}" r="8" 
                        fill="${this.style.colors.guardError}" stroke="#333" stroke-width="1"/>`;
                svg += `<text x="${guardX}" y="${guardY + 3}" 
                        class="guard-count" text-anchor="middle" fill="white" font-size="10">
                        ${errorCount}
                        </text>`;
            }
            if (warningCount > 0) {
                svg += `<circle cx="${guardX + 18}" cy="${guardY}" r="8" 
                        fill="${this.style.colors.guardWarning}" stroke="#333" stroke-width="1"/>`;
                svg += `<text x="${guardX + 18}" y="${guardY + 3}" 
                        class="guard-count" text-anchor="middle" fill="white" font-size="10">
                        ${warningCount}
                        </text>`;
            }
        }

        return svg;
    }

    /**
     * Draw workflow step in SVG
     */
    private drawWorkflowStepSVG(
        step: IWorkflowStep,
        positions: Map<number, { x: number, y: number }>,
        workflow: IWorkflowDetails
    ): string {
        const pos = positions.get(step.order);
        if (!pos) return '';

        const { nodeWidth, nodeHeight } = this.style.spacing;
        const color = this.getStepColor(step);
        const shape = this.getStepShape(step);
        
        let svg = '';

        // Draw step shape
        if (shape === 'diamond') {
            // Decision/branch step
            const cx = pos.x + nodeWidth / 2;
            const cy = pos.y + nodeHeight / 2;
            svg += `<path d="M ${cx} ${pos.y} L ${pos.x + nodeWidth} ${cy} L ${cx} ${pos.y + nodeHeight} L ${pos.x} ${cy} Z"
                    fill="${color}" stroke="#333" stroke-width="2" opacity="0.9"/>`;
        } else if (shape === 'circle') {
            // Start/end step
            const cx = pos.x + nodeWidth / 2;
            const cy = pos.y + nodeHeight / 2;
            svg += `<ellipse cx="${cx}" cy="${cy}" rx="${nodeWidth/2}" ry="${nodeHeight/2}"
                    fill="${color}" stroke="#333" stroke-width="2" opacity="0.9"/>`;
        } else {
            // Regular rectangle step
            svg += `<rect x="${pos.x}" y="${pos.y}" width="${nodeWidth}" height="${nodeHeight}" 
                    rx="5" ry="5" fill="${color}" stroke="#333" stroke-width="2" opacity="0.9"/>`;
        }

        // Add step icon
        svg += this.drawStepIcon(step, pos.x + 10, pos.y + 10);

        // Add step name
        svg += `<text x="${pos.x + nodeWidth/2}" y="${pos.y + nodeHeight/2 - 5}" 
                class="step-name" text-anchor="middle" fill="white" font-weight="bold">
                Step ${step.order}
                </text>`;
        svg += `<text x="${pos.x + nodeWidth/2}" y="${pos.y + nodeHeight/2 + 10}" 
                class="step-action" text-anchor="middle" fill="white" font-size="10">
                ${step.name}
                </text>`;

        // Add step type badge
        svg += `<rect x="${pos.x + 5}" y="${pos.y + 5}" width="50" height="15" 
                rx="7" ry="7" fill="rgba(255,255,255,0.8)"/>`;
        svg += `<text x="${pos.x + 30}" y="${pos.y + 15}" 
                class="step-type" text-anchor="middle" fill="#333" font-size="9">
                ${step.type}
                </text>`;

        // Add condition indicator
        if (step.condition) {
            svg += `<circle cx="${pos.x + nodeWidth - 10}" cy="${pos.y + 10}" r="8" 
                    fill="#FFD700" stroke="#333" stroke-width="1"/>`;
            svg += `<text x="${pos.x + nodeWidth - 10}" y="${pos.y + 14}" 
                    text-anchor="middle" fill="#000" font-size="10">?</text>`;
        }

        // Add parameter count
        if (step.parameters && step.parameters.length > 0) {
            svg += `<text x="${pos.x + nodeWidth/2}" y="${pos.y + nodeHeight - 10}" 
                    class="param-count" text-anchor="middle" fill="white" font-size="9">
                    ${step.parameters.length} params
                    </text>`;
        }

        return svg;
    }

    /**
     * Draw connection between workflow steps
     */
    private drawWorkflowConnectionSVG(
        fromStep: IWorkflowStep,
        toStep: IWorkflowStep,
        positions: Map<number, { x: number, y: number }>
    ): string {
        const fromPos = positions.get(fromStep.order);
        const toPos = positions.get(toStep.order);
        if (!fromPos || !toPos) return '';

        const { nodeWidth, nodeHeight } = this.style.spacing;
        
        const startX = fromPos.x + nodeWidth;
        const startY = fromPos.y + nodeHeight / 2;
        const endX = toPos.x;
        const endY = toPos.y + nodeHeight / 2;

        let svg = '';

        // Draw connection line
        if (Math.abs(startY - endY) < 10) {
            // Straight horizontal line
            svg += `<line x1="${startX}" y1="${startY}" x2="${endX}" y2="${endY}"
                    stroke="#666" stroke-width="2" marker-end="url(#arrowhead)"/>`;
        } else {
            // Curved path for vertical connections
            const midX = (startX + endX) / 2;
            svg += `<path d="M ${startX} ${startY} Q ${midX} ${startY} ${midX} ${endY} T ${endX} ${endY}"
                    fill="none" stroke="#666" stroke-width="2" marker-end="url(#arrowhead)"/>`;
        }

        // Add success/failure indicators if present
        if (fromStep.onSuccess || fromStep.onFailure) {
            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;
            
            if (fromStep.onSuccess) {
                svg += `<circle cx="${midX - 10}" cy="${midY}" r="10" 
                        fill="#00FF00" opacity="0.7"/>`;
                svg += `<text x="${midX - 10}" y="${midY + 3}" 
                        text-anchor="middle" fill="#000" font-size="10">✓</text>`;
            }
            if (fromStep.onFailure) {
                svg += `<circle cx="${midX + 10}" cy="${midY}" r="10" 
                        fill="#FF0000" opacity="0.7"/>`;
                svg += `<text x="${midX + 10}" y="${midY + 3}" 
                        text-anchor="middle" fill="#FFF" font-size="10">✗</text>`;
            }
        }

        return svg;
    }

    /**
     * Draw legend for phase diagram
     */
    private drawLegendSVG(width: number, height: number): string {
        let svg = '';
        const legendY = height - 80;
        const legendX = 50;

        // Background
        svg += `<rect x="${legendX - 10}" y="${legendY - 10}" width="${width - 80}" height="70" 
                fill="white" stroke="#333" stroke-width="1" rx="5" ry="5" opacity="0.95"/>`;

        // Title
        svg += `<text x="${legendX}" y="${legendY + 5}" font-weight="bold" font-size="12">Legend:</text>`;

        // Phase colors
        let currentX = legendX;
        const colors = [
            { name: 'Draft', color: this.style.colors.draft },
            { name: 'Review', color: this.style.colors.review },
            { name: 'In Progress', color: this.style.colors.inProgress },
            { name: 'Completed', color: this.style.colors.completed },
            { name: 'Cancelled', color: this.style.colors.cancelled }
        ];

        colors.forEach(item => {
            svg += `<rect x="${currentX}" y="${legendY + 15}" width="15" height="15" 
                    fill="${item.color}" stroke="#333" stroke-width="1"/>`;
            svg += `<text x="${currentX + 20}" y="${legendY + 25}" font-size="10">${item.name}</text>`;
            currentX += 100;
        });

        // Transition types
        currentX = legendX;
        const lineY = legendY + 40;
        
        // Automatic
        svg += `<line x1="${currentX}" y1="${lineY}" x2="${currentX + 30}" y2="${lineY}"
                stroke="${this.style.colors.automatic}" stroke-width="2" stroke-dasharray="5,5"/>`;
        svg += `<text x="${currentX + 35}" y="${lineY + 3}" font-size="10">Automatic</text>`;
        currentX += 100;

        // Manual
        svg += `<line x1="${currentX}" y1="${lineY}" x2="${currentX + 30}" y2="${lineY}"
                stroke="${this.style.colors.manual}" stroke-width="2"/>`;
        svg += `<text x="${currentX + 35}" y="${lineY + 3}" font-size="10">Manual</text>`;
        currentX += 100;

        // Approval
        svg += `<line x1="${currentX}" y1="${lineY}" x2="${currentX + 30}" y2="${lineY}"
                stroke="${this.style.colors.approval}" stroke-width="2"/>`;
        svg += `<text x="${currentX + 35}" y="${lineY + 3}" font-size="10">Approval Required</text>`;
        currentX += 150;

        // Guards
        svg += `<circle cx="${currentX}" cy="${lineY}" r="8" 
                fill="${this.style.colors.guardError}"/>`;
        svg += `<text x="${currentX + 12}" y="${lineY + 3}" font-size="10">Guards</text>`;
        currentX += 80;

        // SLA
        svg += `<circle cx="${currentX}" cy="${lineY}" r="8" 
                fill="#FFD700"/>`;
        svg += `<text x="${currentX + 12}" y="${lineY + 3}" font-size="10">SLA</text>`;

        return svg;
    }

    /**
     * Draw workflow metadata
     */
    private drawWorkflowMetadataSVG(workflow: IWorkflowDetails, width: number, height: number): string {
        let svg = '';
        const metaY = height - 60;
        const metaX = 50;

        // Background
        svg += `<rect x="${metaX - 10}" y="${metaY - 10}" width="${width - 80}" height="50" 
                fill="white" stroke="#333" stroke-width="1" rx="5" ry="5" opacity="0.95"/>`;

        // Workflow info
        svg += `<text x="${metaX}" y="${metaY + 5}" font-weight="bold" font-size="11">Workflow Info:</text>`;
        svg += `<text x="${metaX}" y="${metaY + 20}" font-size="10">Type: ${workflow.type}</text>`;
        
        if (workflow.trigger) {
            svg += `<text x="${metaX + 150}" y="${metaY + 20}" font-size="10">Trigger: ${workflow.trigger}</text>`;
        }
        
        if (workflow.errorHandling) {
            svg += `<text x="${metaX + 350}" y="${metaY + 20}" font-size="10">Error: ${workflow.errorHandling}</text>`;
        }

        // Step type legend
        svg += `<text x="${metaX}" y="${metaY + 35}" font-size="10">Shapes:</text>`;
        
        // Rectangle
        svg += `<rect x="${metaX + 50}" y="${metaY + 28}" width="20" height="10" 
                fill="#4A90E2" stroke="#333" stroke-width="1"/>`;
        svg += `<text x="${metaX + 75}" y="${metaY + 35}" font-size="10">Action</text>`;
        
        // Diamond
        svg += `<path d="M ${metaX + 140} ${metaY + 33} L ${metaX + 150} ${metaY + 28} L ${metaX + 160} ${metaY + 33} L ${metaX + 150} ${metaY + 38} Z"
                fill="#E67E22" stroke="#333" stroke-width="1"/>`;
        svg += `<text x="${metaX + 165}" y="${metaY + 35}" font-size="10">Decision</text>`;
        
        // Circle
        svg += `<ellipse cx="${metaX + 240}" cy="${metaY + 33}" rx="10" ry="5"
                fill="#27AE60" stroke="#333" stroke-width="1"/>`;
        svg += `<text x="${metaX + 255}" y="${metaY + 35}" font-size="10">Start/End</text>`;

        return svg;
    }

    /**
     * Get SVG styles
     */
    private getSVGStyles(): string {
        return `
            <style>
                .phase-name { font-family: Arial; font-size: 14px; }
                .step-name { font-family: Arial; font-size: 12px; }
                .step-action { font-family: Arial; font-size: 10px; }
                .transition-label { font-family: Arial; font-size: 10px; }
                .badge-text { font-family: Arial; font-size: 9px; font-weight: bold; }
                .sla-text { font-family: Arial; font-size: 10px; font-weight: bold; }
                .action-count { font-family: Arial; font-size: 10px; }
                .guard-count { font-family: Arial; font-size: 10px; font-weight: bold; }
                .param-count { font-family: Arial; font-size: 9px; }
                .step-type { font-family: Arial; font-size: 9px; }
                .workflow-title { font-family: Arial; font-size: 18px; font-weight: bold; }
            </style>
        `;
    }

    /**
     * Get SVG definitions (markers, gradients, etc.)
     */
    private getSVGDefs(): string {
        return `
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                        refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#333" />
                </marker>
                <linearGradient id="phaseGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:rgb(255,255,255);stop-opacity:0.2" />
                    <stop offset="100%" style="stop-color:rgb(0,0,0);stop-opacity:0.2" />
                </linearGradient>
                <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                    <feOffset dx="2" dy="2" result="offsetblur"/>
                    <feComponentTransfer>
                        <feFuncA type="linear" slope="0.5"/>
                    </feComponentTransfer>
                    <feMerge> 
                        <feMergeNode/>
                        <feMergeNode in="SourceGraphic"/> 
                    </feMerge>
                </filter>
            </defs>
        `;
    }

    /**
     * Get color for phase based on state
     */
    private getPhaseColor(phase: IPhase): string {
        const colorMap: { [key: string]: string } = {
            'draft': this.style.colors.draft,
            'review': this.style.colors.review,
            'in_progress': this.style.colors.inProgress,
            'completed': this.style.colors.completed,
            'cancelled': this.style.colors.cancelled
        };
        
        return colorMap[phase.systemName] || this.style.colors.default;
    }

    /**
     * Get color for workflow step based on type
     */
    private getStepColor(step: IWorkflowStep): string {
        const colorMap: { [key: string]: string } = {
            'action': '#4A90E2',
            'decision': '#E67E22',
            'branch': '#E67E22',
            'wait': '#9B59B6',
            'query': '#3498DB',
            'transform': '#16A085',
            'notification': '#F39C12',
            'start': '#27AE60',
            'end': '#E74C3C'
        };
        
        return colorMap[step.type] || '#95A5A6';
    }

    /**
     * Get shape for workflow step based on type
     */
    private getStepShape(step: IWorkflowStep): string {
        if (step.type === 'decision' || step.type === 'branch') {
            return 'diamond';
        }
        if (step.order === 1 || step.type === 'start' || step.type === 'end') {
            return 'circle';
        }
        return 'rectangle';
    }

    /**
     * Draw step icon
     */
    private drawStepIcon(step: IWorkflowStep, x: number, y: number): string {
        const iconMap: { [key: string]: string } = {
            'action': '⚡',
            'decision': '❓',
            'branch': '🔀',
            'wait': '⏱️',
            'query': '🔍',
            'transform': '🔄',
            'notification': '📧',
            'start': '▶️',
            'end': '⏹️'
        };

        const icon = iconMap[step.type] || '📋';
        
        return `<text x="${x}" y="${y + 15}" font-size="16">${icon}</text>`;
    }

    /**
     * Convert SVG to PNG buffer for embedding in Word documents
     */
    public async svgToPngBuffer(svg: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            try {
                svg2img(svg, { format: 'png', width: 800, height: 600 }, (error: any, buffer: any) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(buffer);
                    }
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Generate a combined diagram showing both phase model and workflows
     */
    public generateCombinedDiagramSVG(
        phases: IPhase[],
        transitions: IPhaseTransition[],
        workflows: IWorkflowDetails[]
    ): string {
        // This would create a comprehensive diagram showing how workflows interact with phases
        // For brevity, we'll use the phase model as the base
        let svg = this.generatePhaseModelSVG(phases, transitions);
        
        // Add workflow indicators to phases that trigger workflows
        // This would require additional logic to position workflow icons near relevant phases
        
        return svg;
    }
}