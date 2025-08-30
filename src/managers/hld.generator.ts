import { WorkflowApiClient, WorktypeApiClient, ShareDoError } from '@sharedo/core';
import { IPlatform, IProgressReporter } from '@sharedo/platform-adapter';

export interface HLDOptions {
  templateId?: string;
  includeDetails?: boolean;
  includeDiagrams?: boolean;
  format?: 'word' | 'pdf' | 'html' | 'markdown';
}

export interface HLDSection {
  title: string;
  content: string;
  level: number;
  children?: HLDSection[];
}

export interface HLDDocument {
  title: string;
  version: string;
  createdDate: string;
  sections: HLDSection[];
  metadata?: Record<string, any>;
}

export class HLDGenerator {
  constructor(
    private platform: IPlatform,
    private workflowClient: WorkflowApiClient,
    private worktypeClient: WorktypeApiClient
  ) {}

  /**
   * Generate HLD from an export package
   */
  async generateFromPackage(packagePath: string, options?: HLDOptions): Promise<string> {
    const progress = this.platform.ui.showProgress('Generating HLD document...');
    
    try {
      // Verify package exists
      progress.report({ message: 'Loading package...', percentage: 10 });
      const exists = await this.platform.fs.exists(packagePath);
      
      if (!exists) {
        throw new Error(`Package not found: ${packagePath}`);
      }
      
      // Load package content
      progress.report({ message: 'Reading package content...', percentage: 20 });
      const packageContent = await this.loadPackageContent(packagePath);
      
      // Generate HLD sections
      progress.report({ message: 'Generating document sections...', percentage: 40 });
      const document = await this.buildHLDDocument(packageContent, options);
      
      // Add diagrams if requested
      if (options?.includeDiagrams) {
        progress.report({ message: 'Creating diagrams...', percentage: 60 });
        await this.addDiagrams(document, packageContent);
      }
      
      // Format document
      progress.report({ message: 'Formatting document...', percentage: 80 });
      const formattedContent = await this.formatDocument(document, options?.format || 'markdown');
      
      // Save document
      progress.report({ message: 'Saving document...', percentage: 90 });
      const outputPath = await this.saveDocument(packagePath, formattedContent, options?.format || 'markdown');
      
      progress.complete();
      await this.platform.ui.showInfo(`HLD document generated: ${outputPath}`);
      
      return outputPath;
      
    } catch (error) {
      progress.error(error as Error);
      
      if (error instanceof ShareDoError) {
        await this.platform.ui.showError(
          `Failed to generate HLD: ${(error as Error).message}`
        );
      }
      throw error;
    }
  }

  /**
   * Generate HLD with a specific template
   */
  async generateWithTemplate(packagePath: string, templateId: string): Promise<string> {
    const progress = this.platform.ui.showProgress('Generating HLD with template...');
    
    try {
      // Load template
      progress.report({ message: 'Loading template...', percentage: 10 });
      const template = await this.loadTemplate(templateId);
      
      // Load package
      progress.report({ message: 'Loading package...', percentage: 20 });
      const packageContent = await this.loadPackageContent(packagePath);
      
      // Apply template
      progress.report({ message: 'Applying template...', percentage: 40 });
      const document = await this.applyTemplate(template, packageContent);
      
      // Generate diagrams based on template
      progress.report({ message: 'Generating template diagrams...', percentage: 60 });
      await this.addTemplateDiagrams(document, template, packageContent);
      
      // Format with template styles
      progress.report({ message: 'Formatting with template...', percentage: 80 });
      const formattedContent = await this.formatWithTemplate(document, template);
      
      // Save document
      progress.report({ message: 'Saving document...', percentage: 90 });
      const outputPath = await this.saveDocument(packagePath, formattedContent, template.format || 'word');
      
      progress.complete();
      await this.platform.ui.showInfo(`HLD document generated with template: ${outputPath}`);
      
      return outputPath;
      
    } catch (error) {
      progress.error(error as Error);
      
      if (error instanceof ShareDoError) {
        await this.platform.ui.showError(
          `Failed to generate HLD with template: ${(error as Error).message}`
        );
      }
      throw error;
    }
  }

  /**
   * Create workflow diagrams
   */
  async createDiagrams(workflow: any): Promise<string[]> {
    const diagrams: string[] = [];
    
    try {
      // Create flow diagram
      const flowDiagram = await this.createFlowDiagram(workflow);
      if (flowDiagram) {
        diagrams.push(flowDiagram);
      }
      
      // Create state diagram
      const stateDiagram = await this.createStateDiagram(workflow);
      if (stateDiagram) {
        diagrams.push(stateDiagram);
      }
      
      // Create data flow diagram
      if (workflow.dataFlow) {
        const dataFlowDiagram = await this.createDataFlowDiagram(workflow.dataFlow);
        if (dataFlowDiagram) {
          diagrams.push(dataFlowDiagram);
        }
      }
      
      return diagrams;
      
    } catch (error) {
      await this.platform.ui.showWarning(
        `Failed to create some diagrams: ${(error as Error).message}`
      );
      return diagrams;
    }
  }

  /**
   * Load package content
   */
  private async loadPackageContent(packagePath: string): Promise<any> {
    const content: any = {
      workflows: [],
      worktypes: [],
      forms: [],
      templates: []
    };
    
    // Check if it's a directory or zip file
    const isDirectory = await this.platform.fs.isDirectory(packagePath);
    
    if (isDirectory) {
      // Load from directory structure
      const workflowsDir = this.platform.fs.join(packagePath, 'workflows');
      if (await this.platform.fs.exists(workflowsDir)) {
        const files = await this.platform.fs.readdir(workflowsDir);
        for (const file of files) {
          if (file.endsWith('.json')) {
            const filePath = this.platform.fs.join(workflowsDir, file);
            const data = await this.platform.fs.readFile(filePath);
            content.workflows.push(JSON.parse(data));
          }
        }
      }
      
      // Similar for worktypes, forms, templates...
      
    } else {
      // For now, assume it's a JSON manifest
      const data = await this.platform.fs.readFile(packagePath);
      const manifest = JSON.parse(data);
      Object.assign(content, manifest);
    }
    
    return content;
  }

  /**
   * Build HLD document structure
   */
  private async buildHLDDocument(packageContent: any, options?: HLDOptions): Promise<HLDDocument> {
    const document: HLDDocument = {
      title: 'High Level Design Document',
      version: '1.0.0',
      createdDate: new Date().toISOString(),
      sections: [],
      metadata: {
        generator: 'ShareDo HLD Generator',
        options: options
      }
    };
    
    // Executive Summary
    document.sections.push({
      title: 'Executive Summary',
      content: this.generateExecutiveSummary(packageContent),
      level: 1
    });
    
    // System Overview
    document.sections.push({
      title: 'System Overview',
      content: this.generateSystemOverview(packageContent),
      level: 1,
      children: [
        {
          title: 'Architecture',
          content: this.generateArchitectureSection(packageContent),
          level: 2
        },
        {
          title: 'Components',
          content: this.generateComponentsSection(packageContent),
          level: 2
        }
      ]
    });
    
    // Workflows
    if (packageContent.workflows?.length > 0) {
      const workflowSection: HLDSection = {
        title: 'Workflows',
        content: `The system includes ${packageContent.workflows.length} workflow(s).`,
        level: 1,
        children: []
      };
      
      for (const workflow of packageContent.workflows) {
        workflowSection.children?.push({
          title: workflow.name || 'Unnamed Workflow',
          content: this.generateWorkflowSection(workflow, options?.includeDetails),
          level: 2
        });
      }
      
      document.sections.push(workflowSection);
    }
    
    // Work Types
    if (packageContent.worktypes?.length > 0) {
      const worktypeSection: HLDSection = {
        title: 'Work Types',
        content: `The system defines ${packageContent.worktypes.length} work type(s).`,
        level: 1,
        children: []
      };
      
      for (const worktype of packageContent.worktypes) {
        worktypeSection.children?.push({
          title: worktype.name || 'Unnamed Work Type',
          content: this.generateWorktypeSection(worktype),
          level: 2
        });
      }
      
      document.sections.push(worktypeSection);
    }
    
    // Forms and Templates
    if (packageContent.forms?.length > 0 || packageContent.templates?.length > 0) {
      document.sections.push({
        title: 'User Interface',
        content: this.generateUISection(packageContent),
        level: 1,
        children: [
          {
            title: 'Forms',
            content: this.generateFormsSection(packageContent.forms),
            level: 2
          },
          {
            title: 'Templates',
            content: this.generateTemplatesSection(packageContent.templates),
            level: 2
          }
        ]
      });
    }
    
    return document;
  }

  /**
   * Generate executive summary
   */
  private generateExecutiveSummary(packageContent: any): string {
    const stats = {
      workflows: packageContent.workflows?.length || 0,
      worktypes: packageContent.worktypes?.length || 0,
      forms: packageContent.forms?.length || 0,
      templates: packageContent.templates?.length || 0
    };
    
    return `This document describes the high-level design of a ShareDo system implementation containing ${stats.workflows} workflow(s), ${stats.worktypes} work type(s), ${stats.forms} form(s), and ${stats.templates} template(s).`;
  }

  /**
   * Generate system overview
   */
  private generateSystemOverview(packageContent: any): string {
    return 'The system is built on the ShareDo platform, providing workflow automation, document management, and process orchestration capabilities.';
  }

  /**
   * Generate architecture section
   */
  private generateArchitectureSection(packageContent: any): string {
    return 'The architecture follows a modular design pattern with clear separation of concerns between workflow orchestration, data management, and user interface components.';
  }

  /**
   * Generate components section
   */
  private generateComponentsSection(packageContent: any): string {
    const components = [];
    
    if (packageContent.workflows?.length > 0) {
      components.push('Workflow Engine');
    }
    if (packageContent.worktypes?.length > 0) {
      components.push('Work Type Manager');
    }
    if (packageContent.forms?.length > 0) {
      components.push('Form Processor');
    }
    if (packageContent.templates?.length > 0) {
      components.push('Template Engine');
    }
    
    return `Key components: ${components.join(', ')}`;
  }

  /**
   * Generate workflow section
   */
  private generateWorkflowSection(workflow: any, includeDetails?: boolean): string {
    let content = `${workflow.description || 'No description available.'}\\n\\n`;
    
    if (workflow.steps?.length > 0) {
      content += `Steps: ${workflow.steps.length}\\n`;
      
      if (includeDetails) {
        content += '\\nStep Details:\\n';
        workflow.steps.forEach((step: any, index: number) => {
          content += `${index + 1}. ${step.name || step.id} (${step.type})\\n`;
        });
      }
    }
    
    return content;
  }

  /**
   * Generate worktype section
   */
  private generateWorktypeSection(worktype: any): string {
    return `${worktype.description || 'No description available.'}\\n\\nFields: ${worktype.fields?.length || 0}`;
  }

  /**
   * Generate UI section
   */
  private generateUISection(packageContent: any): string {
    return 'The user interface provides forms for data entry and templates for document generation.';
  }

  /**
   * Generate forms section
   */
  private generateFormsSection(forms: any[]): string {
    if (!forms || forms.length === 0) {
      return 'No forms defined.';
    }
    
    return `${forms.length} form(s) defined for user interaction.`;
  }

  /**
   * Generate templates section
   */
  private generateTemplatesSection(templates: any[]): string {
    if (!templates || templates.length === 0) {
      return 'No templates defined.';
    }
    
    return `${templates.length} template(s) available for document generation.`;
  }

  /**
   * Add diagrams to document
   */
  private async addDiagrams(document: HLDDocument, packageContent: any): Promise<void> {
    // Placeholder for diagram generation
    // In a real implementation, this would generate actual diagrams
    const diagramSection: HLDSection = {
      title: 'Diagrams',
      content: 'Visual representations of the system architecture and workflows.',
      level: 1,
      children: []
    };
    
    if (packageContent.workflows?.length > 0) {
      diagramSection.children?.push({
        title: 'Workflow Diagrams',
        content: '[Workflow diagrams would be inserted here]',
        level: 2
      });
    }
    
    document.sections.push(diagramSection);
  }

  /**
   * Format document based on format type
   */
  private async formatDocument(document: HLDDocument, format: string): Promise<string> {
    switch (format) {
      case 'markdown':
        return this.formatAsMarkdown(document);
      case 'html':
        return this.formatAsHTML(document);
      case 'word':
      case 'pdf':
        // For Word/PDF, return markdown that can be converted
        return this.formatAsMarkdown(document);
      default:
        return this.formatAsMarkdown(document);
    }
  }

  /**
   * Format document as Markdown
   */
  private formatAsMarkdown(document: HLDDocument): string {
    let content = `# ${document.title}\\n\\n`;
    content += `**Version:** ${document.version}\\n`;
    content += `**Date:** ${new Date(document.createdDate).toLocaleDateString()}\\n\\n`;
    
    for (const section of document.sections) {
      content += this.formatSectionAsMarkdown(section);
    }
    
    return content;
  }

  /**
   * Format section as Markdown
   */
  private formatSectionAsMarkdown(section: HLDSection): string {
    const heading = '#'.repeat(section.level);
    let content = `${heading} ${section.title}\\n\\n${section.content}\\n\\n`;
    
    if (section.children) {
      for (const child of section.children) {
        content += this.formatSectionAsMarkdown(child);
      }
    }
    
    return content;
  }

  /**
   * Format document as HTML
   */
  private formatAsHTML(document: HLDDocument): string {
    let content = `<!DOCTYPE html>
<html>
<head>
  <title>${document.title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { color: #333; }
    h2 { color: #666; }
    h3 { color: #999; }
  </style>
</head>
<body>
  <h1>${document.title}</h1>
  <p><strong>Version:</strong> ${document.version}</p>
  <p><strong>Date:</strong> ${new Date(document.createdDate).toLocaleDateString()}</p>
`;
    
    for (const section of document.sections) {
      content += this.formatSectionAsHTML(section);
    }
    
    content += '</body></html>';
    return content;
  }

  /**
   * Format section as HTML
   */
  private formatSectionAsHTML(section: HLDSection): string {
    const tag = `h${Math.min(section.level + 1, 6)}`;
    let content = `<${tag}>${section.title}</${tag}>\\n<p>${section.content}</p>\\n`;
    
    if (section.children) {
      for (const child of section.children) {
        content += this.formatSectionAsHTML(child);
      }
    }
    
    return content;
  }

  /**
   * Save document to file
   */
  private async saveDocument(packagePath: string, content: string, format: string): Promise<string> {
    const packageName = this.platform.fs.basename(packagePath, this.platform.fs.extname(packagePath));
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const extension = format === 'markdown' ? 'md' : format;
    const fileName = `HLD_${packageName}_${timestamp}.${extension}`;
    
    const outputDir = this.platform.fs.dirname(packagePath);
    const outputPath = this.platform.fs.join(outputDir, fileName);
    
    await this.platform.fs.writeFile(outputPath, content);
    
    return outputPath;
  }

  /**
   * Load template (placeholder)
   */
  private async loadTemplate(templateId: string): Promise<any> {
    // In a real implementation, this would load from the template service
    return {
      id: templateId,
      name: 'Default Template',
      format: 'word',
      sections: []
    };
  }

  /**
   * Apply template (placeholder)
   */
  private async applyTemplate(template: any, packageContent: any): Promise<HLDDocument> {
    // Apply template structure to content
    return this.buildHLDDocument(packageContent);
  }

  /**
   * Add template diagrams (placeholder)
   */
  private async addTemplateDiagrams(document: HLDDocument, template: any, packageContent: any): Promise<void> {
    await this.addDiagrams(document, packageContent);
  }

  /**
   * Format with template (placeholder)
   */
  private async formatWithTemplate(document: HLDDocument, template: any): Promise<string> {
    return this.formatDocument(document, template.format);
  }

  /**
   * Create flow diagram (placeholder)
   */
  private async createFlowDiagram(workflow: any): Promise<string> {
    // In a real implementation, this would generate an actual diagram
    return `flow-diagram-${workflow.id || 'unknown'}.svg`;
  }

  /**
   * Create state diagram (placeholder)
   */
  private async createStateDiagram(workflow: any): Promise<string> {
    // In a real implementation, this would generate an actual diagram
    return `state-diagram-${workflow.id || 'unknown'}.svg`;
  }

  /**
   * Create data flow diagram (placeholder)
   */
  private async createDataFlowDiagram(dataFlow: any): Promise<string> {
    // In a real implementation, this would generate an actual diagram
    return `dataflow-diagram.svg`;
  }
}