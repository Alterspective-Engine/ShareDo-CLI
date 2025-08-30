import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Inform } from '../Utilities/inform';

/**
 * Interface for TODO item information
 */
export interface TodoItem {
    /** File path where the TODO was found */
    filePath: string;
    /** Line number (1-based) */
    lineNumber: number;
    /** The TODO text content */
    content: string;
    /** TODO priority (extracted from content) */
    priority: 'low' | 'medium' | 'high' | 'critical';
    /** TODO category/type */
    category: string;
    /** Estimated effort */
    effort?: 'low' | 'medium' | 'high';
    /** Assigned owner/team */
    owner?: string;
    /** Whether this TODO is completed */
    completed: boolean;
    /** Creation/modification date if available */
    date?: Date;
}

/**
 * Interface for code cleanup recommendations
 */
export interface CleanupRecommendation {
    /** Type of cleanup needed */
    type: 'remove_commented_code' | 'remove_obsolete_file' | 'consolidate_duplicate' | 'update_todo';
    /** File path affected */
    filePath: string;
    /** Description of the recommendation */
    description: string;
    /** Priority level */
    priority: 'low' | 'medium' | 'high';
    /** Estimated impact */
    impact: string;
    /** Line numbers affected (if applicable) */
    lineNumbers?: number[];
    /** Suggested action */
    suggestedAction: string;
}

/**
 * Utility class for managing technical debt, TODO items, and code cleanup
 */
export class CodeCleanupManager {
    private workspaceRoot: string;
    private todoItems: TodoItem[] = [];
    private cleanupRecommendations: CleanupRecommendation[] = [];

    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
    }

    /**
     * Scan the workspace for TODO items and technical debt
     */
    public async scanWorkspace(): Promise<void> {
        try {
            Inform.writeInfo('CodeCleanupManager::scanWorkspace', 'Starting workspace scan for technical debt');

            // Clear previous results
            this.todoItems = [];
            this.cleanupRecommendations = [];

            // Scan for TODO items
            await this.scanForTodoItems();

            // Scan for obsolete files
            await this.scanForObsoleteFiles();

            // Scan for commented code
            await this.scanForCommentedCode();

            // Scan for duplicate code patterns
            await this.scanForDuplicateCode();

            Inform.writeInfo('CodeCleanupManager::scanWorkspace', 
                `Scan complete. Found ${this.todoItems.length} TODO items and ${this.cleanupRecommendations.length} cleanup recommendations`);

        } catch (error) {
            Inform.writeError('CodeCleanupManager::scanWorkspace', 'Error scanning workspace', error);
            throw error;
        }
    }

    /**
     * Get all TODO items
     */
    public getTodoItems(): TodoItem[] {
        return [...this.todoItems];
    }

    /**
     * Get TODO items by priority
     */
    public getTodoItemsByPriority(priority: 'low' | 'medium' | 'high' | 'critical'): TodoItem[] {
        return this.todoItems.filter(item => item.priority === priority);
    }

    /**
     * Get cleanup recommendations
     */
    public getCleanupRecommendations(): CleanupRecommendation[] {
        return [...this.cleanupRecommendations];
    }

    /**
     * Get high-priority cleanup recommendations
     */
    public getHighPriorityRecommendations(): CleanupRecommendation[] {
        return this.cleanupRecommendations.filter(rec => rec.priority === 'high');
    }

    /**
     * Generate a comprehensive technical debt report
     */
    public generateTechnicalDebtReport(): string {
        const todoStats = this.generateTodoStatistics();
        const cleanupStats = this.generateCleanupStatistics();

        const report = [
            '=== ShareDo VS Code Extension - Technical Debt Report ===',
            `Generated: ${new Date().toISOString()}`,
            `Workspace: ${this.workspaceRoot}`,
            '',
            '=== TODO Items Summary ===',
            `Total TODO items: ${this.todoItems.length}`,
            `High priority: ${todoStats.highPriority}`,
            `Medium priority: ${todoStats.mediumPriority}`,
            `Low priority: ${todoStats.lowPriority}`,
            `Completed: ${todoStats.completed}`,
            '',
            '=== Cleanup Recommendations Summary ===',
            `Total recommendations: ${this.cleanupRecommendations.length}`,
            `High priority: ${cleanupStats.highPriority}`,
            `Medium priority: ${cleanupStats.mediumPriority}`,
            `Low priority: ${cleanupStats.lowPriority}`,
            '',
            '=== High Priority TODO Items ===',
            ...this.getTodoItemsByPriority('high').map(todo => 
                `- ${path.relative(this.workspaceRoot, todo.filePath)}:${todo.lineNumber} - ${todo.content}`
            ),
            '',
            '=== High Priority Cleanup Items ===',
            ...this.getHighPriorityRecommendations().map(rec => 
                `- ${rec.type}: ${rec.description} (${path.relative(this.workspaceRoot, rec.filePath)})`
            ),
            '',
            '=== Recommendations for Next Sprint ===',
            ...this.generateSprintRecommendations()
        ];

        return report.join('\n');
    }

    /**
     * Create VS Code tasks for cleanup activities
     */
    public async createCleanupTasks(): Promise<void> {
        try {
            const tasks = this.generateCleanupTasks();
            const tasksJsonPath = path.join(this.workspaceRoot, '.vscode', 'tasks.json');

            // Read existing tasks.json or create new one
            let existingTasks: any = { version: '2.0.0', tasks: [] };
            
            if (fs.existsSync(tasksJsonPath)) {
                const content = fs.readFileSync(tasksJsonPath, 'utf8');
                existingTasks = JSON.parse(content);
            }

            // Add cleanup tasks
            existingTasks.tasks = existingTasks.tasks || [];
            existingTasks.tasks.push(...tasks);

            // Ensure .vscode directory exists
            const vscodeDirPath = path.dirname(tasksJsonPath);
            if (!fs.existsSync(vscodeDirPath)) {
                fs.mkdirSync(vscodeDirPath, { recursive: true });
            }

            // Write updated tasks.json
            fs.writeFileSync(tasksJsonPath, JSON.stringify(existingTasks, null, 2));

            Inform.writeInfo('CodeCleanupManager::createCleanupTasks', 
                `Created ${tasks.length} cleanup tasks in .vscode/tasks.json`);

        } catch (error) {
            Inform.writeError('CodeCleanupManager::createCleanupTasks', 'Error creating cleanup tasks', error);
            throw error;
        }
    }

    /**
     * Show interactive cleanup recommendations in VS Code
     */
    public async showInteractiveCleanup(): Promise<void> {
        try {
            const recommendations = this.getCleanupRecommendations();
            
            if (recommendations.length === 0) {
                vscode.window.showInformationMessage('No cleanup recommendations found!');
                return;
            }

            const items = recommendations.map(rec => ({
                label: rec.description,
                detail: `${rec.type} - ${rec.priority} priority`,
                description: path.relative(this.workspaceRoot, rec.filePath),
                recommendation: rec
            }));

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select cleanup recommendations to implement',
                canPickMany: true,
                ignoreFocusOut: true
            });

            if (selected && selected.length > 0) {
                for (const item of selected) {
                    await this.implementRecommendation(item.recommendation);
                }

                vscode.window.showInformationMessage(
                    `Implemented ${selected.length} cleanup recommendations`
                );
            }

        } catch (error) {
            Inform.writeError('CodeCleanupManager::showInteractiveCleanup', 'Error showing interactive cleanup', error);
            vscode.window.showErrorMessage(`Cleanup failed: ${(error as Error).message}`);
        }
    }

    /**
     * Scan for TODO items in source files
     */
    private async scanForTodoItems(): Promise<void> {
        const filePatterns = ['**/*.ts', '**/*.js', '**/*.json', '**/*.md'];
        const excludePatterns = ['**/node_modules/**', '**/out/**', '**/.vscode-test/**'];

        for (const pattern of filePatterns) {
            const files = await vscode.workspace.findFiles(pattern, `{${excludePatterns.join(',')}}`);
            
            for (const file of files) {
                await this.scanFileForTodos(file.fsPath);
            }
        }
    }

    /**
     * Scan a single file for TODO items
     */
    private async scanFileForTodos(filePath: string): Promise<void> {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');

            lines.forEach((line, index) => {
                const todoMatch = line.match(/(TODO|FIXME|NOTE|BUG):\s*(.+)/i);
                if (todoMatch) {
                    const todo: TodoItem = {
                        filePath,
                        lineNumber: index + 1,
                        content: todoMatch[2].trim(),
                        priority: this.extractPriority(line),
                        category: this.extractCategory(line),
                        effort: this.extractEffort(line),
                        owner: this.extractOwner(line),
                        completed: line.includes('✅') || line.includes('[DONE]'),
                        date: this.extractDate(line)
                    };

                    this.todoItems.push(todo);
                }
            });

        } catch (error) {
            Inform.writeDebug('CodeCleanupManager::scanFileForTodos', 
                `Error scanning file ${filePath}`, error);
        }
    }

    /**
     * Scan for obsolete files (backup files, temp files, etc.)
     */
    private async scanForObsoleteFiles(): Promise<void> {
        const obsoletePatterns = [
            '**/*.bk_*',
            '**/*.backup',
            '**/*.tmp',
            '**/*copy*',
            '**/temp_*',
            '**/.DS_Store'
        ];

        for (const pattern of obsoletePatterns) {
            const files = await vscode.workspace.findFiles(pattern);
            
            for (const file of files) {
                this.cleanupRecommendations.push({
                    type: 'remove_obsolete_file',
                    filePath: file.fsPath,
                    description: `Remove obsolete file: ${path.basename(file.fsPath)}`,
                    priority: 'medium',
                    impact: 'Reduces repository size and confusion',
                    suggestedAction: `Delete file ${path.basename(file.fsPath)}`
                });
            }
        }
    }

    /**
     * Scan for large blocks of commented code
     */
    private async scanForCommentedCode(): Promise<void> {
        const files = await vscode.workspace.findFiles('**/*.ts', '**/node_modules/**');
        
        for (const file of files) {
            await this.scanFileForCommentedCode(file.fsPath);
        }
    }

    /**
     * Scan a file for commented code blocks
     */
    private async scanFileForCommentedCode(filePath: string): Promise<void> {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');

            let commentBlockStart = -1;
            let commentBlockSize = 0;

            lines.forEach((line, index) => {
                const trimmed = line.trim();
                
                if (trimmed.startsWith('//') && !trimmed.startsWith('///')) {
                    if (commentBlockStart === -1) {
                        commentBlockStart = index;
                        commentBlockSize = 1;
                    } else {
                        commentBlockSize++;
                    }
                } else {
                    if (commentBlockStart !== -1 && commentBlockSize >= 5) {
                        // Found a large comment block
                        this.cleanupRecommendations.push({
                            type: 'remove_commented_code',
                            filePath,
                            description: `Large commented code block (${commentBlockSize} lines)`,
                            priority: 'low',
                            impact: 'Improves code readability',
                            lineNumbers: Array.from({length: commentBlockSize}, (_, i) => commentBlockStart + i + 1),
                            suggestedAction: `Review and remove commented code block at lines ${commentBlockStart + 1}-${commentBlockStart + commentBlockSize}`
                        });
                    }
                    commentBlockStart = -1;
                    commentBlockSize = 0;
                }
            });

        } catch (error) {
            Inform.writeDebug('CodeCleanupManager::scanFileForCommentedCode', 
                `Error scanning file ${filePath}`, error);
        }
    }

    /**
     * Scan for duplicate code patterns
     */
    private async scanForDuplicateCode(): Promise<void> {
        // This is a simplified implementation
        // In a real scenario, you might use more sophisticated duplicate detection
        
        const files = await vscode.workspace.findFiles('**/*.ts', '**/node_modules/**');
        const functionSignatures = new Map<string, string[]>();

        for (const file of files) {
            const signatures = this.extractFunctionSignatures(file.fsPath);
            signatures.forEach(sig => {
                if (!functionSignatures.has(sig)) {
                    functionSignatures.set(sig, []);
                }
                functionSignatures.get(sig)!.push(file.fsPath);
            });
        }

        // Find duplicates
        functionSignatures.forEach((files, signature) => {
            if (files.length > 1) {
                this.cleanupRecommendations.push({
                    type: 'consolidate_duplicate',
                    filePath: files[0],
                    description: `Duplicate function signature found in ${files.length} files`,
                    priority: 'low',
                    impact: 'Reduces code duplication and maintenance burden',
                    suggestedAction: `Consider consolidating duplicate function: ${signature}`
                });
            }
        });
    }

    /**
     * Extract function signatures from a file (simplified)
     */
    private extractFunctionSignatures(filePath: string): string[] {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const functionRegex = /(?:function\s+|const\s+\w+\s*=\s*(?:async\s+)?(?:function\s*)?\(|\w+\s*\([^)]*\)\s*[:{])/g;
            const matches = content.match(functionRegex) || [];
            
            return matches.map(match => 
                match.replace(/\s+/g, ' ').trim()
            );

        } catch (error) {
            return [];
        }
    }

    /**
     * Extract priority from TODO line
     */
    private extractPriority(line: string): 'low' | 'medium' | 'high' | 'critical' {
        const lowPriority = /(low|minor|someday)/i;
        const highPriority = /(high|important|urgent|critical)/i;
        
        if (highPriority.test(line)) {
            return 'high';
        }
        if (lowPriority.test(line)) {
            return 'low';
        }
        return 'medium';
    }

    /**
     * Extract category from TODO line
     */
    private extractCategory(line: string): string {
        const categories = [
            'security', 'performance', 'ui', 'api', 'testing', 
            'documentation', 'refactor', 'bug', 'feature'
        ];
        
        for (const category of categories) {
            if (line.toLowerCase().includes(category)) {
                return category;
            }
        }
        
        return 'general';
    }

    /**
     * Extract effort estimate from TODO line
     */
    private extractEffort(line: string): 'low' | 'medium' | 'high' | undefined {
        if (/effort:\s*low|small|quick/i.test(line)) {
            return 'low';
        }
        if (/effort:\s*high|large|complex/i.test(line)) {
            return 'high';
        }
        if (/effort:\s*medium|moderate/i.test(line)) {
            return 'medium';
        }
        return undefined;
    }

    /**
     * Extract owner from TODO line
     */
    private extractOwner(line: string): string | undefined {
        const ownerMatch = line.match(/owner:\s*(\w+)/i);
        return ownerMatch ? ownerMatch[1] : undefined;
    }

    /**
     * Extract date from TODO line
     */
    private extractDate(line: string): Date | undefined {
        const dateMatch = line.match(/(\d{4}-\d{2}-\d{2})/);
        return dateMatch ? new Date(dateMatch[1]) : undefined;
    }

    /**
     * Generate TODO statistics
     */
    private generateTodoStatistics() {
        return {
            total: this.todoItems.length,
            highPriority: this.todoItems.filter(t => t.priority === 'high').length,
            mediumPriority: this.todoItems.filter(t => t.priority === 'medium').length,
            lowPriority: this.todoItems.filter(t => t.priority === 'low').length,
            completed: this.todoItems.filter(t => t.completed).length
        };
    }

    /**
     * Generate cleanup statistics
     */
    private generateCleanupStatistics() {
        return {
            total: this.cleanupRecommendations.length,
            highPriority: this.cleanupRecommendations.filter(r => r.priority === 'high').length,
            mediumPriority: this.cleanupRecommendations.filter(r => r.priority === 'medium').length,
            lowPriority: this.cleanupRecommendations.filter(r => r.priority === 'low').length
        };
    }

    /**
     * Generate sprint recommendations
     */
    private generateSprintRecommendations(): string[] {
        const recommendations: string[] = [];
        
        const highPriorityTodos = this.getTodoItemsByPriority('high');
        const highPriorityCleanup = this.getHighPriorityRecommendations();

        if (highPriorityTodos.length > 0) {
            recommendations.push(`1. Address ${highPriorityTodos.length} high-priority TODO items`);
        }

        if (highPriorityCleanup.length > 0) {
            recommendations.push(`2. Implement ${highPriorityCleanup.length} high-priority cleanup recommendations`);
        }

        const obsoleteFiles = this.cleanupRecommendations.filter(r => r.type === 'remove_obsolete_file');
        if (obsoleteFiles.length > 0) {
            recommendations.push(`3. Remove ${obsoleteFiles.length} obsolete files`);
        }

        return recommendations;
    }

    /**
     * Generate VS Code tasks for cleanup
     */
    private generateCleanupTasks(): any[] {
        const tasks: any[] = [];

        // Task to run technical debt scan
        tasks.push({
            label: 'ShareDo: Scan Technical Debt',
            type: 'shell',
            command: 'echo',
            args: ['Technical debt scan completed. Check output panel for results.'],
            group: 'build',
            problemMatcher: []
        });

        // Task to generate technical debt report
        tasks.push({
            label: 'ShareDo: Generate Technical Debt Report',
            type: 'shell',
            command: 'echo',
            args: ['Technical debt report generated.'],
            group: 'build',
            problemMatcher: []
        });

        return tasks;
    }

    /**
     * Implement a cleanup recommendation
     */
    private async implementRecommendation(recommendation: CleanupRecommendation): Promise<void> {
        try {
            switch (recommendation.type) {
                case 'remove_obsolete_file':
                    if (fs.existsSync(recommendation.filePath)) {
                        fs.unlinkSync(recommendation.filePath);
                        Inform.writeInfo('CodeCleanupManager::implementRecommendation', 
                            `Removed obsolete file: ${recommendation.filePath}`);
                    }
                    break;

                case 'remove_commented_code':
                    // This would require more sophisticated implementation
                    Inform.writeInfo('CodeCleanupManager::implementRecommendation', 
                        `Commented code removal not yet implemented for: ${recommendation.filePath}`);
                    break;

                default:
                    Inform.writeInfo('CodeCleanupManager::implementRecommendation', 
                        `Recommendation type '${recommendation.type}' not yet implemented`);
            }

        } catch (error) {
            Inform.writeError('CodeCleanupManager::implementRecommendation', 
                'Error implementing recommendation', error);
            throw error;
        }
    }
}
