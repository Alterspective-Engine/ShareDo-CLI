/**
 * Publishing Log Commands
 * 
 * Commands for viewing and managing the publishing log
 */

import * as vscode from 'vscode';
import { PublishingLogger } from '../services/PublishingLogger';
import { Inform } from '../Utilities/inform';

export class PublishingLogCommands {
    private static logger = PublishingLogger.getInstance();

    /**
     * Show the publishing log
     */
    static showPublishingLog(): void {
        PublishingLogCommands.logger.showLog();
        vscode.window.showInformationMessage('📊 Publishing log opened');
    }

    /**
     * Clear the publishing log
     */
    static async clearPublishingLog(): Promise<void> {
        const confirm = await vscode.window.showWarningMessage(
            'Clear all publishing history?',
            'Yes',
            'No'
        );

        if (confirm === 'Yes') {
            PublishingLogCommands.logger.clearLog();
            vscode.window.showInformationMessage('🧹 Publishing log cleared');
        }
    }

    /**
     * Export publishing log to file
     */
    static async exportPublishingLog(): Promise<void> {
        try {
            await PublishingLogCommands.logger.exportLog();
        } catch (error) {
            Inform.writeError('PublishingLogCommands.exportPublishingLog', error);
            vscode.window.showErrorMessage(`Failed to export log: ${error}`);
        }
    }

    /**
     * Show publishing statistics
     */
    static showPublishingStatistics(): void {
        const stats = PublishingLogCommands.logger.getStatistics();
        
        // Create a nice summary
        let summary = '📊 Publishing Statistics\n\n';
        summary += `Total Files Published: ${stats.totalPublished}\n`;
        summary += `✅ Successful: ${stats.successCount}\n`;
        summary += `❌ Failed: ${stats.failedCount}\n`;
        
        if (stats.successCount > 0) {
            const successRate = Math.round((stats.successCount / stats.totalPublished) * 100);
            summary += `Success Rate: ${successRate}%\n`;
        }
        
        summary += `\nTotal Size: ${PublishingLogCommands.formatFileSize(stats.totalSize)}\n`;
        
        if (stats.servers.size > 0) {
            summary += '\nBy Server:\n';
            stats.servers.forEach((count, server) => {
                summary += `  • ${server}: ${count} files\n`;
            });
        }
        
        // Show in output channel
        const outputChannel = vscode.window.createOutputChannel('Publishing Statistics');
        outputChannel.clear();
        outputChannel.append(summary);
        outputChannel.show();
        
        vscode.window.showInformationMessage(
            `📈 Published ${stats.totalPublished} files (${stats.successCount} successful, ${stats.failedCount} failed)`
        );
    }

    /**
     * Show recent publishing history
     */
    static showRecentHistory(): void {
        const history = PublishingLogCommands.logger.getHistory(20);
        
        if (history.length === 0) {
            vscode.window.showInformationMessage('No publishing history available');
            return;
        }
        
        // Create quick pick items
        const items = history.reverse().map(record => {
            const status = record.success ? '✅' : '❌';
            const time = record.timestamp.toLocaleTimeString();
            const sizeStr = record.size ? ` (${PublishingLogCommands.formatFileSize(record.size)})` : '';
            
            return {
                label: `${status} ${record.fileName}${sizeStr}`,
                description: record.server,
                detail: `${time} - ${record.success ? 'Success' : `Failed: ${record.error}`}`,
                record
            };
        });
        
        vscode.window.showQuickPick(items, {
            placeHolder: 'Recent publishing history',
            matchOnDescription: true,
            matchOnDetail: true
        }).then(selected => {
            if (selected) {
                // Show detailed info
                const record = selected.record;
                let details = `File: ${record.fileName}\n`;
                details += `Path: ${record.filePath}\n`;
                details += `Server: ${record.server}\n`;
                details += `Time: ${record.timestamp.toLocaleString()}\n`;
                details += `Status: ${record.success ? 'Success' : 'Failed'}\n`;
                
                if (record.size) {
                    details += `Size: ${PublishingLogCommands.formatFileSize(record.size)}\n`;
                }
                
                if (record.duration) {
                    details += `Duration: ${record.duration}ms\n`;
                }
                
                if (record.error) {
                    details += `Error: ${record.error}\n`;
                }
                
                vscode.window.showInformationMessage(details, { modal: true });
            }
        });
    }

    private static formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    }
}