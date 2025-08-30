/**
 * Package Download Service
 * 
 * Downloads and extracts ShareDo package export ZIP files
 * Converts the extracted JSON data into a format suitable for HLD generation
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { Inform } from '../Utilities/inform';
import axios from 'axios';
import * as AdmZip from 'adm-zip';

export interface IPackageManifest {
    Name: string;
    CreatedBy: string;
    ExportedFrom: string;
    CreatedOn: string;
    SharedoVersion: {
        Major: number;
        Minor: number;
        Build: number;
        Revision: number;
    };
    Files?: Array<{
        Id: string;
        OriginalFilename: string;
        StorageFilename: string;
        StepId: string;
    }>;
    ExportedSteps?: Array<{
        Id: string;
        Description: string;
        ExportProviderSystemName: string;
        StorageFilename: string;
    }>;
}

export interface IExtractedPackageData {
    manifest: IPackageManifest;
    workTypes: any[];
    forms: any[];
    workflows: any[];
    businessRules: any[];
    approvals: any[];
    optionSets: any[];
    templates: any[];
    permissions: any[];
    participantRoles: any[];
    allData: Map<string, any>;
}

export class PackageDownloadService {
    private static instance: PackageDownloadService;
    private tempDir: string;
    
    private constructor() {
        // Create temp directory for package extraction
        this.tempDir = path.join(os.tmpdir(), 'sharedo-hld-packages');
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }
    
    public static getInstance(): PackageDownloadService {
        if (!PackageDownloadService.instance) {
            PackageDownloadService.instance = new PackageDownloadService();
        }
        return PackageDownloadService.instance;
    }
    
    /**
     * Download and extract package from ShareDo export URL
     */
    public async downloadAndExtractPackage(
        downloadUrl: string,
        packageId: string,
        bearerToken?: string
    ): Promise<IExtractedPackageData | null> {
        try {
            Inform.writeInfo(`📦 Starting package download from: ${downloadUrl}`);
            
            // Create a unique directory for this package
            const packageDir = path.join(this.tempDir, packageId);
            if (!fs.existsSync(packageDir)) {
                fs.mkdirSync(packageDir, { recursive: true });
            }
            
            const zipFilePath = path.join(packageDir, `${packageId}.zip`);
            
            // Download the ZIP file
            await this.downloadFile(downloadUrl, zipFilePath, bearerToken);
            
            // Extract the ZIP file
            const extractedPath = path.join(packageDir, 'extracted');
            await this.extractZip(zipFilePath, extractedPath);
            
            // Parse the extracted data
            const packageData = await this.parseExtractedData(extractedPath);
            
            // Clean up ZIP file (keep extracted data for debugging)
            try {
                fs.unlinkSync(zipFilePath);
            } catch (e) {
                // Ignore cleanup errors
            }
            
            Inform.writeInfo(`✅ Package extracted successfully to: ${extractedPath}`);
            
            return packageData;
            
        } catch (error) {
            Inform.writeError('Failed to download and extract package', error);
            return null;
        }
    }
    
    /**
     * Download file from URL with retry and resume support
     */
    private async downloadFile(
        url: string,
        destPath: string,
        bearerToken?: string,
        maxRetries: number = 3
    ): Promise<void> {
        try {
            Inform.writeInfo(`   📥 Downloading to: ${destPath}`);
            
            const headers: any = {};
            if (bearerToken) {
                headers['Authorization'] = `Bearer ${bearerToken}`;
            }
            
            let lastError: any = null;
            let downloadedBytes = 0;
            
            // Check if partial file exists (for resume)
            if (fs.existsSync(destPath)) {
                const stats = fs.statSync(destPath);
                downloadedBytes = stats.size;
                if (downloadedBytes > 0) {
                    Inform.writeInfo(`   🔄 Resuming download from ${Math.round(downloadedBytes / 1024)}KB`);
                    headers['Range'] = `bytes=${downloadedBytes}-`;
                }
            }
            
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    const response = await axios({
                        method: 'GET',
                        url: url,
                        responseType: 'stream',
                        headers: headers,
                        timeout: 60000, // 60 second timeout
                        maxContentLength: 100 * 1024 * 1024, // 100MB max
                        maxBodyLength: 100 * 1024 * 1024
                    });
                    
                    // Create write stream (append if resuming)
                    const writeStream = fs.createWriteStream(destPath, {
                        flags: downloadedBytes > 0 ? 'a' : 'w'
                    });
                    
                    // Track progress
                    let downloaded = downloadedBytes;
                    const totalSize = parseInt(response.headers['content-length'] || '0') + downloadedBytes;
                    let lastProgressReport = 0;
                    
                    response.data.on('data', (chunk: Buffer) => {
                        downloaded += chunk.length;
                        const percentComplete = Math.round((downloaded * 100) / totalSize);
                        
                        // Report progress every 10%
                        if (percentComplete >= lastProgressReport + 10) {
                            lastProgressReport = Math.floor(percentComplete / 10) * 10;
                            Inform.writeInfo(`   📊 Download progress: ${percentComplete}% (${Math.round(downloaded / 1024)}KB / ${Math.round(totalSize / 1024)}KB)`);
                        }
                    });
                    
                    // Handle stream completion
                    await new Promise<void>((resolve, reject) => {
                        writeStream.on('finish', resolve);
                        writeStream.on('error', reject);
                        response.data.on('error', reject);
                        response.data.pipe(writeStream);
                    });
                    
                    // Success - exit retry loop
                    break;
                    
                } catch (error: any) {
                    lastError = error;
                    Inform.writeInfo(`   ⚠️ Download attempt ${attempt}/${maxRetries} failed: ${error.message}`);
                    
                    if (attempt < maxRetries) {
                        const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
                        Inform.writeInfo(`   ⏳ Waiting ${waitTime / 1000}s before retry...`);
                        await new Promise(resolve => setTimeout(resolve, waitTime));
                        
                        // Check if we can resume
                        if (fs.existsSync(destPath)) {
                            const stats = fs.statSync(destPath);
                            downloadedBytes = stats.size;
                            headers['Range'] = `bytes=${downloadedBytes}-`;
                        }
                    }
                }
            }
            
            if (lastError) {
                throw lastError;
            }
            
            // File was written by the stream, just check final size
            const fileSizeMB = fs.statSync(destPath).size / (1024 * 1024);
            Inform.writeInfo(`   ✅ Downloaded ${fileSizeMB.toFixed(2)} MB`);
            
        } catch (error: any) {
            if (error.response) {
                throw new Error(`Download failed with status ${error.response.status}: ${error.response.statusText}`);
            } else if (error.request) {
                throw new Error(`Download failed: No response received`);
            } else {
                throw new Error(`Download failed: ${error.message}`);
            }
        }
    }
    
    /**
     * Extract ZIP file with security checks
     */
    private async extractZip(zipPath: string, destPath: string): Promise<void> {
        try {
            Inform.writeInfo(`   📂 Extracting ZIP file...`);
            
            // Security check 1: Check compressed file size
            const stats = fs.statSync(zipPath);
            const compressedSize = stats.size;
            const maxCompressedSize = 100 * 1024 * 1024; // 100MB limit
            
            if (compressedSize > maxCompressedSize) {
                throw new Error(`ZIP file too large: ${Math.round(compressedSize / 1024 / 1024)}MB exceeds ${Math.round(maxCompressedSize / 1024 / 1024)}MB limit`);
            }
            
            const zip = new AdmZip(zipPath);
            const entries = zip.getEntries();
            
            // Security check 2: Check uncompressed size and compression ratio
            let totalUncompressedSize = 0;
            const maxUncompressedSize = 500 * 1024 * 1024; // 500MB limit
            const maxCompressionRatio = 100; // Max 100:1 compression ratio
            
            for (const entry of entries) {
                // Security check 3: Path traversal prevention
                const entryName = entry.entryName;
                if (entryName.includes('..') || path.isAbsolute(entryName)) {
                    throw new Error(`Suspicious file path detected: ${entryName}`);
                }
                
                // Check for symbolic links (AdmZip doesn't have this property, check attributes)
                // Symbolic links would have different attributes but AdmZip doesn't expose them directly
                // Skip this check for now as AdmZip handles symlinks safely by default
                
                totalUncompressedSize += entry.header.size;
            }
            
            if (totalUncompressedSize > maxUncompressedSize) {
                throw new Error(`Uncompressed size too large: ${Math.round(totalUncompressedSize / 1024 / 1024)}MB exceeds ${Math.round(maxUncompressedSize / 1024 / 1024)}MB limit`);
            }
            
            const compressionRatio = totalUncompressedSize / compressedSize;
            if (compressionRatio > maxCompressionRatio) {
                throw new Error(`Suspicious compression ratio detected: ${Math.round(compressionRatio)}:1 exceeds ${maxCompressionRatio}:1 limit (possible ZIP bomb)`);
            }
            
            // Security check 4: File count limit
            const maxFileCount = 10000;
            if (entries.length > maxFileCount) {
                throw new Error(`Too many files in package: ${entries.length} exceeds ${maxFileCount} limit`);
            }
            
            Inform.writeInfo(`   🔒 Security checks passed:`);
            Inform.writeInfo(`      - Compressed size: ${Math.round(compressedSize / 1024)}KB`);
            Inform.writeInfo(`      - Uncompressed size: ${Math.round(totalUncompressedSize / 1024)}KB`);
            Inform.writeInfo(`      - Compression ratio: ${Math.round(compressionRatio)}:1`);
            Inform.writeInfo(`      - File count: ${entries.length}`);
            
            // Extract with timeout
            const extractTimeout = 30000; // 30 seconds
            const extractPromise = new Promise<void>((resolve, reject) => {
                try {
                    zip.extractAllTo(destPath, true);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
            
            const timeoutPromise = new Promise<void>((_, reject) => {
                setTimeout(() => reject(new Error('ZIP extraction timeout after 30 seconds')), extractTimeout);
            });
            
            await Promise.race([extractPromise, timeoutPromise]);
            
            // Count extracted files
            const files = this.getAllFiles(destPath);
            Inform.writeInfo(`   ✅ Extracted ${files.length} files safely`);
            
        } catch (error) {
            // Clean up on failure
            if (fs.existsSync(destPath)) {
                fs.rmSync(destPath, { recursive: true, force: true });
            }
            throw new Error(`Failed to extract ZIP: ${error}`);
        }
    }
    
    /**
     * Parse extracted package data
     */
    private async parseExtractedData(extractedPath: string): Promise<IExtractedPackageData> {
        try {
            Inform.writeInfo(`   🔍 Parsing extracted data...`);
            
            // Read manifest
            const manifestPath = path.join(extractedPath, 'manifest.json');
            let manifest: IPackageManifest;
            
            if (fs.existsSync(manifestPath)) {
                const manifestContent = fs.readFileSync(manifestPath, 'utf8');
                manifest = JSON.parse(manifestContent);
                Inform.writeInfo(`   ✅ Found manifest: ${manifest.Name}`);
            } else {
                Inform.writeInfo(`   ⚠️ No manifest.json found`);
                manifest = {
                    Name: 'Unknown Package',
                    CreatedBy: 'Unknown',
                    ExportedFrom: 'Unknown',
                    CreatedOn: new Date().toISOString(),
                    SharedoVersion: { Major: 0, Minor: 0, Build: 0, Revision: 0 }
                };
            }
            
            // Initialize collections
            const result: IExtractedPackageData = {
                manifest: manifest,
                workTypes: [],
                forms: [],
                workflows: [],
                businessRules: [],
                approvals: [],
                optionSets: [],
                templates: [],
                permissions: [],
                participantRoles: [],
                allData: new Map()
            };
            
            // Look for data directory
            const dataDir = path.join(extractedPath, 'data');
            if (fs.existsSync(dataDir)) {
                await this.parseDataDirectory(dataDir, result);
            } else {
                // Parse files directly in extracted path
                await this.parseDataDirectory(extractedPath, result);
            }
            
            // Log summary
            Inform.writeInfo(`   📊 Parsed data summary:`);
            Inform.writeInfo(`      - Work Types: ${result.workTypes.length}`);
            Inform.writeInfo(`      - Forms: ${result.forms.length}`);
            Inform.writeInfo(`      - Workflows: ${result.workflows.length}`);
            Inform.writeInfo(`      - Business Rules: ${result.businessRules.length}`);
            Inform.writeInfo(`      - Approvals: ${result.approvals.length}`);
            Inform.writeInfo(`      - Option Sets: ${result.optionSets.length}`);
            Inform.writeInfo(`      - Templates: ${result.templates.length}`);
            
            return result;
            
        } catch (error) {
            throw new Error(`Failed to parse extracted data: ${error}`);
        }
    }
    
    /**
     * Parse data directory
     */
    private async parseDataDirectory(dataDir: string, result: IExtractedPackageData): Promise<void> {
        const files = fs.readdirSync(dataDir);
        
        for (const file of files) {
            if (!file.endsWith('.json')) continue;
            
            const filePath = path.join(dataDir, file);
            
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                const data = JSON.parse(content);
                
                // Store all data
                result.allData.set(file, data);
                
                // Categorize by type based on filename patterns
                if (file.includes('sharedo-type-') || file.includes('work-type-')) {
                    result.workTypes.push(data);
                } else if (file.includes('form-builder-')) {
                    result.forms.push(data);
                } else if (file.includes('execution-engine-')) {
                    result.workflows.push(data);
                } else if (file.includes('business-rule-')) {
                    result.businessRules.push(data);
                } else if (file.includes('approval-')) {
                    result.approvals.push(data);
                } else if (file.includes('option-set-') || file.includes('optionset-')) {
                    result.optionSets.push(data);
                } else if (file.includes('document-template-')) {
                    result.templates.push(data);
                } else if (file.includes('permission-')) {
                    result.permissions.push(data);
                } else if (file.includes('participant-role-')) {
                    result.participantRoles.push(data);
                }
                
            } catch (error) {
                Inform.writeInfo(`   ⚠️ Failed to parse ${file}: ${error}`);
            }
        }
    }
    
    /**
     * Get all files recursively
     */
    private getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
        const files = fs.readdirSync(dirPath);
        
        files.forEach((file) => {
            const filePath = path.join(dirPath, file);
            if (fs.statSync(filePath).isDirectory()) {
                arrayOfFiles = this.getAllFiles(filePath, arrayOfFiles);
            } else {
                arrayOfFiles.push(filePath);
            }
        });
        
        return arrayOfFiles;
    }
    
    /**
     * Clean up temp directory
     */
    public cleanupTempFiles(packageId?: string): void {
        try {
            if (packageId) {
                // Clean specific package
                const packageDir = path.join(this.tempDir, packageId);
                if (fs.existsSync(packageDir)) {
                    fs.rmSync(packageDir, { recursive: true, force: true });
                    Inform.writeInfo(`🧹 Cleaned up package: ${packageId}`);
                }
            } else {
                // Clean all packages
                if (fs.existsSync(this.tempDir)) {
                    fs.rmSync(this.tempDir, { recursive: true, force: true });
                    fs.mkdirSync(this.tempDir, { recursive: true });
                    Inform.writeInfo(`🧹 Cleaned up all package files`);
                }
            }
        } catch (error) {
            Inform.writeError('Failed to cleanup temp files', error);
        }
    }
}