/**
 * Process execution abstraction
 */
/// <reference types="node" />
export interface IProcessManager {
    /**
     * Execute a command
     */
    exec(command: string, options?: IExecOptions): Promise<IExecResult>;
    /**
     * Spawn a new process
     */
    spawn(command: string, args?: string[], options?: ISpawnOptions): IProcess;
    /**
     * Execute a shell command
     */
    shell(command: string, options?: IShellOptions): Promise<IExecResult>;
    /**
     * Open a file or URL with the default application
     */
    open(target: string): Promise<void>;
    /**
     * Get environment variables
     */
    getEnv(): Record<string, string>;
    /**
     * Get a specific environment variable
     */
    getEnvVar(name: string): string | undefined;
    /**
     * Set environment variable for child processes
     */
    setEnvVar(name: string, value: string): void;
    /**
     * Get current platform
     */
    getPlatform(): NodePlatform;
    /**
     * Check if a command exists
     */
    commandExists(command: string): Promise<boolean>;
    /**
     * Kill a process by PID
     */
    kill(pid: number, signal?: string): boolean;
}
export interface IProcess {
    /**
     * Process ID
     */
    readonly pid: number | undefined;
    /**
     * Standard input stream
     */
    readonly stdin: IWritableStream | null;
    /**
     * Standard output stream
     */
    readonly stdout: IReadableStream | null;
    /**
     * Standard error stream
     */
    readonly stderr: IReadableStream | null;
    /**
     * Exit code
     */
    readonly exitCode: number | null;
    /**
     * Check if process is running
     */
    readonly isRunning: boolean;
    /**
     * Kill the process
     */
    kill(signal?: string): boolean;
    /**
     * Wait for process to exit
     */
    wait(): Promise<number>;
    /**
     * Event handlers
     */
    on(event: 'exit', listener: (code: number | null, signal: string | null) => void): void;
    on(event: 'error', listener: (error: Error) => void): void;
    on(event: 'stdout', listener: (data: string) => void): void;
    on(event: 'stderr', listener: (data: string) => void): void;
}
export interface IExecOptions {
    cwd?: string;
    env?: Record<string, string>;
    timeout?: number;
    maxBuffer?: number;
    encoding?: BufferEncoding;
    shell?: boolean | string;
}
export interface ISpawnOptions {
    cwd?: string;
    env?: Record<string, string>;
    shell?: boolean | string;
    detached?: boolean;
    stdio?: StdioOption;
}
export interface IShellOptions extends IExecOptions {
    shell?: string;
}
export interface IExecResult {
    stdout: string;
    stderr: string;
    exitCode: number;
}
export interface IReadableStream {
    on(event: 'data', listener: (chunk: Buffer | string) => void): void;
    on(event: 'end', listener: () => void): void;
    on(event: 'error', listener: (error: Error) => void): void;
    pipe(destination: IWritableStream): void;
    read(): Buffer | string | null;
}
export interface IWritableStream {
    write(chunk: Buffer | string): boolean;
    end(): void;
    on(event: 'error', listener: (error: Error) => void): void;
}
export type StdioOption = 'pipe' | 'ignore' | 'inherit';
export type NodePlatform = 'win32' | 'darwin' | 'linux' | 'freebsd' | 'openbsd' | 'sunos' | 'aix';
