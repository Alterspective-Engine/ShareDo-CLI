/**
 * File Watcher Service - Monitors file changes for ShareDo VS Code Extension
 * 
 * Watches for changes in ShareDo-related files and triggers appropriate actions.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { EventBus } from '../core/EventBus';

export interface WatchPattern {
    pattern: string;
    event: string;
    debounce?: number;
}

export class FileWatcherService {
    private watchers: vscode.FileSystemWatcher[] = [];
    private debounceTimers = new Map<string, NodeJS.Timer>();
    private watchPatterns: WatchPattern[] = [
        {
            pattern: '**/*.sharedo.json',
            event: 'file.sharedo.changed',
            debounce: 1000
        },
        {
            pattern: '**/*.workflow.json',
            event: 'file.workflow.changed',
            debounce: 500
        },
        {
            pattern: '**/sharedo.config.json',
            event: 'file.config.changed',
            debounce: 2000
        },
        {
            pattern: '**/*.form.json',
            event: 'file.form.changed',
            debounce: 500
        }
    ];
    
    constructor(private eventBus: EventBus) {
        this.initialize();
    }
    
    /**
     * Initialize file watchers
     */
    private initialize(): void {
        for (const pattern of this.watchPatterns) {
            this.createWatcher(pattern);
        }
    }
    
    /**
     * Create a file watcher
     */
    private createWatcher(watchPattern: WatchPattern): void {
        const watcher = vscode.workspace.createFileSystemWatcher(watchPattern.pattern);
        
        // Handle file creation
        watcher.onDidCreate((uri) => {
            this.handleFileEvent('created', uri, watchPattern);
        });
        
        // Handle file changes
        watcher.onDidChange((uri) => {
            this.handleFileEvent('changed', uri, watchPattern);
        });
        
        // Handle file deletion
        watcher.onDidDelete((uri) => {
            this.handleFileEvent('deleted', uri, watchPattern);
        });
        
        this.watchers.push(watcher);
    }
    
    /**
     * Handle file event with debouncing
     */
    private handleFileEvent(
        action: 'created' | 'changed' | 'deleted',
        uri: vscode.Uri,
        pattern: WatchPattern
    ): void {
        const key = `${pattern.event}:${uri.fsPath}`;
        
        // Clear existing timer if debouncing
        if (pattern.debounce && this.debounceTimers.has(key)) {
            clearTimeout(this.debounceTimers.get(key)!);
        }
        
        const emitEvent = () => {
            this.eventBus.emit(pattern.event, {
                action,
                uri,
                path: uri.fsPath,
                filename: path.basename(uri.fsPath)
            });
            
            // Also emit generic file event
            this.eventBus.emit('file.changed', {
                action,
                uri,
                type: this.getFileType(uri.fsPath)
            });
            
            this.debounceTimers.delete(key);
        };
        
        if (pattern.debounce) {
            const timer = setTimeout(emitEvent, pattern.debounce);
            this.debounceTimers.set(key, timer);
        } else {
            emitEvent();
        }
    }
    
    /**
     * Add a custom watch pattern
     */
    addWatchPattern(pattern: WatchPattern): void {
        this.watchPatterns.push(pattern);
        this.createWatcher(pattern);
    }
    
    /**
     * Remove a watch pattern
     */
    removeWatchPattern(pattern: string): void {
        const index = this.watchPatterns.findIndex(p => p.pattern === pattern);
        if (index >= 0) {
            this.watchPatterns.splice(index, 1);
            // Note: Watcher disposal would need to be tracked separately
        }
    }
    
    /**
     * Get file type from path
     */
    private getFileType(filePath: string): string {
        const filename = path.basename(filePath);
        
        if (filename.includes('.workflow.')) return 'workflow';
        if (filename.includes('.form.')) return 'form';
        if (filename.includes('.sharedo.')) return 'sharedo';
        if (filename === 'sharedo.config.json') return 'config';
        
        const ext = path.extname(filePath);
        switch (ext) {
            case '.ts':
            case '.js':
                return 'script';
            case '.html':
                return 'html';
            case '.css':
                return 'style';
            case '.json':
                return 'json';
            default:
                return 'unknown';
        }
    }
    
    /**
     * Watch a specific file
     */
    watchFile(filePath: string, callback: (uri: vscode.Uri) => void): vscode.Disposable {
        const watcher = vscode.workspace.createFileSystemWatcher(filePath);
        
        const disposables = [
            watcher.onDidChange(callback),
            watcher.onDidCreate(callback),
            watcher.onDidDelete(callback),
            watcher
        ];
        
        return new vscode.Disposable(() => {
            disposables.forEach(d => d.dispose());
        });
    }
    
    /**
     * Watch a directory
     */
    watchDirectory(dirPath: string, callback: (uri: vscode.Uri) => void): vscode.Disposable {
        const pattern = path.join(dirPath, '**/*');
        const watcher = vscode.workspace.createFileSystemWatcher(pattern);
        
        const disposables = [
            watcher.onDidChange(callback),
            watcher.onDidCreate(callback),
            watcher.onDidDelete(callback),
            watcher
        ];
        
        return new vscode.Disposable(() => {
            disposables.forEach(d => d.dispose());
        });
    }
    
    /**
     * Get watch statistics
     */
    getStatistics(): {
        watcherCount: number;
        patternCount: number;
        pendingEvents: number;
    } {
        return {
            watcherCount: this.watchers.length,
            patternCount: this.watchPatterns.length,
            pendingEvents: this.debounceTimers.size
        };
    }
    
    /**
     * Dispose all watchers
     */
    dispose(): void {
        // Clear all debounce timers
        for (const timer of this.debounceTimers.values()) {
            clearTimeout(timer);
        }
        this.debounceTimers.clear();
        
        // Dispose all watchers
        for (const watcher of this.watchers) {
            watcher.dispose();
        }
        this.watchers = [];
    }
}