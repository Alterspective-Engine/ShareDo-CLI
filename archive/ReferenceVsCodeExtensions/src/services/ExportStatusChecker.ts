/**
 * Export Status Checker
 * 
 * Provides multiple strategies for checking export job status
 * to handle different server configurations and API versions
 */

import { SharedoClient } from '../sharedoClient';
import { Inform } from '../Utilities/inform';

export interface IExportStatus {
    complete: boolean;
    percentage: number;
    state: string;
    packageAvailable?: boolean;
    current?: any[];
    queued?: any[];
    error?: string;
    message?: string;
    downloadUrl?: string;
    // Additional properties that might contain the package data
    package?: any;
    data?: any;
    exportData?: any;
    items?: any;
}

export class ExportStatusChecker {
    private pollCount = 0;
    private lastWorkingEndpoint: string | null = null;
    
    constructor(private client: SharedoClient) {}
    
    /**
     * Try multiple strategies to get export status
     */
    public async checkStatus(packageId: string): Promise<IExportStatus | null> {
        this.pollCount++;
        
        // Log polling attempt
        if (this.pollCount % 10 === 1) {
            Inform.writeInfo(`   🔄 Checking export status (attempt ${this.pollCount})...`);
        }
        
        // Strategy 1: Try the standard modeller endpoint
        let status = await this.tryModellerEndpoint(packageId);
        if (status) {
            this.logStatusDetails(status, 'modeller');
            return status;
        }
        
        // Strategy 2: Try the package export endpoint
        status = await this.tryPackageEndpoint(packageId);
        if (status) {
            this.logStatusDetails(status, 'package');
            return status;
        }
        
        // Strategy 3: Try the export panel endpoint
        status = await this.tryExportPanelEndpoint(packageId);
        if (status) {
            this.logStatusDetails(status, 'panel');
            return status;
        }
        
        // Strategy 4: Try legacy endpoints
        status = await this.tryLegacyEndpoints(packageId);
        if (status) {
            this.logStatusDetails(status, 'legacy');
            return status;
        }
        
        // Strategy 5: Try to get status from export list
        status = await this.tryExportListEndpoint(packageId);
        if (status) {
            this.logStatusDetails(status, 'list');
            return status;
        }
        
        // If nothing works, log it
        if (this.pollCount === 1) {
            Inform.writeInfo(`   ⚠️ No status endpoints responding for package ${packageId}`);
        }
        return null;
    }
    
    /**
     * Log status details for debugging
     */
    private logStatusDetails(status: IExportStatus, source: string): void {
        // Log endpoint switch on subsequent polls
        if (this.pollCount > 1 && this.lastWorkingEndpoint !== source) {
            Inform.writeInfo(`   🔄 Switched to ${source} endpoint for status checks`);
        }
        
        // Log every 5th poll or on significant changes
        if (this.pollCount % 5 === 1 || status.percentage % 20 === 0 || status.complete) {
            const baseUrl = this.client.getBaseUrl();
            const endpoint = this.getStatusEndpointForSource(source);
            Inform.writeInfo(`   📊 Status from ${baseUrl}${endpoint}`);
            Inform.writeInfo(`      State: ${status.state} - ${status.percentage}% complete`);
            
            if (status.current && status.current.length > 0) {
                Inform.writeInfo(`      Current items: ${status.current.length} items being processed`);
            }
            
            if (status.queued && status.queued.length > 0) {
                Inform.writeInfo(`      Queued items: ${status.queued.length} items waiting`);
            }
            
            if (status.message) {
                Inform.writeInfo(`      Message: ${status.message}`);
            }
            
            if (status.error) {
                Inform.writeInfo(`      ❌ Error: ${status.error}`);
            }
            
            if (status.complete && status.packageAvailable) {
                Inform.writeInfo(`      ✅ Package ready for download!`);
            }
        }
    }
    
    /**
     * Get the status endpoint path for a given source
     */
    private getStatusEndpointForSource(source: string): string {
        // This is just for logging - we don't have the packageId here
        switch (source) {
            case 'modeller':
                return '/api/modeller/importexport/export/package/{id}/progress/';
            case 'package':
                return '/api/package/export/{id}';
            case 'panel':
                return '/api/package/export-panel/{id}';
            case 'legacy':
                return '/api/exports/{id}/status';
            case 'configuration':
                return '/api/configuration/export/{id}';
            case 'list':
                return '/api/package/exports';
            default:
                return '/api/unknown/{id}';
        }
    }
    
    /**
     * Strategy 1: Standard modeller endpoint
     */
    private async tryModellerEndpoint(packageId: string): Promise<IExportStatus | null> {
        // Frontend uses: /api/modeller/importexport/{mode}/package/{jobId}/progress/
        const endpoint = `/api/modeller/importexport/export/package/${packageId}/progress/`;
        try {
            // Always log the full endpoint details for /progress calls
            const fullUrl = `${this.client.getBaseUrl()}${endpoint}`;
            Inform.writeInfo(`   🔗 Calling progress endpoint:`);
            Inform.writeInfo(`      URL: GET ${fullUrl}`);
            Inform.writeInfo(`      Package ID: ${packageId}`);
            
            const response = await this.client.makeRequest({
                method: 'GET',
                path: endpoint
            });
            
            if (response) {
                // Always log the full response for progress endpoint
                Inform.writeInfo(`   ✅ Progress response received:`);
                Inform.writeInfo(`      Raw response: ${JSON.stringify(response, null, 2).replace(/\n/g, '\n      ')}`);
                
                if (this.pollCount === 1) {
                    Inform.writeInfo(`   ✅ Using modeller endpoint for status checks`);
                }
                
                // Log normalized status
                const normalizedStatus = this.normalizeStatus(response);
                Inform.writeInfo(`   📊 Normalized status:`);
                Inform.writeInfo(`      • State: ${normalizedStatus.state}`);
                Inform.writeInfo(`      • Percentage: ${normalizedStatus.percentage}%`);
                Inform.writeInfo(`      • Complete: ${normalizedStatus.complete}`);
                Inform.writeInfo(`      • Package Available: ${normalizedStatus.packageAvailable}`);
                
                // Frontend logic: complete for export means both complete AND packageAvailable
                if (response.complete && !response.packageAvailable && response.state !== "PACKAGE CREATION FAILED") {
                    Inform.writeInfo(`      • Note: Export complete but package still being created...`);
                    normalizedStatus.state = 'CREATING PACKAGE';
                    normalizedStatus.complete = false; // Not really complete until package is available
                }
                if (normalizedStatus.message) {
                    Inform.writeInfo(`      • Message: ${normalizedStatus.message}`);
                }
                if (normalizedStatus.error) {
                    Inform.writeInfo(`      • Error: ${normalizedStatus.error}`);
                }
                
                this.lastWorkingEndpoint = 'modeller';
                return normalizedStatus;
            } else {
                Inform.writeInfo(`   ⚠️ Progress endpoint returned empty response`);
            }
        } catch (error: any) {
            // Always log errors for progress endpoint
            Inform.writeInfo(`   ❌ Progress endpoint error:`);
            Inform.writeInfo(`      Endpoint: ${endpoint}`);
            if (error?.response) {
                Inform.writeInfo(`      Status: ${error.response.status}`);
                Inform.writeInfo(`      Status Text: ${error.response.statusText}`);
                if (error.response.data) {
                    Inform.writeInfo(`      Response Data: ${JSON.stringify(error.response.data, null, 2).replace(/\n/g, '\n      ')}`);
                }
            } else if (error?.message) {
                Inform.writeInfo(`      Error: ${error.message}`);
            } else {
                Inform.writeInfo(`      Error: ${error}`);
            }
        }
        return null;
    }
    
    /**
     * Strategy 2: Package export endpoint
     */
    private async tryPackageEndpoint(packageId: string): Promise<IExportStatus | null> {
        const endpoint = `/api/package/export/${packageId}`;
        try {
            if (this.pollCount === 1 || this.pollCount % 20 === 0) {
                Inform.writeInfo(`   🔗 Calling: GET ${endpoint}`);
            }
            
            const response = await this.client.makeRequest({
                method: 'GET',
                path: endpoint
            });
            
            if (response) {
                if (this.pollCount === 1) {
                    Inform.writeInfo(`   ✅ Using package endpoint for status checks`);
                    this.logRawResponse(response, 'package');
                }
                this.lastWorkingEndpoint = 'package';
                return this.normalizeStatus(response);
            }
        } catch (error) {
            if (this.pollCount === 1) {
                this.logEndpointError('package', error, endpoint);
            }
        }
        return null;
    }
    
    /**
     * Strategy 3: Export panel endpoint (used by UI)
     */
    private async tryExportPanelEndpoint(packageId: string): Promise<IExportStatus | null> {
        const endpoint = `/api/package/export-panel/${packageId}`;
        try {
            if (this.pollCount === 1 || this.pollCount % 20 === 0) {
                Inform.writeInfo(`   🔗 Calling: GET ${endpoint}`);
            }
            
            const response = await this.client.makeRequest({
                method: 'GET',
                path: endpoint
            });
            
            if (response) {
                if (this.pollCount === 1) {
                    Inform.writeInfo(`   ✅ Using export panel endpoint for status checks`);
                    this.logRawResponse(response, 'panel');
                }
                this.lastWorkingEndpoint = 'panel';
                return this.normalizeStatus(response);
            }
        } catch (error) {
            if (this.pollCount === 1) {
                this.logEndpointError('panel', error, endpoint);
            }
        }
        return null;
    }
    
    /**
     * Strategy 4: Legacy endpoints
     */
    private async tryLegacyEndpoints(packageId: string): Promise<IExportStatus | null> {
        // Try old export status endpoint
        const legacyEndpoint = `/api/exports/${packageId}/status`;
        try {
            if (this.pollCount === 1 || this.pollCount % 20 === 0) {
                Inform.writeInfo(`   🔗 Calling: GET ${legacyEndpoint}`);
            }
            
            const response = await this.client.makeRequest({
                method: 'GET',
                path: legacyEndpoint
            });
            
            if (response) {
                if (this.pollCount === 1) {
                    Inform.writeInfo(`   ✅ Using legacy endpoint for status checks`);
                    this.logRawResponse(response, 'legacy');
                }
                this.lastWorkingEndpoint = 'legacy';
                return this.normalizeStatus(response);
            }
        } catch (error) {
            if (this.pollCount === 1) {
                this.logEndpointError('legacy', error, legacyEndpoint);
            }
        }
        
        // Try configuration export endpoint
        const configEndpoint = `/api/configuration/export/${packageId}`;
        try {
            if (this.pollCount === 1 || this.pollCount % 20 === 0) {
                Inform.writeInfo(`   🔗 Calling: GET ${configEndpoint}`);
            }
            
            const response = await this.client.makeRequest({
                method: 'GET',
                path: configEndpoint
            });
            
            if (response) {
                if (this.pollCount === 1) {
                    Inform.writeInfo(`   ✅ Using configuration endpoint for status checks`);
                    this.logRawResponse(response, 'configuration');
                }
                this.lastWorkingEndpoint = 'configuration';
                return this.normalizeStatus(response);
            }
        } catch (error) {
            if (this.pollCount === 1) {
                this.logEndpointError('configuration', error, configEndpoint);
            }
        }
        
        return null;
    }
    
    /**
     * Strategy 5: Get status from export list
     */
    private async tryExportListEndpoint(packageId: string): Promise<IExportStatus | null> {
        const endpoint = `/api/package/exports`;
        try {
            if (this.pollCount === 1 || this.pollCount % 20 === 0) {
                Inform.writeInfo(`   🔗 Calling: GET ${endpoint} (searching for ${packageId})`);
            }
            
            const response = await this.client.makeRequest({
                method: 'GET',
                path: endpoint
            });
            
            if (response && Array.isArray(response)) {
                const exportJob = response.find((job: any) => 
                    job.exportJobId === packageId || 
                    job.id === packageId
                );
                
                if (exportJob) {
                    if (this.pollCount === 1) {
                        Inform.writeInfo(`   ✅ Using export list endpoint for status checks`);
                        Inform.writeInfo(`   📋 Found export job in list of ${response.length} jobs`);
                        this.logRawResponse(exportJob, 'list');
                    }
                    this.lastWorkingEndpoint = 'list';
                    return this.normalizeStatus(exportJob);
                }
                
                if (this.pollCount === 1) {
                    Inform.writeInfo(`   ❌ Export ${packageId} not found in list of ${response.length} jobs`);
                }
            }
        } catch (error) {
            if (this.pollCount === 1) {
                this.logEndpointError('export list', error, endpoint);
            }
        }
        return null;
    }
    
    /**
     * Normalize different status response formats
     */
    private normalizeStatus(response: any): IExportStatus {
        // Handle null/undefined
        if (!response) {
            return {
                complete: false,
                percentage: 0,
                state: 'UNKNOWN',
                packageAvailable: false
            };
        }
        
        // Extract common fields with multiple fallbacks
        let complete = response.complete === true || 
                      response.isComplete === true ||
                      response.state === 'COMPLETE' || 
                      response.state === 'Completed' ||
                      response.status === 'Complete' ||
                      response.percentage === 100 ||
                      response.progress === 100;
        
        const percentage = response.percentage || 
                          response.progress || 
                          response.percentComplete ||
                          (complete ? 100 : 0);
        
        let state = response.state || 
                   response.status || 
                   response.exportState ||
                   (complete ? 'COMPLETE' : 'RUNNING');
        
        let packageAvailable = response.packageAvailable !== false && 
                              (response.packageAvailable === true || 
                               response.downloadUrl || 
                               complete);
        
        // Special handling for exports - not complete until package is available
        // This matches the frontend logic: var complete = data.complete && data.packageAvailable
        if (complete && !packageAvailable && state !== "PACKAGE CREATION FAILED") {
            // Export is done but package is still being created
            state = 'CREATING PACKAGE';
            complete = false; // Override complete status
        }
        
        // For exports, we're only truly complete when BOTH conditions are met
        if (response.complete === true && response.packageAvailable === true) {
            complete = true;
            packageAvailable = true;
        }
        
        // Build download URL if not provided
        let downloadUrl = response.downloadUrl;
        if (!downloadUrl && complete && this.lastWorkingEndpoint) {
            const exportId = response.exportJobId || response.id;
            switch (this.lastWorkingEndpoint) {
                case 'modeller':
                    // Use the frontend pattern with double underscore for downloads
                    downloadUrl = `/modeller/__importexport/export/package/${exportId}/download`;
                    break;
                case 'package':
                    downloadUrl = `/api/package/export/${exportId}/download`;
                    break;
                default:
                    // Default to frontend download pattern
                    downloadUrl = `/modeller/__importexport/export/package/${exportId}/download`;
            }
        }
        
        return {
            complete,
            percentage,
            state,
            packageAvailable,
            current: response.current || response.currentItems || [],
            queued: response.queued || response.queuedItems || [],
            error: response.error || response.errorMessage,
            message: response.message || response.statusMessage,
            downloadUrl
        };
    }
    
    /**
     * Get the download URL based on the working endpoint
     */
    public getDownloadUrl(packageId: string): string {
        switch (this.lastWorkingEndpoint) {
            case 'modeller':
                // Use the frontend pattern with double underscore for downloads
                return `/modeller/__importexport/export/package/${packageId}/download`;
            case 'package':
                return `/api/package/export/${packageId}/download`;
            case 'panel':
                return `/api/package/export-panel/${packageId}/download`;
            case 'legacy':
                return `/api/exports/${packageId}/download`;
            case 'configuration':
                return `/api/configuration/export/${packageId}/download`;
            default:
                // Default to frontend download pattern
                return `/modeller/__importexport/export/package/${packageId}/download`;
        }
    }
    
    /**
     * Log raw response for debugging
     */
    private logRawResponse(response: any, endpoint: string): void {
        Inform.writeInfo(`   📥 Raw response from ${endpoint}:`);
        
        // Log key fields if they exist
        const fields = ['state', 'percentage', 'complete', 'packageAvailable', 'current', 'queued', 'message', 'error'];
        const summary: any = {};
        
        for (const field of fields) {
            if (response.hasOwnProperty(field)) {
                if (Array.isArray(response[field])) {
                    summary[field] = `Array(${response[field].length})`;
                } else {
                    summary[field] = response[field];
                }
            }
        }
        
        // Log any additional fields not in our list
        for (const key in response) {
            if (!fields.includes(key) && key !== 'exportJobId' && key !== 'id') {
                summary[`(${key})`] = typeof response[key] === 'object' ? 
                    `${typeof response[key]}` : response[key];
            }
        }
        
        Inform.writeInfo(`      ${JSON.stringify(summary, null, 2).replace(/\n/g, '\n      ')}`);
    }
    
    /**
     * Log endpoint error for debugging
     */
    private logEndpointError(strategy: string, error: any, endpoint: string): void {
        if (error?.response?.status === 404) {
            // 404s are expected for some endpoints
            Inform.writeInfo(`      ❌ ${strategy}: Not found (404) - ${endpoint}`);
        } else if (error?.response?.status === 401) {
            Inform.writeInfo(`      ❌ ${strategy}: Unauthorized (401) - ${endpoint}`);
        } else if (error?.response?.status === 403) {
            Inform.writeInfo(`      ❌ ${strategy}: Forbidden (403) - ${endpoint}`);
        } else if (error?.response?.status === 500) {
            Inform.writeInfo(`      ❌ ${strategy}: Server error (500) - ${endpoint}`);
        } else if (error?.response?.status) {
            Inform.writeInfo(`      ❌ ${strategy}: Error ${error.response.status} - ${endpoint}`);
        } else if (error?.code === 'ECONNREFUSED') {
            Inform.writeInfo(`      ❌ ${strategy}: Connection refused - ${endpoint}`);
        } else if (error?.code === 'ETIMEDOUT') {
            Inform.writeInfo(`      ❌ ${strategy}: Request timeout - ${endpoint}`);
        } else if (error?.code) {
            Inform.writeInfo(`      ❌ ${strategy}: ${error.code} - ${endpoint}`);
        } else {
            Inform.writeInfo(`      ❌ ${strategy}: Unknown error - ${endpoint}`);
        }
    }
}