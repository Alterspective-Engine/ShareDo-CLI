export interface ILogger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, error?: Error | unknown): void;
  
  setLevel(level: 'debug' | 'info' | 'warn' | 'error'): void;
  getLevel(): string;
}
