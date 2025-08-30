/**
 * Configuration management abstraction
 */
export interface IConfiguration {
    /**
     * Get a configuration value
     */
    get<T>(key: string): T | undefined;
    /**
     * Get a configuration value with default
     */
    getWithDefault<T>(key: string, defaultValue: T): T;
    /**
     * Set a configuration value
     */
    set<T>(key: string, value: T, target?: ConfigurationTarget): Promise<void>;
    /**
     * Check if a configuration key exists
     */
    has(key: string): boolean;
    /**
     * Delete a configuration value
     */
    delete(key: string, target?: ConfigurationTarget): Promise<void>;
    /**
     * Get all configuration keys
     */
    keys(): string[];
    /**
     * Get configuration object for a section
     */
    getSection<T>(section: string): T | undefined;
    /**
     * Update configuration with multiple values
     */
    update(values: Record<string, any>, target?: ConfigurationTarget): Promise<void>;
    /**
     * Watch for configuration changes
     */
    onDidChange(callback: (event: IConfigurationChangeEvent) => void): IDisposable;
    /**
     * Export configuration to JSON
     */
    export(): Record<string, any>;
    /**
     * Import configuration from JSON
     */
    import(config: Record<string, any>, target?: ConfigurationTarget): Promise<void>;
    /**
     * Reset configuration to defaults
     */
    reset(keys?: string[]): Promise<void>;
    /**
     * Validate configuration against schema
     */
    validate(): IConfigurationValidationResult[];
}
export interface IConfigurationChangeEvent {
    /**
     * Keys that changed
     */
    affectedKeys: string[];
    /**
     * Check if a specific key was affected
     */
    affectsConfiguration(key: string): boolean;
}
export interface IConfigurationValidationResult {
    key: string;
    valid: boolean;
    message?: string;
    severity?: ValidationSeverity;
}
export declare enum ConfigurationTarget {
    /**
     * User-specific settings
     */
    User = "user",
    /**
     * Workspace/project settings
     */
    Workspace = "workspace",
    /**
     * Machine-specific settings
     */
    Machine = "machine",
    /**
     * Default/built-in settings
     */
    Default = "default"
}
export declare enum ValidationSeverity {
    Error = "error",
    Warning = "warning",
    Info = "info"
}
export interface IDisposable {
    dispose(): void;
}
