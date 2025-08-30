/**
 * Simple Diagram Generator for HLD Documents
 * Generates SVG-based diagrams without external dependencies
 */

import { IPhase, IPhaseTransition, IWorkflowDetails, IWorkflowStep } from './EnhancedHLDDocumentGenerator';

export class SimpleDiagramGenerator {
    private static instance: SimpleDiagramGenerator;

    private constructor() {}

    public static getInstance(): SimpleDiagramGenerator {
        if (!SimpleDiagramGenerator.instance) {
            SimpleDiagramGenerator.instance = new SimpleDiagramGenerator();
        }
        return SimpleDiagramGenerator.instance;
    }

    /**
     * Generate Phase Model Diagram as base64 data URL
     */
    public generatePhaseModelDataUrl(
        phases: IPhase[],
        transitions: IPhaseTransition[]
    ): string {
        // Validate inputs
        if (!phases || phases.length === 0) {
            console.warn('No phases provided for diagram generation');
            return this.generateEmptyDiagramDataUrl('No phases defined');
        }
        
        try {
            const svg = this.generatePhaseModelSVG(phases, transitions || []);
            const base64 = Buffer.from(svg, 'utf-8').toString('base64');
            return `data:image/svg+xml;base64,${base64}`;
        } catch (error) {
            console.error('Failed to generate phase model diagram:', error);
            return this.generateEmptyDiagramDataUrl('Error generating diagram');
        }
    }

    /**
     * Generate Workflow Diagram as base64 data URL
     */
    public generateWorkflowDataUrl(workflow: IWorkflowDetails): string {
        // Validate input
        if (!workflow) {
            console.warn('No workflow provided for diagram generation');
            return this.generateEmptyDiagramDataUrl('No workflow defined');
        }
        
        try {
            const svg = this.generateWorkflowSVG(workflow);
            const base64 = Buffer.from(svg, 'utf-8').toString('base64');
            return `data:image/svg+xml;base64,${base64}`;
        } catch (error) {
            console.error('Failed to generate workflow diagram:', error);
            return this.generateEmptyDiagramDataUrl('Error generating diagram');
        }
    }

    /**
     * Generate empty diagram with message
     */
    private generateEmptyDiagramDataUrl(message: string): string {
        const svg = `<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="200" fill="#f0f0f0" stroke="#ccc" stroke-width="2"/>
            <text x="200" y="100" text-anchor="middle" font-family="Arial" font-size="14" fill="#666">
                ${this.escapeXml(message)}
            </text>
        </svg>`;
        const base64 = Buffer.from(svg, 'utf-8').toString('base64');
        return `data:image/svg+xml;base64,${base64}`;
    }

    /**
     * Escape XML special characters
     */
    private escapeXml(text: string): string {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    /**
     * Generate Phase Model SVG
     */
    private generatePhaseModelSVG(
        phases: IPhase[],
        transitions: IPhaseTransition[]
    ): string {
        const width = 800;
        const height = 600;
        const nodeWidth = 140;
        const nodeHeight = 80;
        const padding = 50;

        let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">`;
        
        // Add styles
        svg += `
            <style>
                .phase-box { fill-opacity: 0.9; stroke: #333; stroke-width: 2; }
                .phase-text { font-family: Arial; font-size: 14px; fill: white; font-weight: bold; }
                .transition-line { stroke: #666; stroke-width: 2; fill: none; }
                .arrow { fill: #666; }
                .legend-text { font-family: Arial; font-size: 11px; }
                .badge { fill-opacity: 0.8; stroke: #333; stroke-width: 1; }
                .badge-text { font-family: Arial; font-size: 10px; font-weight: bold; }
            </style>
        `;

        // Add arrow marker
        svg += `
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                        refX="9" refY="3.5" orient="auto" class="arrow">
                    <polygon points="0 0, 10 3.5, 0 7" />
                </marker>
            </defs>
        `;

        // Calculate positions
        const positions = new Map<string, { x: number, y: number }>();
        let x = padding;
        let y = padding + 50;

        // Position phases in a flow
        phases.forEach((phase, index) => {
            if (phase.isInitial) {
                positions.set(phase.systemName, { x: padding, y: height / 2 - nodeHeight / 2 });
            } else if (phase.isFinal) {
                if (phase.systemName === 'completed') {
                    positions.set(phase.systemName, { x: width - padding - nodeWidth, y: height / 2 - nodeHeight - 20 });
                } else if (phase.systemName === 'cancelled') {
                    positions.set(phase.systemName, { x: width - padding - nodeWidth, y: height / 2 + 20 });
                } else {
                    positions.set(phase.systemName, { x: width - padding - nodeWidth, y: height / 2 - nodeHeight / 2 });
                }
            } else {
                const col = index % 2;
                const row = Math.floor(index / 2);
                positions.set(phase.systemName, { 
                    x: padding + 200 + col * 200, 
                    y: padding + 100 + row * 150 
                });
            }
        });

        // Draw transitions
        transitions.forEach(transition => {
            const from = positions.get(transition.fromPhase);
            const to = positions.get(transition.toPhase);
            if (from && to) {
                const strokeDasharray = transition.automaticTransition ? '5,5' : '';
                const strokeColor = transition.requiresApproval ? '#AA00AA' : 
                                  transition.automaticTransition ? '#00AA00' : '#0066CC';
                
                svg += `<line x1="${from.x + nodeWidth/2}" y1="${from.y + nodeHeight}" 
                              x2="${to.x + nodeWidth/2}" y2="${to.y}" 
                              class="transition-line" 
                              stroke="${strokeColor}"
                              stroke-dasharray="${strokeDasharray}"
                              marker-end="url(#arrowhead)" />`;
                
                // Add transition label
                const midX = (from.x + to.x + nodeWidth) / 2;
                const midY = (from.y + to.y + nodeHeight) / 2;
                svg += `<rect x="${midX - 50}" y="${midY - 10}" width="100" height="20" 
                              fill="white" stroke="${strokeColor}" rx="3" />`;
                svg += `<text x="${midX}" y="${midY + 4}" text-anchor="middle" 
                              font-size="10" font-family="Arial">${this.escapeXml(transition.name)}</text>`;
            }
        });

        // Draw phases
        phases.forEach(phase => {
            const pos = positions.get(phase.systemName);
            if (!pos) return;

            const color = this.getPhaseColor(phase);
            
            // Phase box
            svg += `<rect x="${pos.x}" y="${pos.y}" width="${nodeWidth}" height="${nodeHeight}" 
                          rx="10" class="phase-box" fill="${color}" />`;
            
            // Phase name
            svg += `<text x="${pos.x + nodeWidth/2}" y="${pos.y + 35}" 
                          text-anchor="middle" class="phase-text">${this.escapeXml(phase.name)}</text>`;
            
            // Phase icon
            const icon = this.getPhaseIcon(phase);
            svg += `<text x="${pos.x + 10}" y="${pos.y + 20}" font-size="18">${icon}</text>`;
            
            // Badges
            if (phase.isInitial) {
                svg += `<rect x="${pos.x + 5}" y="${pos.y + nodeHeight - 25}" width="40" height="18" 
                              rx="9" class="badge" fill="#00FF00" />`;
                svg += `<text x="${pos.x + 25}" y="${pos.y + nodeHeight - 11}" 
                              text-anchor="middle" class="badge-text">START</text>`;
            }
            if (phase.isFinal) {
                svg += `<rect x="${pos.x + nodeWidth - 45}" y="${pos.y + nodeHeight - 25}" width="35" height="18" 
                              rx="9" class="badge" fill="#FF0000" />`;
                svg += `<text x="${pos.x + nodeWidth - 27}" y="${pos.y + nodeHeight - 11}" 
                              text-anchor="middle" class="badge-text" fill="white">END</text>`;
            }
            
            // SLA indicator
            if (phase.sla) {
                svg += `<circle cx="${pos.x + nodeWidth - 15}" cy="${pos.y + 15}" r="10" 
                              fill="#FFD700" stroke="#333" stroke-width="1" />`;
                svg += `<text x="${pos.x + nodeWidth - 15}" y="${pos.y + 19}" 
                              text-anchor="middle" font-size="10" font-weight="bold">
                              ${phase.sla.duration}${phase.sla.unit.charAt(0)}</text>`;
            }
        });

        // Add legend
        svg += this.drawLegend(width, height);

        svg += '</svg>';
        return svg;
    }

    /**
     * Generate Workflow SVG
     */
    private generateWorkflowSVG(workflow: IWorkflowDetails): string {
        const width = 800;
        const height = 500;
        const nodeWidth = 120;
        const nodeHeight = 60;
        const padding = 40;

        let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">`;
        
        // Add styles
        svg += `
            <style>
                .workflow-title { font-family: Arial; font-size: 18px; font-weight: bold; }
                .step-box { fill-opacity: 0.9; stroke: #333; stroke-width: 2; }
                .step-text { font-family: Arial; font-size: 12px; fill: white; }
                .step-type { font-family: Arial; font-size: 10px; }
                .connection { stroke: #666; stroke-width: 2; fill: none; }
            </style>
        `;

        // Add arrow marker
        svg += `
            <defs>
                <marker id="arrow" markerWidth="10" markerHeight="7" 
                        refX="9" refY="3.5" orient="auto" fill="#666">
                    <polygon points="0 0, 10 3.5, 0 7" />
                </marker>
            </defs>
        `;

        // Title
        svg += `<text x="${width/2}" y="30" text-anchor="middle" class="workflow-title">
                ${this.escapeXml(workflow.name)}</text>`;

        // Draw steps
        const steps = workflow.steps || [];
        let x = padding;
        let y = 80;
        const maxPerRow = 4;

        steps.forEach((step, index) => {
            const col = index % maxPerRow;
            const row = Math.floor(index / maxPerRow);
            x = padding + col * (nodeWidth + 40);
            y = 80 + row * (nodeHeight + 40);

            const color = this.getStepColor(step);
            const shape = this.getStepShape(step);
            
            // Draw step shape
            if (shape === 'diamond') {
                // Decision shape
                const cx = x + nodeWidth / 2;
                const cy = y + nodeHeight / 2;
                svg += `<path d="M ${cx} ${y} L ${x + nodeWidth} ${cy} L ${cx} ${y + nodeHeight} L ${x} ${cy} Z"
                              class="step-box" fill="${color}" />`;
            } else if (shape === 'circle') {
                // Start/end shape
                svg += `<ellipse cx="${x + nodeWidth/2}" cy="${y + nodeHeight/2}" 
                                rx="${nodeWidth/2}" ry="${nodeHeight/2}"
                                class="step-box" fill="${color}" />`;
            } else {
                // Regular rectangle
                svg += `<rect x="${x}" y="${y}" width="${nodeWidth}" height="${nodeHeight}" 
                              rx="5" class="step-box" fill="${color}" />`;
            }
            
            // Step text
            svg += `<text x="${x + nodeWidth/2}" y="${y + nodeHeight/2 - 5}" 
                          text-anchor="middle" class="step-text">Step ${step.order}</text>`;
            svg += `<text x="${x + nodeWidth/2}" y="${y + nodeHeight/2 + 10}" 
                          text-anchor="middle" class="step-text" font-size="10">${this.escapeXml(step.name)}</text>`;
            
            // Step type badge
            svg += `<rect x="${x + 5}" y="${y + 5}" width="40" height="15" 
                          rx="7" fill="rgba(255,255,255,0.8)" />`;
            svg += `<text x="${x + 25}" y="${y + 14}" text-anchor="middle" 
                          class="step-type">${step.type}</text>`;
            
            // Draw connection to next step
            if (index < steps.length - 1) {
                const nextCol = (index + 1) % maxPerRow;
                const nextRow = Math.floor((index + 1) / maxPerRow);
                const nextX = padding + nextCol * (nodeWidth + 40);
                const nextY = 80 + nextRow * (nodeHeight + 40);
                
                if (row === nextRow) {
                    // Horizontal connection
                    svg += `<line x1="${x + nodeWidth}" y1="${y + nodeHeight/2}" 
                                  x2="${nextX}" y2="${nextY + nodeHeight/2}" 
                                  class="connection" marker-end="url(#arrow)" />`;
                } else {
                    // Vertical connection
                    svg += `<path d="M ${x + nodeWidth/2} ${y + nodeHeight} 
                                    Q ${x + nodeWidth/2} ${y + nodeHeight + 20} 
                                      ${nextX + nodeWidth/2} ${nextY}"
                                  class="connection" fill="none" marker-end="url(#arrow)" />`;
                }
            }
        });

        // Add metadata
        svg += `<rect x="${padding}" y="${height - 50}" width="${width - padding*2}" height="40" 
                      fill="white" stroke="#333" rx="5" opacity="0.9" />`;
        svg += `<text x="${padding + 10}" y="${height - 30}" font-size="11" font-family="Arial">
                Type: ${workflow.type}</text>`;
        if (workflow.trigger) {
            svg += `<text x="${padding + 150}" y="${height - 30}" font-size="11" font-family="Arial">
                    Trigger: ${workflow.trigger}</text>`;
        }
        if (workflow.errorHandling) {
            svg += `<text x="${padding + 350}" y="${height - 30}" font-size="11" font-family="Arial">
                    Error: ${workflow.errorHandling}</text>`;
        }

        svg += '</svg>';
        return svg;
    }

    /**
     * Draw legend
     */
    private drawLegend(width: number, height: number): string {
        let svg = '';
        const legendY = height - 70;
        const legendX = 50;

        // Background
        svg += `<rect x="${legendX - 10}" y="${legendY - 10}" width="${width - 80}" height="60" 
                      fill="white" stroke="#333" rx="5" opacity="0.95" />`;

        // Title
        svg += `<text x="${legendX}" y="${legendY + 5}" font-weight="bold" class="legend-text">Legend:</text>`;

        // Phase colors
        const colors = [
            { name: 'Draft', color: '#808080' },
            { name: 'Review', color: '#FFA500' },
            { name: 'In Progress', color: '#0000FF' },
            { name: 'Completed', color: '#008000' },
            { name: 'Cancelled', color: '#FF0000' }
        ];

        let currentX = legendX;
        colors.forEach(item => {
            svg += `<rect x="${currentX}" y="${legendY + 15}" width="15" height="15" 
                          fill="${item.color}" stroke="#333" />`;
            svg += `<text x="${currentX + 20}" y="${legendY + 25}" class="legend-text">${item.name}</text>`;
            currentX += 90;
        });

        // Line types
        currentX = legendX;
        const lineY = legendY + 40;
        
        svg += `<line x1="${currentX}" y1="${lineY}" x2="${currentX + 30}" y2="${lineY}"
                      stroke="#00AA00" stroke-width="2" stroke-dasharray="5,5" />`;
        svg += `<text x="${currentX + 35}" y="${lineY + 3}" class="legend-text">Automatic</text>`;
        currentX += 100;

        svg += `<line x1="${currentX}" y1="${lineY}" x2="${currentX + 30}" y2="${lineY}"
                      stroke="#0066CC" stroke-width="2" />`;
        svg += `<text x="${currentX + 35}" y="${lineY + 3}" class="legend-text">Manual</text>`;
        currentX += 100;

        svg += `<line x1="${currentX}" y1="${lineY}" x2="${currentX + 30}" y2="${lineY}"
                      stroke="#AA00AA" stroke-width="2" />`;
        svg += `<text x="${currentX + 35}" y="${lineY + 3}" class="legend-text">Approval</text>`;

        return svg;
    }

    private getPhaseColor(phase: IPhase): string {
        const colorMap: { [key: string]: string } = {
            'draft': '#808080',
            'review': '#FFA500',
            'in_progress': '#0000FF',
            'completed': '#008000',
            'cancelled': '#FF0000'
        };
        return colorMap[phase.systemName] || '#E0E0E0';
    }

    private getPhaseIcon(phase: IPhase): string {
        const iconMap: { [key: string]: string } = {
            'draft': '✏️',
            'review': '👁️',
            'in_progress': '⚙️',
            'completed': '✅',
            'cancelled': '❌'
        };
        return iconMap[phase.systemName] || '📄';
    }

    private getStepColor(step: IWorkflowStep): string {
        const colorMap: { [key: string]: string } = {
            'action': '#4A90E2',
            'decision': '#E67E22',
            'branch': '#E67E22',
            'wait': '#9B59B6',
            'query': '#3498DB',
            'transform': '#16A085',
            'notification': '#F39C12'
        };
        return colorMap[step.type] || '#95A5A6';
    }

    private getStepShape(step: IWorkflowStep): string {
        if (step.type === 'decision' || step.type === 'branch') {
            return 'diamond';
        }
        if (step.order === 1 || step.type === 'start' || step.type === 'end') {
            return 'circle';
        }
        return 'rectangle';
    }
}