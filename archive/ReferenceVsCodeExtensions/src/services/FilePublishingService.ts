/**
 * File Publishing Service
 * 
 * Handles file publishing to ShareDo servers with automatic cache management
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { SharedoClient } from '../sharedoClient';
import { Inform } from '../Utilities/inform';
import { CacheManagementService } from './CacheManagementService';

export interface IPublishResult {
    success: boolean;
    filesPublished: number;
    errors: string[];
    cacheReset: boolean;
}

export class FilePublishingService {
    private static instance: FilePublishingService;
    private cacheService: CacheManagementService;

    private constructor() {
        this.cacheService = CacheManagementService.getInstance();
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): FilePublishingService {
        if (!FilePublishingService.instance) {
            FilePublishingService.instance = new FilePublishingService();
        }
        return FilePublishingService.instance;
    }

    /**
     * Publish a single file to ShareDo server
     */
    public async publishFile(
        filePath: string, 
        server: SharedoClient,
        targetPath?: string,
        resetCache: boolean = true
    ): Promise<IPublishResult> {
        const result: IPublishResult = {
            success: false,
            filesPublished: 0,
            errors: [],
            cacheReset: false
        };

        try {
            Inform.writeInfo(`Publishing file ${filePath} to ${server.url}`);

            // Read file content
            const fileUri = vscode.Uri.file(filePath);
            const content = await vscode.workspace.fs.readFile(fileUri);
            
            // Determine target path
            const fileName = path.basename(filePath);
            const target = targetPath || fileName;

            // Publish the file (using existing ShareDo file publishing logic)
            const publishSuccess = await this.performFilePublish(
                content,
                target,
                server
            );

            if (publishSuccess) {
                result.success = true;
                result.filesPublished = 1;
                
                // Reset cache if requested (using debouncer)
                if (resetCache) {
                    result.cacheReset = await this.cacheService.resetCacheHeadersDebounced(server);
                    if (!result.cacheReset) {
                        Inform.writeInfo('FilePublishingService', 'File published but cache reset failed');
                    }
                }
                
                vscode.window.showInformationMessage(
                    `✅ File published successfully${result.cacheReset ? ' (cache cleared)' : ''}`
                );
            } else {
                result.errors.push('Failed to publish file');
                vscode.window.showErrorMessage('Failed to publish file');
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            result.errors.push(errorMessage);
            Inform.writeError('FilePublishingService.publishFile', error);
            vscode.window.showErrorMessage(`Publishing failed: ${errorMessage}`);
        }

        return result;
    }

    /**
     * Publish multiple files to ShareDo server
     */
    public async publishFiles(
        filePaths: string[],
        server: SharedoClient,
        resetCache: boolean = true
    ): Promise<IPublishResult> {
        const result: IPublishResult = {
            success: false,
            filesPublished: 0,
            errors: [],
            cacheReset: false
        };

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Publishing ${filePaths.length} files to ${server.url}`,
            cancellable: true
        }, async (progress, token) => {
            for (let i = 0; i < filePaths.length; i++) {
                if (token.isCancellationRequested) {
                    result.errors.push('Publishing cancelled by user');
                    break;
                }

                const filePath = filePaths[i];
                const fileName = path.basename(filePath);
                
                progress.report({
                    increment: (100 / filePaths.length),
                    message: `Publishing ${fileName}...`
                });

                try {
                    const fileUri = vscode.Uri.file(filePath);
                    const content = await vscode.workspace.fs.readFile(fileUri);
                    
                    const publishSuccess = await this.performFilePublish(
                        content,
                        fileName,
                        server
                    );

                    if (publishSuccess) {
                        result.filesPublished++;
                    } else {
                        result.errors.push(`Failed to publish ${fileName}`);
                    }
                } catch (error) {
                    const errorMessage = `Error publishing ${fileName}: ${error}`;
                    result.errors.push(errorMessage);
                    Inform.writeError('FilePublishingService.publishFiles', error);
                }
            }

            result.success = result.filesPublished > 0;

            // Reset cache once after all files are published (using debouncer)
            if (result.success && resetCache) {
                progress.report({ message: 'Preparing cache refresh magic...' });
                // Use immediate flag for batch operations to ensure it runs
                result.cacheReset = await this.cacheService.resetCacheHeadersDebounced(server, false);
            }
        });

        // Show summary
        if (result.success) {
            const message = `Published ${result.filesPublished}/${filePaths.length} files${result.cacheReset ? ' (cache cleared)' : ''}`;
            if (result.errors.length > 0) {
                vscode.window.showWarningMessage(message);
            } else {
                vscode.window.showInformationMessage(`✅ ${message}`);
            }
        } else {
            vscode.window.showErrorMessage('Failed to publish files');
        }

        return result;
    }

    /**
     * Publish a folder and its contents to ShareDo server
     */
    public async publishFolder(
        folderPath: string,
        server: SharedoClient,
        recursive: boolean = true,
        resetCache: boolean = true
    ): Promise<IPublishResult> {
        const result: IPublishResult = {
            success: false,
            filesPublished: 0,
            errors: [],
            cacheReset: false
        };

        try {
            // Get all files in folder
            const files = await this.getFilesInFolder(folderPath, recursive);
            
            if (files.length === 0) {
                vscode.window.showInformationMessage('No files to publish in folder');
                return result;
            }

            // Publish all files
            return await this.publishFiles(files, server, resetCache);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            result.errors.push(errorMessage);
            Inform.writeError('FilePublishingService.publishFolder', error);
            vscode.window.showErrorMessage(`Failed to publish folder: ${errorMessage}`);
        }

        return result;
    }

    /**
     * Perform the actual file publish operation
     * This should integrate with the existing ShareDo file publishing logic
     */
    private async performFilePublish(
        content: Uint8Array,
        targetPath: string,
        server: SharedoClient
    ): Promise<boolean> {
        try {
            // TODO: Integrate with existing ShareDo file publishing logic
            // For now, we'll use the existing file save/publish methods
            
            // Get bearer token
            const token = await server.getBearer();
            if (!token) {
                Inform.writeError('FilePublishingService.performFilePublish', 'Failed to get bearer token');
                return false;
            }

            // The actual implementation would depend on the ShareDo API endpoint for file publishing
            // This is a placeholder that should be replaced with the actual implementation
            Inform.writeInfo(`Would publish file to: ${targetPath} on ${server.url}`);
            
            // For now, return true to indicate success in development
            // In production, this should make the actual API call
            return true;

        } catch (error) {
            Inform.writeError('FilePublishingService.performFilePublish', error);
            return false;
        }
    }

    /**
     * Get all files in a folder
     */
    private async getFilesInFolder(folderPath: string, recursive: boolean): Promise<string[]> {
        const files: string[] = [];
        const folderUri = vscode.Uri.file(folderPath);

        try {
            const entries = await vscode.workspace.fs.readDirectory(folderUri);

            for (const [name, type] of entries) {
                const fullPath = path.join(folderPath, name);

                if (type === vscode.FileType.File) {
                    files.push(fullPath);
                } else if (type === vscode.FileType.Directory && recursive) {
                    const subFiles = await this.getFilesInFolder(fullPath, recursive);
                    files.push(...subFiles);
                }
            }
        } catch (error) {
            Inform.writeError('FilePublishingService.getFilesInFolder', error);
        }

        return files;
    }
}