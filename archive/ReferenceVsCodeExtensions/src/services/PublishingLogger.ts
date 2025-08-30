/**
 * Publishing Logger Service
 * 
 * Tracks and logs all file publishing operations with detailed information
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { Inform } from '../Utilities/inform';

export interface IPublishRecord {
    fileName: string;
    filePath: string;
    server: string;
    timestamp: Date;
    success: boolean;
    size?: number;
    duration?: number;
    error?: string;
    batchId?: string;
}

export interface IPublishBatch {
    batchId: string;
    server: string;
    startTime: Date;
    endTime?: Date;
    totalFiles: number;
    successCount: number;
    failedCount: number;
    totalSize: number;
    files: IPublishRecord[];
}

export class PublishingLogger {
    private static instance: PublishingLogger;
    private outputChannel: vscode.OutputChannel;
    private currentBatches: Map<string, IPublishBatch> = new Map();
    private publishHistory: IPublishRecord[] = [];
    private readonly MAX_HISTORY = 1000;
    private lastCacheResets: Map<string, { cacheKey: string, timestamp: Date }> = new Map();

    private constructor() {
        this.outputChannel = vscode.window.createOutputChannel('ShareDo Publishing Log');
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): PublishingLogger {
        if (!PublishingLogger.instance) {
            PublishingLogger.instance = new PublishingLogger();
        }
        return PublishingLogger.instance;
    }

    /**
     * Start a new publishing batch
     */
    public startBatch(batchId: string, server: string, totalFiles: number): void {
        const batch: IPublishBatch = {
            batchId,
            server,
            startTime: new Date(),
            totalFiles,
            successCount: 0,
            failedCount: 0,
            totalSize: 0,
            files: []
        };

        this.currentBatches.set(batchId, batch);

        // Log batch start
        this.logSeparator();
        this.log(`📦 PUBLISHING BATCH STARTED`);
        this.log(`Batch ID: ${batchId}`);
        this.log(`Server: ${server}`);
        this.log(`Total Files: ${totalFiles}`);
        this.log(`Start Time: ${batch.startTime.toLocaleString()}`);
        this.logSeparator();
    }

    /**
     * Log a file publishing start
     */
    public logFileStart(filePath: string, server: string, batchId?: string): void {
        const fileName = path.basename(filePath);
        const timestamp = new Date();
        
        this.log(`📤 Publishing: ${fileName}`);
        this.log(`   Path: ${filePath}`);
        this.log(`   Server: ${server}`);
        this.log(`   Time: ${timestamp.toLocaleTimeString()}`);
        
        // Also log to VS Code's information system
        Inform.writeInfo(`Publishing file: ${fileName} to ${server}`);
    }

    /**
     * Log a successful file publish
     */
    public logFileSuccess(
        filePath: string, 
        server: string, 
        duration: number,
        size?: number,
        batchId?: string
    ): IPublishRecord {
        const fileName = path.basename(filePath);
        const record: IPublishRecord = {
            fileName,
            filePath,
            server,
            timestamp: new Date(),
            success: true,
            duration,
            size,
            batchId
        };

        // Add to history
        this.addToHistory(record);

        // Update batch if applicable
        if (batchId && this.currentBatches.has(batchId)) {
            const batch = this.currentBatches.get(batchId)!;
            batch.files.push(record);
            batch.successCount++;
            if (size) {
                batch.totalSize += size;
            }
        }

        // Log success
        this.log(`✅ SUCCESS: ${fileName}`);
        this.log(`   Duration: ${duration}ms`);
        if (size) {
            this.log(`   Size: ${this.formatFileSize(size)}`);
        }
        this.log(`   Status: Published successfully`);
        this.log('');

        // Also show in status bar briefly
        const sizeStr = size ? ` (${this.formatFileSize(size)})` : '';
        vscode.window.setStatusBarMessage(
            `✅ Published: ${fileName}${sizeStr} in ${duration}ms`,
            3000
        );

        return record;
    }

    /**
     * Log a failed file publish
     */
    public logFileFailure(
        filePath: string,
        server: string,
        error: string,
        duration?: number,
        batchId?: string
    ): IPublishRecord {
        const fileName = path.basename(filePath);
        const record: IPublishRecord = {
            fileName,
            filePath,
            server,
            timestamp: new Date(),
            success: false,
            duration,
            error,
            batchId
        };

        // Add to history
        this.addToHistory(record);

        // Update batch if applicable
        if (batchId && this.currentBatches.has(batchId)) {
            const batch = this.currentBatches.get(batchId)!;
            batch.files.push(record);
            batch.failedCount++;
        }

        // Log failure
        this.log(`❌ FAILED: ${fileName}`);
        this.log(`   Error: ${error}`);
        if (duration) {
            this.log(`   Duration: ${duration}ms`);
        }
        this.log('');

        // Log error to error system
        Inform.writeError(`Publishing failed for ${fileName}`, error);

        return record;
    }

    /**
     * Log cache reset operation
     */
    public logCacheReset(
        server: string,
        cacheKey: string,
        success: boolean,
        error?: string
    ): void {
        this.logSeparator();
        if (success) {
            this.log(`🔄 CACHE HEADERS RESET`);
            this.log(`   Server: ${server}`);
            this.log(`   New Cache Key: ${cacheKey}`);
            this.log(`   Status: ✅ Successfully reset`);
            this.log(`   Time: ${new Date().toLocaleTimeString()}`);
            
            // Store the last cache reset for this server
            this.lastCacheResets.set(server, { 
                cacheKey, 
                timestamp: new Date() 
            });
        } else {
            this.log(`❌ CACHE RESET FAILED`);
            this.log(`   Server: ${server}`);
            this.log(`   Error: ${error || 'Unknown error'}`);
            this.log(`   Time: ${new Date().toLocaleTimeString()}`);
        }
        this.logSeparator();
        this.log('');
    }

    /**
     * Complete a batch and show summary
     */
    public completeBatch(batchId: string): void {
        const batch = this.currentBatches.get(batchId);
        if (!batch) {
            return;
        }

        batch.endTime = new Date();
        const duration = batch.endTime.getTime() - batch.startTime.getTime();

        // Log batch summary
        this.logSeparator();
        this.log(`📊 PUBLISHING BATCH COMPLETED`);
        this.log(`Batch ID: ${batchId}`);
        this.log(`Server: ${batch.server}`);
        this.log(`Duration: ${this.formatDuration(duration)}`);
        this.log('');
        this.log(`📈 STATISTICS:`);
        this.log(`   Total Files: ${batch.totalFiles}`);
        this.log(`   ✅ Successful: ${batch.successCount}`);
        this.log(`   ❌ Failed: ${batch.failedCount}`);
        this.log(`   📦 Total Size: ${this.formatFileSize(batch.totalSize)}`);
        
        if (batch.successCount > 0) {
            const avgDuration = batch.files
                .filter(f => f.success && f.duration)
                .reduce((sum, f) => sum + (f.duration || 0), 0) / batch.successCount;
            this.log(`   ⏱️ Avg Duration: ${Math.round(avgDuration)}ms`);
        }

        // Log file details
        if (batch.files.length > 0) {
            this.log('');
            this.log(`📁 FILE DETAILS:`);
            batch.files.forEach((file, index) => {
                const status = file.success ? '✅' : '❌';
                const sizeStr = file.size ? ` (${this.formatFileSize(file.size)})` : '';
                const durationStr = file.duration ? ` - ${file.duration}ms` : '';
                this.log(`   ${index + 1}. ${status} ${file.fileName}${sizeStr}${durationStr}`);
                if (!file.success && file.error) {
                    this.log(`      Error: ${file.error}`);
                }
            });
        }

        // Show cache reset info if available
        const cacheReset = this.lastCacheResets.get(batch.server);
        if (cacheReset && 
            cacheReset.timestamp.getTime() >= batch.startTime.getTime()) {
            this.log('');
            this.log(`🔄 CACHE STATUS:`);
            this.log(`   Cache Key: ${cacheReset.cacheKey}`);
            this.log(`   Reset Time: ${cacheReset.timestamp.toLocaleTimeString()}`);
        }
        
        // Show completion time
        this.log('');
        this.log(`Completed at: ${batch.endTime.toLocaleString()}`);
        this.logSeparator();

        // Show summary notification
        const successRate = batch.totalFiles > 0 
            ? Math.round((batch.successCount / batch.totalFiles) * 100)
            : 0;

        if (batch.failedCount === 0) {
            vscode.window.showInformationMessage(
                `🎉 All ${batch.successCount} files published successfully! (${this.formatFileSize(batch.totalSize)})`
            );
        } else if (batch.successCount === 0) {
            vscode.window.showErrorMessage(
                `❌ All ${batch.failedCount} files failed to publish`
            );
        } else {
            vscode.window.showWarningMessage(
                `📊 Published ${batch.successCount}/${batch.totalFiles} files (${successRate}% success rate)`
            );
        }

        // Clean up batch
        this.currentBatches.delete(batchId);
    }

    /**
     * Show the publishing log
     */
    public showLog(): void {
        this.outputChannel.show();
    }

    /**
     * Clear the log
     */
    public clearLog(): void {
        this.outputChannel.clear();
        this.publishHistory = [];
        this.log('Publishing log cleared');
    }

    /**
     * Get publishing history
     */
    public getHistory(limit?: number): IPublishRecord[] {
        const actualLimit = limit || this.publishHistory.length;
        return this.publishHistory.slice(-actualLimit);
    }

    /**
     * Get statistics
     */
    public getStatistics(): {
        totalPublished: number;
        successCount: number;
        failedCount: number;
        totalSize: number;
        servers: Map<string, number>;
    } {
        const stats = {
            totalPublished: this.publishHistory.length,
            successCount: 0,
            failedCount: 0,
            totalSize: 0,
            servers: new Map<string, number>()
        };

        this.publishHistory.forEach(record => {
            if (record.success) {
                stats.successCount++;
                if (record.size) {
                    stats.totalSize += record.size;
                }
            } else {
                stats.failedCount++;
            }

            // Count by server
            const count = stats.servers.get(record.server) || 0;
            stats.servers.set(record.server, count + 1);
        });

        return stats;
    }

    /**
     * Export log to file
     */
    public async exportLog(outputPath?: string): Promise<void> {
        const defaultPath = path.join(
            vscode.workspace.rootPath || '',
            `publishing-log-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`
        );
        
        const uri = outputPath 
            ? vscode.Uri.file(outputPath)
            : vscode.Uri.file(defaultPath);

        const logContent = this.getFullLog();
        
        await vscode.workspace.fs.writeFile(
            uri,
            Buffer.from(logContent, 'utf8')
        );

        vscode.window.showInformationMessage(
            `Log exported to: ${uri.fsPath}`
        );
    }

    // Helper methods

    private log(message: string): void {
        this.outputChannel.appendLine(message);
    }

    private logSeparator(): void {
        this.log('═'.repeat(60));
    }

    private addToHistory(record: IPublishRecord): void {
        this.publishHistory.push(record);
        
        // Trim history if too large
        if (this.publishHistory.length > this.MAX_HISTORY) {
            this.publishHistory = this.publishHistory.slice(-this.MAX_HISTORY);
        }
    }

    private formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    }

    private formatDuration(ms: number): string {
        if (ms < 1000) {
            return `${ms}ms`;
        }
        
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        
        if (minutes > 0) {
            const remainingSeconds = seconds % 60;
            return `${minutes}m ${remainingSeconds}s`;
        }
        
        return `${seconds}s`;
    }

    private getFullLog(): string {
        let log = 'ShareDo Publishing Log\n';
        log += '='.repeat(60) + '\n';
        log += `Generated: ${new Date().toLocaleString()}\n\n`;

        // Add statistics
        const stats = this.getStatistics();
        log += 'STATISTICS:\n';
        log += `Total Published: ${stats.totalPublished}\n`;
        log += `Successful: ${stats.successCount}\n`;
        log += `Failed: ${stats.failedCount}\n`;
        log += `Total Size: ${this.formatFileSize(stats.totalSize)}\n`;
        log += '\nBy Server:\n';
        stats.servers.forEach((count, server) => {
            log += `  ${server}: ${count} files\n`;
        });

        // Add history
        log += '\n' + '='.repeat(60) + '\n';
        log += 'PUBLISHING HISTORY:\n\n';
        
        this.publishHistory.forEach((record, index) => {
            const status = record.success ? '✅' : '❌';
            log += `${index + 1}. ${status} ${record.fileName}\n`;
            log += `   Server: ${record.server}\n`;
            log += `   Time: ${record.timestamp.toLocaleString()}\n`;
            if (record.size) {
                log += `   Size: ${this.formatFileSize(record.size)}\n`;
            }
            if (record.duration) {
                log += `   Duration: ${record.duration}ms\n`;
            }
            if (record.error) {
                log += `   Error: ${record.error}\n`;
            }
            log += '\n';
        });

        return log;
    }

    /**
     * Dispose resources
     */
    public dispose(): void {
        this.outputChannel.dispose();
    }
}