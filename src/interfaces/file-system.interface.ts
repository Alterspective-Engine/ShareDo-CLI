export interface IFileSystem {
  // Read operations
  readFile(path: string): Promise<string>;
  readFileSync(path: string): string;
  exists(path: string): Promise<boolean>;
  existsSync(path: string): boolean;
  
  // Write operations
  writeFile(path: string, content: string): Promise<void>;
  writeFileSync(path: string, content: string): void;
  createDirectory(path: string): Promise<void>;
  
  // Directory operations
  listFiles(directory: string, pattern?: string): Promise<string[]>;
  
  // Path operations
  join(...paths: string[]): string;
  resolve(path: string): string;
  relative(from: string, to: string): string;
  dirname(path: string): string;
  basename(path: string): string;
}
