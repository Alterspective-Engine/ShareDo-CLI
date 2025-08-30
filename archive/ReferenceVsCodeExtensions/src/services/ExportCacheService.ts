/**
 * Export Cache Service
 * 
 * Manages caching of exported work type data to improve performance
 * and reduce API calls for frequently generated HLDs
 */

import * as vscode from 'vscode';
import { IExportedData } from './PackageExportService';
import { Inform } from '../Utilities/inform';
import * as crypto from 'crypto';
import { SecureTokenManager } from './SecureTokenManager';

export interface ICacheEntry {
    key: string;
    workTypeSystemName: string;
    workTypeName: string;
    data: IExportedData;
    timestamp: Date;
    size: number;
    accessCount: number;
    lastAccessed: Date;
    exportMethod: 'package-export' | 'individual-apis';
    serverUrl: string;
}

export interface ICacheStats {
    totalEntries: number;
    totalSize: number;
    hitRate: number;
    mostAccessed: string[];
    oldestEntry: Date | null;
    newestEntry: Date | null;
}

export class ExportCacheService {
    private static instance: ExportCacheService;
    private cache: Map<string, ICacheEntry> = new Map();
    private maxCacheSize: number = 50 * 1024 * 1024; // 50MB default
    private maxCacheAge: number = 3600000; // 1 hour default
    private cacheHits: number = 0;
    private cacheMisses: number = 0;
    private context: vscode.ExtensionContext | null = null;
    
    private constructor() {
        this.loadSettings();
    }
    
    public static getInstance(): ExportCacheService {
        if (!ExportCacheService.instance) {
            ExportCacheService.instance = new ExportCacheService();
        }
        return ExportCacheService.instance;
    }
    
    /**
     * Initialize cache with extension context for persistence
     */
    public initialize(context: vscode.ExtensionContext): void {
        this.context = context;
        this.loadPersistedCache();
        
        // Set up cache cleanup interval
        setInterval(() => this.cleanupCache(), 300000); // Clean every 5 minutes
    }
    
    /**
     * Load cache settings from VS Code configuration
     */
    private loadSettings(): void {
        const config = vscode.workspace.getConfiguration('sharedo.hld');
        this.maxCacheSize = config.get('cacheSize', 50) * 1024 * 1024;
        this.maxCacheAge = config.get('cacheAge', 60) * 60000; // Convert minutes to ms
    }
    
    /**
     * Generate cache key for work type
     */
    private generateCacheKey(
        workTypeSystemName: string,
        serverUrl: string
    ): string {
        const hash = crypto.createHash('sha256');
        hash.update(`${serverUrl}:${workTypeSystemName}`);
        return hash.digest('hex').substring(0, 16);
    }
    
    /**
     * Get cached export data if available and valid
     */
    public async getCachedExport(
        workTypeSystemName: string,
        workTypeName: string,
        serverUrl: string
    ): Promise<IExportedData | null> {
        const key = this.generateCacheKey(workTypeSystemName, serverUrl);
        const entry = this.cache.get(key);
        
        if (!entry) {
            this.cacheMisses++;
            Inform.writeInfo(`📊 Cache miss for ${workTypeName} (Hit rate: ${this.getHitRate()}%)`);
            return null;
        }
        
        // Check if cache entry is still valid
        const age = Date.now() - entry.timestamp.getTime();
        if (age > this.maxCacheAge) {
            Inform.writeInfo(`⏰ Cache expired for ${workTypeName} (Age: ${Math.round(age / 60000)}min)`);
            this.cache.delete(key);
            this.cacheMisses++;
            return null;
        }
        
        // Update access statistics
        entry.accessCount++;
        entry.lastAccessed = new Date();
        this.cacheHits++;
        
        const ageMinutes = Math.round(age / 60000);
        Inform.writeInfo(`✅ Cache hit for ${workTypeName} (Age: ${ageMinutes}min, Accessed: ${entry.accessCount}x)`);
        
        // Show cache usage in status bar
        vscode.window.setStatusBarMessage(
            `$(database) HLD Cache Hit - ${ageMinutes}min old`,
            3000
        );
        
        return entry.data;
    }
    
    /**
     * Store export data in cache with sanitization
     */
    public async cacheExport(
        workTypeSystemName: string,
        workTypeName: string,
        serverUrl: string,
        data: IExportedData,
        exportMethod: 'package-export' | 'individual-apis'
    ): Promise<void> {
        const key = this.generateCacheKey(workTypeSystemName, serverUrl);
        
        // Sanitize sensitive data before caching
        const sanitizedData = this.sanitizeSensitiveData(data);
        const size = JSON.stringify(sanitizedData).length;
        
        // Check if we need to make room
        await this.ensureCacheSpace(size);
        
        const entry: ICacheEntry = {
            key,
            workTypeSystemName,
            workTypeName,
            data: sanitizedData,
            timestamp: new Date(),
            size,
            accessCount: 0,
            lastAccessed: new Date(),
            exportMethod,
            serverUrl
        };
        
        this.cache.set(key, entry);
        
        // Persist cache if context available
        if (this.context) {
            await this.persistCache();
        }
        
        Inform.writeInfo(`💾 Cached export for ${workTypeName} (Size: ${Math.round(size / 1024)}KB)`);
        
        // Show cache status
        const stats = this.getCacheStats();
        vscode.window.setStatusBarMessage(
            `$(database) HLD Cached - ${stats.totalEntries} entries, ${Math.round(stats.totalSize / 1024 / 1024)}MB`,
            3000
        );
    }
    
    /**
     * Ensure there's enough space in cache
     */
    private async ensureCacheSpace(requiredSize: number): Promise<void> {
        let currentSize = this.getCurrentCacheSize();
        
        // Remove oldest entries until we have enough space
        while (currentSize + requiredSize > this.maxCacheSize && this.cache.size > 0) {
            const oldestEntry = this.getOldestEntry();
            if (oldestEntry) {
                this.cache.delete(oldestEntry.key);
                currentSize -= oldestEntry.size;
                Inform.writeInfo(`🗑️ Evicted cache entry for ${oldestEntry.workTypeName} to make space`);
            } else {
                break;
            }
        }
    }
    
    /**
     * Get the oldest cache entry
     */
    private getOldestEntry(): ICacheEntry | null {
        let oldest: ICacheEntry | null = null;
        
        for (const entry of this.cache.values()) {
            if (!oldest || entry.lastAccessed < oldest.lastAccessed) {
                oldest = entry;
            }
        }
        
        return oldest;
    }
    
    /**
     * Clean up expired cache entries
     */
    private cleanupCache(): void {
        const now = Date.now();
        let removed = 0;
        
        for (const [key, entry] of this.cache.entries()) {
            const age = now - entry.timestamp.getTime();
            if (age > this.maxCacheAge) {
                this.cache.delete(key);
                removed++;
            }
        }
        
        if (removed > 0) {
            Inform.writeInfo(`🧹 Cleaned up ${removed} expired cache entries`);
            if (this.context) {
                this.persistCache();
            }
        }
    }
    
    /**
     * Get current cache size in bytes
     */
    private getCurrentCacheSize(): number {
        let size = 0;
        for (const entry of this.cache.values()) {
            size += entry.size;
        }
        return size;
    }
    
    /**
     * Get cache hit rate percentage
     */
    private getHitRate(): number {
        const total = this.cacheHits + this.cacheMisses;
        if (total === 0) return 0;
        return Math.round((this.cacheHits / total) * 100);
    }
    
    /**
     * Get cache statistics
     */
    public getCacheStats(): ICacheStats {
        const entries = Array.from(this.cache.values());
        
        return {
            totalEntries: this.cache.size,
            totalSize: this.getCurrentCacheSize(),
            hitRate: this.getHitRate(),
            mostAccessed: entries
                .sort((a, b) => b.accessCount - a.accessCount)
                .slice(0, 5)
                .map(e => e.workTypeName),
            oldestEntry: entries.length > 0 
                ? entries.reduce((min, e) => e.timestamp < min ? e.timestamp : min, entries[0].timestamp)
                : null,
            newestEntry: entries.length > 0
                ? entries.reduce((max, e) => e.timestamp > max ? e.timestamp : max, entries[0].timestamp)
                : null
        };
    }
    
    /**
     * Clear all cache entries
     */
    public async clearCache(): Promise<void> {
        const oldSize = this.cache.size;
        this.cache.clear();
        this.cacheHits = 0;
        this.cacheMisses = 0;
        
        if (this.context) {
            await this.context.globalState.update('hldCache', undefined);
        }
        
        Inform.writeInfo(`🗑️ Cleared ${oldSize} cache entries`);
        vscode.window.showInformationMessage(`HLD cache cleared (${oldSize} entries removed)`);
    }
    
    /**
     * Persist cache to global state
     */
    private async persistCache(): Promise<void> {
        if (!this.context) return;
        
        // Convert Map to serializable format
        const cacheData: any[] = [];
        for (const [key, entry] of this.cache.entries()) {
            // Only persist essential data to reduce size
            cacheData.push({
                key,
                workTypeSystemName: entry.workTypeSystemName,
                workTypeName: entry.workTypeName,
                timestamp: entry.timestamp.toISOString(),
                size: entry.size,
                accessCount: entry.accessCount,
                lastAccessed: entry.lastAccessed.toISOString(),
                exportMethod: entry.exportMethod,
                serverUrl: entry.serverUrl,
                // Store data separately to avoid issues
                dataKey: `hldData_${key}`
            });
            
            // Store the actual data separately
            await this.context.globalState.update(`hldData_${key}`, entry.data);
        }
        
        await this.context.globalState.update('hldCache', cacheData);
        await this.context.globalState.update('hldCacheStats', {
            hits: this.cacheHits,
            misses: this.cacheMisses
        });
    }
    
    /**
     * Load persisted cache from global state
     */
    private async loadPersistedCache(): Promise<void> {
        if (!this.context) return;
        
        const cacheData = this.context.globalState.get<any[]>('hldCache');
        const stats = this.context.globalState.get<any>('hldCacheStats');
        
        if (stats) {
            this.cacheHits = stats.hits || 0;
            this.cacheMisses = stats.misses || 0;
        }
        
        if (!cacheData || !Array.isArray(cacheData)) return;
        
        let loaded = 0;
        for (const item of cacheData) {
            // Check if entry is still valid
            const age = Date.now() - new Date(item.timestamp).getTime();
            if (age > this.maxCacheAge) continue;
            
            // Load the actual data
            const data = this.context.globalState.get<IExportedData>(`hldData_${item.key}`);
            if (!data) continue;
            
            const entry: ICacheEntry = {
                key: item.key,
                workTypeSystemName: item.workTypeSystemName,
                workTypeName: item.workTypeName,
                data,
                timestamp: new Date(item.timestamp),
                size: item.size,
                accessCount: item.accessCount,
                lastAccessed: new Date(item.lastAccessed),
                exportMethod: item.exportMethod,
                serverUrl: item.serverUrl
            };
            
            this.cache.set(item.key, entry);
            loaded++;
        }
        
        if (loaded > 0) {
            Inform.writeInfo(`📂 Loaded ${loaded} cached HLD entries from persistent storage`);
        }
    }
    
    /**
     * Sanitize sensitive data before caching
     */
    private sanitizeSensitiveData(data: IExportedData): IExportedData {
        const tokenManager = SecureTokenManager.getInstance();
        const jsonStr = JSON.stringify(data);
        const sanitized = tokenManager.sanitizeLog(jsonStr);
        const result = JSON.parse(sanitized);
        
        // Additional sanitization for known sensitive fields
        const sanitizeObject = (obj: any): any => {
            if (!obj || typeof obj !== 'object') return obj;
            
            const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'bearer', 'authorization'];
            
            if (Array.isArray(obj)) {
                return obj.map(item => sanitizeObject(item));
            }
            
            const sanitized: any = {};
            for (const [key, value] of Object.entries(obj)) {
                const lowerKey = key.toLowerCase();
                
                // Check if key contains sensitive words
                if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
                    sanitized[key] = '***REDACTED***';
                } else if (typeof value === 'object') {
                    sanitized[key] = sanitizeObject(value);
                } else {
                    sanitized[key] = value;
                }
            }
            
            return sanitized;
        };
        
        return sanitizeObject(result);
    }
    
    /**
     * Show cache status in output channel
     */
    public showCacheStatus(): void {
        const stats = this.getCacheStats();
        
        Inform.writeInfo('');
        Inform.writeInfo('=== HLD Cache Status ===');
        Inform.writeInfo(`Total Entries: ${stats.totalEntries}`);
        Inform.writeInfo(`Total Size: ${Math.round(stats.totalSize / 1024)}KB`);
        Inform.writeInfo(`Hit Rate: ${stats.hitRate}%`);
        Inform.writeInfo(`Cache Hits: ${this.cacheHits}`);
        Inform.writeInfo(`Cache Misses: ${this.cacheMisses}`);
        
        if (stats.mostAccessed.length > 0) {
            Inform.writeInfo('Most Accessed:');
            stats.mostAccessed.forEach((name, i) => {
                Inform.writeInfo(`  ${i + 1}. ${name}`);
            });
        }
        
        if (stats.oldestEntry) {
            const age = Math.round((Date.now() - stats.oldestEntry.getTime()) / 60000);
            Inform.writeInfo(`Oldest Entry: ${age} minutes ago`);
        }
        
        if (stats.newestEntry) {
            const age = Math.round((Date.now() - stats.newestEntry.getTime()) / 60000);
            Inform.writeInfo(`Newest Entry: ${age} minutes ago`);
        }
        
        Inform.writeInfo('========================');
    }
}