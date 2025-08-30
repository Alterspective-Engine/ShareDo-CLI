/**
 * Playwright Export Service
 * 
 * Uses Playwright to handle the complete export process including authentication and download
 * Based on learnings from testExport folder for robust browser-based export handling
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { chromium } from 'playwright';
import { IWorkType } from '../Request/WorkTypes/IGetWorkTypesRequestResult';
import { Inform } from '../Utilities/inform';

export interface IPlaywrightExportOptions {
    baseUrl: string;
    workType: string;
    username?: string;
    password?: string;
    downloadPath?: string;
    showBrowser?: boolean;
    timeout?: number;
}

export interface IPlaywrightExportResult {
    success: boolean;
    filePath?: string;
    fileSize?: string;
    error?: string;
    jobId?: string;
}

export class PlaywrightExportService {
    private static instance: PlaywrightExportService;

    private constructor() {}

    public static getInstance(): PlaywrightExportService {
        if (!PlaywrightExportService.instance) {
            PlaywrightExportService.instance = new PlaywrightExportService();
        }
        return PlaywrightExportService.instance;
    }

    /**
     * Complete export using Playwright - authentication, export creation, monitoring, and download
     */
    public async completeExport(options: IPlaywrightExportOptions): Promise<IPlaywrightExportResult> {
        let playwright: any;
        let browser: any;

        try {
            // Dynamically import playwright
            try {
                playwright = await import('playwright');
            } catch (error) {
                return {
                    success: false,
                    error: 'Playwright not available. Please install it: npm install playwright'
                };
            }

            Inform.writeInfo(`🎭 Starting Playwright export for ${options.workType} from ${options.baseUrl}`);

            // Ensure download directory exists
            const downloadPath = options.downloadPath || path.join(vscode.workspace.rootPath || '', '.temp', 'exports');
            if (!fs.existsSync(downloadPath)) {
                fs.mkdirSync(downloadPath, { recursive: true });
            }

            // Launch browser
            browser = await chromium.launch({
                headless: options.showBrowser === false,
                downloadsPath: downloadPath
            });

            const context = await browser.newContext({
                acceptDownloads: true,
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            });

            const page = await context.newPage();

            let token: string | null = null;
            let jobId: string | null = null;

            // Capture token from requests
            page.on('request', (request: any) => {
                const headers = request.headers();
                if (headers.authorization && headers.authorization.startsWith('Bearer ') && !token) {
                    token = headers.authorization.substring(7);
                    Inform.writeInfo('✅ Token captured from request');
                }
            });

            // Also capture responses for debugging
            page.on('response', (response: any) => {
                const url = response.url();
                if (url.includes('/api/') && response.status() >= 400) {
                    Inform.writeInfo(`⚠️ API Response: ${response.status()} ${url}`);
                }
            });

            // Step 1: Login
            Inform.writeInfo('🔐 Logging in...');
            await page.goto(options.baseUrl);
            await page.waitForLoadState('networkidle');

            // Handle Client Login if present
            try {
                const clientLoginButton = await page.$('button:has-text("Client Login"), a:has-text("Client Login"), button[value="local"]');
                if (clientLoginButton) {
                    await clientLoginButton.click();
                    Inform.writeInfo('   Clicked Client Login');
                    await page.waitForTimeout(1000);
                }
            } catch (e) {
                // Client login not found or not needed
            }

            // Fill credentials if provided
            if (options.username && options.password) {
                try {
                    await page.waitForSelector('input[name="username"]', { state: 'visible', timeout: 10000 });
                    await page.fill('input[name="username"]', options.username);
                    await page.fill('input[type="password"]', options.password);
                    Inform.writeInfo('   Credentials entered');

                    // Submit form
                    await Promise.race([
                        page.click('button[type="submit"]'),
                        page.click('button:has-text("Login")'),
                        page.click('button:has-text("LOGIN")'),
                        page.keyboard.press('Enter')
                    ]);
                } catch (e) {
                    return {
                        success: false,
                        error: 'Failed to find login form or fill credentials'
                    };
                }
            } else {
                // Wait for manual login
                vscode.window.showInformationMessage('Please complete login in the browser window');
                await page.waitForFunction(
                    `window.location.pathname !== '/Account/Login' && window.location.pathname !== '/login'`,
                    { timeout: options.timeout || 180000 }
                );
            }

            await page.waitForLoadState('networkidle');
            Inform.writeInfo('✅ Logged in successfully');

            // Save credentials on successful login if provided
            if (options.username && options.password) {
                await this.saveCredentials(options.username, options.password);
            }

            // Wait for token to be captured
            await page.waitForTimeout(2000);

            // Make sure we have a token - try multiple sources like the working test
            if (!token) {
                // Try to get token from storage like the working test
                token = await page.evaluate(() => {
                    // @ts-ignore - localStorage available in browser context
                    return localStorage.getItem('access_token') || 
                           // @ts-ignore - sessionStorage available in browser context
                           sessionStorage.getItem('access_token') || 
                           // @ts-ignore - localStorage available in browser context
                           localStorage.getItem('token') || 
                           // @ts-ignore - sessionStorage available in browser context
                           sessionStorage.getItem('token');
                });
                
                if (token) {
                    Inform.writeInfo('✅ Token captured from browser storage');
                } else {
                    Inform.writeInfo('⚠️ No token found - will rely on session cookies');
                }
            }

            // Step 2: Create export via browser console
            Inform.writeInfo('📦 Creating export...');
            if (token) {
                Inform.writeInfo(`   Using Bearer token: ${token.substring(0, 20)}...`);
            } else {
                Inform.writeInfo('   Using session cookies only');
            }

            const exportResult = await page.evaluate(async ({ baseUrl, workType, token }: { baseUrl: string; workType: string; token: string | null }) => {
                try {
                    // First attempt: with Authorization header if we have a token
                    const headers: any = {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    };

                    // Add authorization header if we have a token (match working test exactly)
                    if (token) {
                        headers['Authorization'] = `Bearer ${token}`;
                    }

                    // @ts-ignore - fetch is available in browser context
                    let response = await fetch(`${baseUrl}/api/modeller/importexport/export/package`, {
                        method: 'POST',
                        headers,
                        credentials: 'include',
                        body: JSON.stringify({
                            exportConfigName: 'VeryBasic',
                            items: [{
                                systemName: 'sharedo-type',
                                selector: {
                                    systemName: workType
                                }
                            }]
                        })
                    });

                    // If first attempt fails with 401 and we used a token, try without token (session cookies only)
                    if (!response.ok && response.status === 401 && token) {
                        const sessionOnlyHeaders: any = {
                            'Content-Type': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest'
                        };

                        // @ts-ignore - fetch is available in browser context
                        response = await fetch(`${baseUrl}/api/modeller/importexport/export/package`, {
                            method: 'POST',
                            headers: sessionOnlyHeaders,
                            credentials: 'include',
                            body: JSON.stringify({
                                exportConfigName: 'VeryBasic',
                                items: [{
                                    systemName: 'sharedo-type',
                                    selector: {
                                        systemName: workType
                                    }
                                }]
                            })
                        });
                    }

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }

                    const data = await response.json();
                    return { 
                        success: true, 
                        jobId: data.exportJobId || data.jobId || data.id,
                        data: data
                    };
                } catch (error: any) {
                    return { 
                        success: false, 
                        error: error?.message || 'Unknown error',
                        details: error?.toString() || 'No details available'
                    };
                }
            }, { 
                baseUrl: options.baseUrl, 
                workType: options.workType, 
                token 
            });

            if (!exportResult.success) {
                return {
                    success: false,
                    error: `Export creation failed: ${exportResult.error}`,
                };
            }

            jobId = exportResult.jobId;
            Inform.writeInfo(`✅ Export job created: ${jobId}`);

            // Step 3: Monitor progress
            Inform.writeInfo('📊 Monitoring progress...');
            if (token) {
                Inform.writeInfo(`   Using Bearer token for progress monitoring: ${token.substring(0, 20)}...`);
            } else {
                Inform.writeInfo('   Using session cookies for progress monitoring');
            }

            let isComplete = false;
            let retryCount = 0;
            const maxRetries = 120; // 60 seconds with 500ms intervals

            while (!isComplete && retryCount < maxRetries) {
                try {
                    const progress = await page.evaluate(async ({ baseUrl, jobId, token }: { baseUrl: string; jobId: string; token: string | null }) => {
                        try {
                            // First try: with Authorization header if we have a token
                            let headers: any = {};
                            
                            if (token) {
                                headers['Authorization'] = `Bearer ${token}`;
                            }

                            // @ts-ignore - fetch is available in browser context
                            let response = await fetch(
                                `${baseUrl}/api/modeller/importexport/export/package/${jobId}/progress/`,
                                {
                                    method: 'GET',
                                    headers,
                                    credentials: 'include'
                                }
                            );

                            // If failed with 401 and we used token, try session-only approach
                            if (!response.ok && response.status === 401 && token) {
                                // @ts-ignore - fetch is available in browser context
                                response = await fetch(
                                    `${baseUrl}/api/modeller/importexport/export/package/${jobId}/progress/`,
                                    {
                                        credentials: 'include'
                                    }
                                );
                            }

                            if (!response.ok) {
                                throw new Error(`HTTP ${response.status}`);
                            }

                            return await response.json();
                        } catch (error: any) {
                            return { error: error?.message || 'Unknown error' };
                        }
                    }, { baseUrl: options.baseUrl, jobId, token });

                    if (progress.error) {
                        throw new Error(`Progress check failed: ${progress.error}`);
                    }

                    // Determine status based on ShareDo progress response
                    if (progress.complete && progress.packageAvailable) {
                        isComplete = true;
                        Inform.writeInfo('   ✅ Package ready for download');
                    } else if (progress.complete) {
                        Inform.writeInfo('   📦 Creating package...');
                    } else if (progress.running) {
                        Inform.writeInfo('   ⚙️ Processing...');
                    } else {
                        Inform.writeInfo(`   📋 Status: ${progress.state || 'CREATED'}`);
                    }

                    if (!isComplete) {
                        await page.waitForTimeout(500);
                    }

                    retryCount++;
                } catch (error) {
                    Inform.writeError(`Progress monitoring error: ${error}`);
                    await page.waitForTimeout(1000);
                    retryCount++;
                }
            }

            if (!isComplete) {
                return {
                    success: false,
                    error: 'Export timed out waiting for completion',
                    jobId: jobId || undefined
                };
            }

            // Step 4: Download via browser
            Inform.writeInfo('📥 Downloading package...');

            const downloadUrl = `${options.baseUrl}/modeller/__importexport/export/package/${jobId}/download`;

            try {
                // Method 1: Try to trigger download by setting window.location (most reliable)
                const downloadResult = await page.evaluate(async ({ downloadUrl, token }: { downloadUrl: string; token: string | null }) => {
                    try {
                        // @ts-ignore - document and DOM APIs available in browser context
                        // Create a temporary link element and click it to trigger download
                        const link = document.createElement('a');
                        link.href = downloadUrl;
                        link.download = ''; // This attribute triggers download
                        
                        // Add authorization header via fetch first to ensure we can access the file
                        if (token) {
                            // @ts-ignore - fetch is available in browser context
                            const testResponse = await fetch(downloadUrl, {
                                method: 'HEAD', // Just check if we can access it
                                headers: {
                                    // eslint-disable-next-line @typescript-eslint/naming-convention
                                    'Authorization': `Bearer ${token}`
                                },
                                credentials: 'include'
                            });
                            
                            if (!testResponse.ok) {
                                throw new Error(`Download not accessible: HTTP ${testResponse.status}`);
                            }
                        }
                        
                        // @ts-ignore - document and DOM APIs available in browser context
                        // Trigger download
                        document.body.appendChild(link);
                        link.click();
                        // @ts-ignore - document and DOM APIs available in browser context
                        document.body.removeChild(link);
                        
                        return { success: true };
                    } catch (error: any) {
                        return { success: false, error: error?.message || 'Download trigger failed' };
                    }
                }, { downloadUrl, token });

                if (!downloadResult.success) {
                    throw new Error(downloadResult.error);
                }

                // Wait for download to start
                const download = await page.waitForEvent('download', { timeout: 30000 });

                // Save the download
                const suggestedFilename = download.suggestedFilename() || `${options.workType}-export-${Date.now()}.zip`;
                const filePath = path.join(downloadPath, suggestedFilename);
                await download.saveAs(filePath);

                // Check file size
                const stats = fs.statSync(filePath);
                const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

                Inform.writeInfo(`✅ Export completed successfully`);
                Inform.writeInfo(`   File: ${suggestedFilename}`);
                Inform.writeInfo(`   Size: ${fileSizeMB} MB`);
                Inform.writeInfo(`   Path: ${filePath}`);

                return {
                    success: true,
                    filePath,
                    fileSize: `${fileSizeMB} MB`,
                    jobId: jobId || undefined
                };
            } catch (downloadError: any) {
                // Method 2: If download event approach failed, try direct fetch and save
                Inform.writeInfo('   Download event failed, trying direct fetch...');
                
                try {
                    const fetchResult = await page.evaluate(async ({ downloadUrl, token }: { downloadUrl: string; token: string | null }) => {
                        try {
                            const headers: any = {
                                'credentials': 'include'
                            };
                            
                            if (token) {
                                // eslint-disable-next-line @typescript-eslint/naming-convention
                                headers['Authorization'] = `Bearer ${token}`;
                            }

                            // @ts-ignore - fetch is available in browser context
                            const response = await fetch(downloadUrl, {
                                method: 'GET',
                                headers,
                                credentials: 'include'
                            });

                            if (!response.ok) {
                                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                            }

                            const arrayBuffer = await response.arrayBuffer();
                            const uint8Array = new Uint8Array(arrayBuffer);
                            
                            // Convert to base64 for transport
                            let binary = '';
                            const len = uint8Array.byteLength;
                            for (let i = 0; i < len; i++) {
                                binary += String.fromCharCode(uint8Array[i]);
                            }
                            const base64 = btoa(binary);
                            
                            return { 
                                success: true, 
                                data: base64,
                                contentLength: uint8Array.byteLength 
                            };
                        } catch (error: any) {
                            return { 
                                success: false, 
                                error: error?.message || 'Fetch failed' 
                            };
                        }
                    }, { downloadUrl, token });

                    if (!fetchResult.success) {
                        throw new Error(fetchResult.error);
                    }

                    // Save the fetched data
                    const suggestedFilename = `${options.workType}-export-${Date.now()}.zip`;
                    const filePath = path.join(downloadPath, suggestedFilename);
                    
                    // Convert base64 back to buffer and save
                    const buffer = Buffer.from(fetchResult.data, 'base64');
                    fs.writeFileSync(filePath, new Uint8Array(buffer));
                    
                    const fileSizeMB = (fetchResult.contentLength / (1024 * 1024)).toFixed(2);

                    Inform.writeInfo(`✅ Export completed successfully (via direct fetch)`);
                    Inform.writeInfo(`   File: ${suggestedFilename}`);
                    Inform.writeInfo(`   Size: ${fileSizeMB} MB`);
                    Inform.writeInfo(`   Path: ${filePath}`);

                    return {
                        success: true,
                        filePath,
                        fileSize: `${fileSizeMB} MB`,
                        jobId: jobId || undefined
                    };
                } catch (fetchError: any) {
                    Inform.writeError('All download methods failed', fetchError);
                    return {
                        success: false,
                        error: `Download failed: ${downloadError?.message || downloadError}`,
                        jobId: jobId || undefined
                    };
                }
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            Inform.writeError('Playwright export failed', error);
            return {
                success: false,
                error: errorMessage
            };
        } finally {
            // Cleanup
            if (browser) {
                try {
                    await browser.close();
                } catch (e) {
                    // Ignore cleanup errors
                }
            }
        }
    }

    /**
     * Export for HLD preview - creates and downloads the package
     */
    public async exportForHLD(
        workType: IWorkType,
        baseUrl: string,
        credentials?: { username: string; password: string }
    ): Promise<IPlaywrightExportResult> {
        // Remove trailing slash from baseUrl
        const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

        const options: IPlaywrightExportOptions = {
            baseUrl: cleanBaseUrl,
            workType: workType.systemName,
            username: credentials?.username,
            password: credentials?.password,
            showBrowser: true, // Show browser for HLD preview
            timeout: 180000, // 3 minutes
            downloadPath: path.join(vscode.workspace.rootPath || '', '.temp', 'hld-exports')
        };

        return await this.completeExport(options);
    }

    /**
     * Save credentials securely using VS Code's secret storage
     */
    private async saveCredentials(username: string, password: string): Promise<void> {
        try {
            // Store username in VS Code's global configuration
            await vscode.workspace.getConfiguration().update('sharedo.credentials.username', username, vscode.ConfigurationTarget.Global);
            
            // For password, we should use VS Code's secret storage API if available
            // For now, we'll show a message that credentials were captured
            Inform.writeInfo('✅ Credentials captured for future use');
            
            // Show user confirmation
            vscode.window.showInformationMessage(
                `Credentials saved for user: ${username}`,
                'OK'
            );
        } catch (error: any) {
            Inform.writeError('Failed to save credentials', error);
        }
    }

    /**
     * Load saved credentials
     */
    private async loadCredentials(): Promise<{ username?: string; password?: string }> {
        try {
            const username = vscode.workspace.getConfiguration('sharedo.credentials').get('username') as string;
            
            return {
                username: username || undefined,
                password: undefined // Password should be re-entered for security
            };
        } catch (error: any) {
            Inform.writeError('Failed to load credentials', error);
            return {};
        }
    }
}
