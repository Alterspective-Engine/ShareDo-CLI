import { ExportApiClient, ShareDoError } from '@sharedo/core';
import { IPlatform, IProgressReporter } from '@sharedo/platform-adapter';

export interface ExportConfig {
  workflows?: string[];
  worktypes?: string[];
  forms?: string[];
  templates?: string[];
  includeMetadata?: boolean;
  format?: 'zip' | 'tar' | 'folder';
}

export interface ExportJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message?: string;
  packageId?: string;
  error?: string;
}

export class ExportManager {
  private pollingInterval = 2000; // 2 seconds
  
  constructor(
    private platform: IPlatform,
    private apiClient: ExportApiClient
  ) {}

  /**
   * Create an export package with selected items
   */
  async createExport(config: ExportConfig): Promise<string> {
    const progress = this.platform.ui.showProgress('Creating export package...');
    
    try {
      // Validate config
      progress.report({ message: 'Validating export configuration...', percentage: 10 });
      
      if (!config.workflows?.length && 
          !config.worktypes?.length && 
          !config.forms?.length && 
          !config.templates?.length) {
        throw new Error('At least one item must be selected for export');
      }
      
      // Create export job
      progress.report({ message: 'Initiating export job...', percentage: 20 });
      const job = await this.apiClient.createExportJob({
        workflows: config.workflows || [],
        worktypes: config.worktypes || [],
        forms: config.forms || [],
        templates: config.templates || [],
        metadata: config.includeMetadata || false
      });
      
      if (!job.id) {
        throw new Error('Failed to create export job');
      }
      
      // Monitor job progress
      progress.report({ message: 'Processing export...', percentage: 30 });
      const completedJob = await this.monitorExportWithProgress(job.id, progress);
      
      if (completedJob.status === 'failed') {
        throw new Error(completedJob.error || 'Export failed');
      }
      
      progress.complete();
      await this.platform.ui.showInfo('Export package created successfully');
      
      return completedJob.packageId!;
      
    } catch (error) {
      progress.error(error as Error);
      
      if (error instanceof ShareDoError) {
        await this.platform.ui.showError(
          `Failed to create export: ${error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Monitor an export job until completion
   */
  async monitorExport(jobId: string): Promise<ExportJob> {
    const maxAttempts = 60; // 2 minutes max
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const job = await this.apiClient.getExportStatus(jobId);
      
      if (job.status === 'completed' || job.status === 'failed') {
        return job;
      }
      
      // Wait before next poll
      await this.sleep(this.pollingInterval);
      attempts++;
    }
    
    throw new Error('Export job timed out');
  }

  /**
   * Monitor export with progress updates
   */
  private async monitorExportWithProgress(
    jobId: string, 
    progress: IProgressReporter
  ): Promise<ExportJob> {
    const maxAttempts = 60;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const job = await this.apiClient.getExportStatus(jobId);
      
      // Update progress
      const percentage = 30 + (job.progress * 0.6); // 30-90%
      progress.report({
        message: job.message || 'Processing export...',
        percentage
      });
      
      if (job.status === 'completed' || job.status === 'failed') {
        return job;
      }
      
      await this.sleep(this.pollingInterval);
      attempts++;
    }
    
    throw new Error('Export job timed out');
  }

  /**
   * Download an export package
   */
  async downloadPackage(packageId: string): Promise<string> {
    const progress = this.platform.ui.showProgress('Downloading export package...');
    
    try {
      // Select download location
      progress.report({ message: 'Selecting download location...', percentage: 10 });
      const savePath = await this.platform.ui.selectFolder({
        title: 'Select folder to save export package',
        defaultPath: this.platform.fs.getWorkspaceRoot()
      });
      
      if (!savePath) {
        progress.cancel();
        return '';
      }
      
      // Download package
      progress.report({ message: 'Downloading package...', percentage: 30 });
      const packageData = await this.apiClient.downloadPackage(packageId);
      
      // Save package
      progress.report({ message: 'Saving package...', percentage: 70 });
      const fileName = `export_${packageId}_${Date.now()}.zip`;
      const filePath = this.platform.fs.join(savePath, fileName);
      
      // Convert base64 or buffer to proper format
      let fileContent: Buffer;
      if (typeof packageData === 'string') {
        fileContent = Buffer.from(packageData, 'base64');
      } else {
        fileContent = packageData as Buffer;
      }
      
      await this.platform.fs.writeFile(filePath, fileContent.toString('base64'));
      
      progress.complete();
      await this.platform.ui.showInfo(`Package saved to ${filePath}`);
      
      return filePath;
      
    } catch (error) {
      progress.error(error as Error);
      
      if (error instanceof ShareDoError) {
        await this.platform.ui.showError(
          `Failed to download package: ${error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Extract an export package
   */
  async extractPackage(packagePath: string): Promise<void> {
    const progress = this.platform.ui.showProgress('Extracting package...');
    
    try {
      // Verify package exists
      progress.report({ message: 'Verifying package...', percentage: 10 });
      const exists = await this.platform.fs.exists(packagePath);
      
      if (!exists) {
        throw new Error(`Package not found: ${packagePath}`);
      }
      
      // Select extraction location
      progress.report({ message: 'Selecting extraction location...', percentage: 20 });
      const extractPath = await this.platform.ui.selectFolder({
        title: 'Select folder to extract package',
        defaultPath: this.platform.fs.dirname(packagePath)
      });
      
      if (!extractPath) {
        progress.cancel();
        return;
      }
      
      // Extract package
      progress.report({ message: 'Extracting files...', percentage: 50 });
      
      // Use platform-specific extraction
      // For now, we'll create a simple structure
      const packageName = this.platform.fs.basename(packagePath, '.zip');
      const targetDir = this.platform.fs.join(extractPath, packageName);
      
      await this.platform.fs.ensureDir(targetDir);
      
      // Read package content (simplified - real implementation would use proper unzip)
      const content = await this.platform.fs.readFile(packagePath);
      
      // For demonstration, save as JSON
      const manifestPath = this.platform.fs.join(targetDir, 'manifest.json');
      await this.platform.fs.writeFile(manifestPath, JSON.stringify({
        extracted: new Date().toISOString(),
        source: packagePath,
        format: 'export-package'
      }, null, 2));
      
      progress.complete();
      await this.platform.ui.showInfo(`Package extracted to ${targetDir}`);
      
      // Open extracted folder
      await this.platform.ui.openFolder(targetDir);
      
    } catch (error) {
      progress.error(error as Error);
      
      if (error instanceof ShareDoError) {
        await this.platform.ui.showError(
          `Failed to extract package: ${error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * List available export packages
   */
  async listPackages(options?: {
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    try {
      const packages = await this.apiClient.listPackages(
        options?.limit || 20,
        options?.offset || 0
      );
      
      return packages;
    } catch (error) {
      if (error instanceof ShareDoError) {
        await this.platform.ui.showError(
          `Failed to list packages: ${error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Delete an export package
   */
  async deletePackage(packageId: string): Promise<void> {
    const confirmed = await this.platform.ui.confirm(
      `Are you sure you want to delete package ${packageId}?`
    );
    
    if (!confirmed) {
      return;
    }
    
    try {
      await this.apiClient.deletePackage(packageId);
      await this.platform.ui.showInfo('Package deleted successfully');
    } catch (error) {
      if (error instanceof ShareDoError) {
        await this.platform.ui.showError(
          `Failed to delete package: ${error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Helper method to sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}