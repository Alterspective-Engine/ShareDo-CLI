export interface IStorage {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  
  getWorkspace<T>(key: string): Promise<T | undefined>;
  setWorkspace<T>(key: string, value: T): Promise<void>;
}
