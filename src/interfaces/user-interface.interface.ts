export interface IUserInterface {
  showMessage(message: string, type?: 'info' | 'warning' | 'error'): void;
  showProgress(message: string, cancellable?: boolean): IProgress;
  prompt(message: string, defaultValue?: string): Promise<string | undefined>;
  confirm(message: string): Promise<boolean>;
  selectOption<T>(message: string, options: T[], display?: (item: T) => string): Promise<T | undefined>;
  selectFile(options?: any): Promise<string | undefined>;
  selectFolder(options?: any): Promise<string | undefined>;
}

export interface IProgress {
  report(increment: number, message?: string): void;
  complete(): void;
}
