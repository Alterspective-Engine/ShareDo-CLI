import { TreeNode } from '../../treeprovider';
import { ElementTypes } from '../../enums';

export interface ITreeProvider {
    getChildren(element?: TreeNode): Promise<TreeNode[]>;
    refresh(): void;
    canHandle(elementType: ElementTypes): boolean;
    preload?(): Promise<void>;
}

export interface ITreeDataService {
    fetchData<T>(key: string, fetcher: () => Promise<T>): Promise<T>;
    invalidateCache(pattern: string): void;
    preloadData(keys: string[]): Promise<void>;
    getCacheStats(): CacheStats;
}

export interface ILazyTreeNode {
    loadChildren(): Promise<TreeNode[]>;
    isLoaded: boolean;
    loadingPromise?: Promise<TreeNode[]>;
}

export interface CacheStats {
    hits: number;
    misses: number;
    size: number;
    lastCleanup: Date;
}
