/**
 * User interface operations abstraction
 */
export interface IUserInterface {
    /**
     * Show a message to the user
     */
    showMessage(message: string, type?: MessageType): Promise<void>;
    /**
     * Show an error message
     */
    showError(message: string, error?: Error): Promise<void>;
    /**
     * Show a warning message
     */
    showWarning(message: string): Promise<void>;
    /**
     * Show an information message
     */
    showInfo(message: string): Promise<void>;
    /**
     * Show a progress indicator
     */
    showProgress(title: string): IProgressReporter;
    /**
     * Prompt for user input
     */
    prompt(message: string, options?: IPromptOptions): Promise<string | undefined>;
    /**
     * Prompt for password
     */
    promptPassword(message: string): Promise<string | undefined>;
    /**
     * Show a yes/no confirmation
     */
    confirm(message: string): Promise<boolean>;
    /**
     * Select a file
     */
    selectFile(options?: IFileSelectOptions): Promise<string | undefined>;
    /**
     * Select multiple files
     */
    selectFiles(options?: IFileSelectOptions): Promise<string[] | undefined>;
    /**
     * Select a folder
     */
    selectFolder(options?: IFolderSelectOptions): Promise<string | undefined>;
    /**
     * Show a quick pick list
     */
    showQuickPick<T extends IQuickPickItem>(items: T[], options?: IQuickPickOptions): Promise<T | undefined>;
    /**
     * Show a multi-select quick pick
     */
    showMultiQuickPick<T extends IQuickPickItem>(items: T[], options?: IQuickPickOptions): Promise<T[] | undefined>;
    /**
     * Open an external URL
     */
    openExternal(url: string): Promise<void>;
    /**
     * Show output in a channel/console
     */
    showOutput(text: string, channel?: string): void;
    /**
     * Clear output channel/console
     */
    clearOutput(channel?: string): void;
}
export interface IProgressReporter {
    /**
     * Report progress update
     */
    report(progress: IProgressUpdate): void;
    /**
     * Mark as complete
     */
    complete(): void;
    /**
     * Mark as failed with error
     */
    error(error: Error): void;
    /**
     * Check if cancelled
     */
    readonly isCancelled: boolean;
    /**
     * Cancel the operation
     */
    cancel(): void;
}
export interface IProgressUpdate {
    message?: string;
    increment?: number;
    percentage?: number;
}
export interface IPromptOptions {
    defaultValue?: string;
    placeHolder?: string;
    validateInput?: (value: string) => string | undefined;
    ignoreFocusOut?: boolean;
}
export interface IFileSelectOptions {
    title?: string;
    defaultUri?: string;
    filters?: Record<string, string[]>;
    canSelectMany?: boolean;
}
export interface IFolderSelectOptions {
    title?: string;
    defaultUri?: string;
    canSelectMany?: boolean;
}
export interface IQuickPickItem {
    label: string;
    description?: string;
    detail?: string;
    picked?: boolean;
    alwaysShow?: boolean;
}
export interface IQuickPickOptions {
    title?: string;
    placeHolder?: string;
    canPickMany?: boolean;
    ignoreFocusOut?: boolean;
    matchOnDescription?: boolean;
    matchOnDetail?: boolean;
}
export declare enum MessageType {
    Info = "info",
    Warning = "warning",
    Error = "error",
    Success = "success"
}
