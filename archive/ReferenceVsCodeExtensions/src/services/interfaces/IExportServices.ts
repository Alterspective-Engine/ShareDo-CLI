/**
 * Service Interfaces for HLD Generation System
 * 
 * Defines contracts for services to reduce coupling and improve testability
 */

import { IWorkType } from '../../Request/WorkTypes/IGetWorkTypesRequestResult';
import { SharedoClient } from '../../sharedoClient';
import * as vscode from 'vscode';

/**
 * Core data structure for exported work type data
 */
export interface IExportedData {
    workType: any;
    forms: any[];
    workflows: any[];
    businessRules: any[];
    approvals: any[];
    optionSets: any[];
    permissions: any[];
    templates: any[];
    phases?: any;
    transitions?: any[];
    triggers?: any[];
    keyDates?: any[];
    participantRoles?: any[];
    aspects?: any;
    titleGenerator?: any;
    referenceGenerator?: any;
}

/**
 * Cache service interface
 */
export interface ICacheService {
    getCachedExport(
        workTypeSystemName: string,
        workTypeName: string,
        serverUrl: string
    ): Promise<IExportedData | null>;
    
    cacheExport(
        workTypeSystemName: string,
        workTypeName: string,
        serverUrl: string,
        data: IExportedData,
        exportMethod: 'package-export' | 'individual-apis'
    ): Promise<void>;
    
    clearCache(): Promise<void>;
}

/**
 * Package export service interface
 */
export interface IPackageExportService {
    exportWorkTypePackage(
        workType: IWorkType,
        client: SharedoClient
    ): Promise<IExportedData | null>;
}

/**
 * Package download service interface
 */
export interface IPackageDownloadService {
    downloadAndExtractPackage(
        downloadUrl: string,
        packageId: string,
        bearerToken?: string
    ): Promise<any | null>;
    
    cleanupTempFiles(packageId?: string): void;
}

/**
 * Work type data extraction service interface
 */
export interface IWorkTypeDataExtractor {
    extractWorkTypeConfiguration(
        workType: IWorkType,
        client: SharedoClient
    ): Promise<any>;
}

/**
 * HLD document generation service interface
 */
export interface IHLDDocumentGenerator {
    generateHLD(
        workType: IWorkType,
        client: SharedoClient
    ): Promise<Buffer>;
    
    generateHLDWithDiagrams(
        workType: IWorkType,
        client: SharedoClient,
        outputPath: string
    ): Promise<Buffer>;
}

/**
 * Service factory interface for dependency injection
 */
export interface IServiceFactory {
    getCacheService(): ICacheService;
    getPackageExportService(): IPackageExportService;
    getPackageDownloadService(): IPackageDownloadService;
    getWorkTypeDataExtractor(): IWorkTypeDataExtractor;
    getHLDDocumentGenerator(): IHLDDocumentGenerator;
}

/**
 * Progress reporter interface
 */
export interface IProgressReporter {
    report(update: {
        increment?: number;
        message?: string;
    }): void;
}

/**
 * Export options
 */
export interface IExportOptions {
    useCache?: boolean;
    usePackageExport?: boolean;
    maxRetries?: number;
    timeoutMs?: number;
    progressReporter?: IProgressReporter;
    cancellationToken?: vscode.CancellationToken;
}