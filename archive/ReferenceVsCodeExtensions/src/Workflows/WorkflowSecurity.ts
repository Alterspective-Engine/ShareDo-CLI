/**
 * Workflow Security Utilities
 * 
 * Security validation and sanitization for workflow operations
 */

export class WorkflowSecurity {
    /**
     * Validate workflow system name to prevent security issues
     */
    static validateSystemName(systemName: string): { valid: boolean; error?: string } {
        // Check for empty
        if (!systemName || systemName.trim().length === 0) {
            return { valid: false, error: 'System name cannot be empty' };
        }

        // Check length
        if (systemName.length > 100) {
            return { valid: false, error: 'System name too long (max 100 characters)' };
        }

        // Check for path traversal attempts
        if (systemName.includes('..') || systemName.includes('/') || systemName.includes('\\')) {
            return { valid: false, error: 'System name contains invalid characters' };
        }

        // Check for special characters that could cause issues
        const invalidChars = ['<', '>', ':', '"', '|', '?', '*', '\0'];
        for (const char of invalidChars) {
            if (systemName.includes(char)) {
                return { valid: false, error: `System name contains invalid character: ${char}` };
            }
        }

        // Check for reserved names (Windows)
        const reserved = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 
                         'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 
                         'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
        
        if (reserved.includes(systemName.toUpperCase())) {
            return { valid: false, error: 'System name is a reserved word' };
        }

        // Check for valid pattern (alphanumeric, hyphens, underscores)
        if (!/^[a-zA-Z0-9\-_]+$/.test(systemName)) {
            return { valid: false, error: 'System name must contain only letters, numbers, hyphens, and underscores' };
        }

        return { valid: true };
    }

    /**
     * Sanitize workflow name for display
     */
    static sanitizeName(name: string): string {
        // Remove any HTML tags
        let sanitized = name.replace(/<[^>]*>/g, '');
        
        // Escape special HTML characters
        const escapeMap: { [key: string]: string } = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '/': '&#x2F;'
        };
        
        sanitized = sanitized.replace(/[&<>"'\/]/g, char => escapeMap[char]);
        
        // Limit length
        if (sanitized.length > 200) {
            sanitized = sanitized.substring(0, 197) + '...';
        }
        
        return sanitized;
    }

    /**
     * Validate workflow size to prevent resource exhaustion
     */
    static validateWorkflowSize(workflow: any): { valid: boolean; error?: string } {
        const jsonString = JSON.stringify(workflow);
        const sizeInBytes = Buffer.byteLength(jsonString, 'utf8');
        const maxSizeInMB = 10;
        const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

        if (sizeInBytes > maxSizeInBytes) {
            return { 
                valid: false, 
                error: `Workflow too large (${(sizeInBytes / 1024 / 1024).toFixed(2)}MB, max ${maxSizeInMB}MB)` 
            };
        }

        // Check number of steps
        if (workflow.steps && workflow.steps.length > 1000) {
            return { valid: false, error: 'Too many steps (max 1000)' };
        }

        // Check number of variables
        if (workflow.variables && workflow.variables.length > 500) {
            return { valid: false, error: 'Too many variables (max 500)' };
        }

        return { valid: true };
    }

    /**
     * Validate file path to prevent directory traversal
     */
    static validateFilePath(filePath: string, allowedDirectory: string): boolean {
        const path = require('path');
        
        // Resolve to absolute paths
        const resolvedPath = path.resolve(filePath);
        const resolvedAllowed = path.resolve(allowedDirectory);
        
        // Check if the resolved path starts with the allowed directory
        return resolvedPath.startsWith(resolvedAllowed);
    }

    /**
     * Sanitize JSON content before parsing
     */
    static safeJsonParse(content: string): { success: boolean; data?: any; error?: string } {
        try {
            // Remove BOM if present
            if (content.charCodeAt(0) === 0xFEFF) {
                content = content.slice(1);
            }
            
            // Basic size check
            if (content.length > 10 * 1024 * 1024) { // 10MB limit
                return { success: false, error: 'JSON content too large' };
            }
            
            const parsed = JSON.parse(content);
            return { success: true, data: parsed };
        } catch (error) {
            return { 
                success: false, 
                error: error instanceof Error ? error.message : 'Invalid JSON'
            };
        }
    }

    /**
     * Create safe file name from workflow system name
     */
    static createSafeFileName(systemName: string): string {
        // Replace unsafe characters with hyphen
        let safeName = systemName.replace(/[^a-zA-Z0-9\-_]/g, '-');
        
        // Remove multiple consecutive hyphens
        safeName = safeName.replace(/-+/g, '-');
        
        // Remove leading/trailing hyphens
        safeName = safeName.replace(/^-+|-+$/g, '');
        
        // Ensure not empty
        if (!safeName) {
            safeName = 'workflow';
        }
        
        // Limit length (leave room for extension)
        if (safeName.length > 100) {
            safeName = safeName.substring(0, 100);
        }
        
        return safeName;
    }

    /**
     * Check if workflow contains potentially dangerous actions
     */
    static checkDangerousActions(workflow: any): string[] {
        const warnings: string[] = [];
        
        if (!workflow.steps) {
            return warnings;
        }
        
        for (const step of workflow.steps) {
            if (!step.actions) continue;
            
            for (const action of step.actions) {
                // Check for script execution
                if (action.actionSystemName === 'runScript' || 
                    action.actionSystemName === 'executeScript') {
                    warnings.push(`Step "${step.name}" contains script execution action`);
                }
                
                // Check for external API calls
                if (action.actionSystemName === 'callApi' || 
                    action.actionSystemName === 'httpRequest') {
                    warnings.push(`Step "${step.name}" makes external API calls`);
                }
                
                // Check for file system operations
                if (action.actionSystemName === 'writeFile' || 
                    action.actionSystemName === 'deleteFile') {
                    warnings.push(`Step "${step.name}" performs file system operations`);
                }
                
                // Check for database operations
                if (action.actionSystemName === 'executeSql' || 
                    action.actionSystemName === 'runQuery') {
                    warnings.push(`Step "${step.name}" executes database queries`);
                }
            }
        }
        
        return warnings;
    }
}