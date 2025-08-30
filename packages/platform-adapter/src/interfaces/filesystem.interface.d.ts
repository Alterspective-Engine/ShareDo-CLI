/**
 * File system operations abstraction
 */
export interface IFileSystem {
    /**
     * Read a text file
     */
    readFile(path: string, encoding?: BufferEncoding): Promise<string>;
    /**
     * Read a binary file
     */
    readBinaryFile(path: string): Promise<Buffer>;
    /**
     * Write a text file
     */
    writeFile(path: string, content: string, encoding?: BufferEncoding): Promise<void>;
    /**
     * Write a binary file
     */
    writeBinaryFile(path: string, content: Buffer): Promise<void>;
    /**
     * Append to a file
     */
    appendFile(path: string, content: string): Promise<void>;
    /**
     * Check if a path exists
     */
    exists(path: string): Promise<boolean>;
    /**
     * Delete a file or directory
     */
    delete(path: string, options?: IDeleteOptions): Promise<void>;
    /**
     * Copy a file or directory
     */
    copy(source: string, destination: string, options?: ICopyOptions): Promise<void>;
    /**
     * Move/rename a file or directory
     */
    move(source: string, destination: string, options?: IMoveOptions): Promise<void>;
    /**
     * Create a directory
     */
    createDirectory(path: string, options?: ICreateDirectoryOptions): Promise<void>;
    /**
     * List directory contents
     */
    listDirectory(path: string, options?: IListOptions): Promise<IFileInfo[]>;
    /**
     * Get file/directory information
     */
    getInfo(path: string): Promise<IFileInfo>;
    /**
     * Watch for file changes
     */
    watch(path: string, callback: (event: IFileChangeEvent) => void): IFileWatcher;
    /**
     * Create a temporary file
     */
    createTempFile(prefix?: string, extension?: string): Promise<string>;
    /**
     * Create a temporary directory
     */
    createTempDirectory(prefix?: string): Promise<string>;
    /**
     * Get the current working directory
     */
    getCurrentDirectory(): string;
    /**
     * Change the current working directory
     */
    setCurrentDirectory(path: string): void;
    /**
     * Resolve a path to absolute
     */
    resolvePath(...paths: string[]): string;
    /**
     * Get the directory name from a path
     */
    dirname(path: string): string;
    /**
     * Get the file name from a path
     */
    basename(path: string, ext?: string): string;
    /**
     * Get the file extension
     */
    extname(path: string): string;
    /**
     * Join path segments
     */
    join(...paths: string[]): string;
}
export interface IFileInfo {
    path: string;
    name: string;
    size: number;
    isFile: boolean;
    isDirectory: boolean;
    isSymbolicLink: boolean;
    createdAt: Date;
    modifiedAt: Date;
    accessedAt: Date;
    permissions?: IFilePermissions;
}
export interface IFilePermissions {
    readable: boolean;
    writable: boolean;
    executable: boolean;
}
export interface IDeleteOptions {
    recursive?: boolean;
    force?: boolean;
}
export interface ICopyOptions {
    overwrite?: boolean;
    recursive?: boolean;
    preserveTimestamps?: boolean;
}
export interface IMoveOptions {
    overwrite?: boolean;
}
export interface ICreateDirectoryOptions {
    recursive?: boolean;
    mode?: number;
}
export interface IListOptions {
    recursive?: boolean;
    includeHidden?: boolean;
    filter?: (info: IFileInfo) => boolean;
    maxDepth?: number;
}
export interface IFileChangeEvent {
    type: FileChangeType;
    path: string;
    oldPath?: string;
}
export declare enum FileChangeType {
    Created = "created",
    Modified = "modified",
    Deleted = "deleted",
    Renamed = "renamed"
}
export interface IFileWatcher {
    /**
     * Stop watching
     */
    dispose(): void;
    /**
     * Check if still active
     */
    readonly isActive: boolean;
}
