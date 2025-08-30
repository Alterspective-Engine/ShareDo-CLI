/**
 * ShareDo VS Code Extension - Main Entry Point
 *
 * This module serves as the primary entry point for the ShareDo VS Code extension,
 * handling extension activation, initialization, and core functionality.
 *
 * @responsibilities
 * - Extension lifecycle management (activation/deactivation)
 * - Tree view initialization and refresh management
 * - Core command registration and orchestration
 * - ShareDo server connection management
 * - Settings and configuration management
 *
 * @architecture
 * - Centralizes extension state through global variables
 * - Delegates command registration to specialized modules
 * - Manages tree view creation and refresh cycles
 * - Coordinates with ShareDo client for server interactions
 *
 * @author ShareDo Team
 * @version 0.8.1
 */

// Core VS Code API imports
import * as vscode from 'vscode';
import _ = require('lodash');

// Command registration modules
import { registerExtensionCommands } from './commands/registerCommands';
import { registerSetupWizardCommand } from './commands/SetupWizard';
import { ExecutionEngineCommands } from './commands/executionEngineCommands';
import { FormBuilderCommands } from './commands/formBuilderCommands';
import { ExecutionEngineWorkflowCommands } from './commands/executionEngineWorkflowCommands';
import { WorkflowCommands } from './commands/workflowCommands';
import { CacheCommands } from './commands/cacheCommands';
import { HLDCommands } from './commands/hldCommands';
import { registerConfigurableHLDCommands } from './commands/configurableHldCommands';
import { registerTreeProviderTestCommand } from './commands/treeProviderTestCommand';
import { registerDiagnosticCommand } from './commands/diagnosticCommand';
import { AuthenticationCommands } from './commands/authenticationCommands';

// Core domain models and services
import { Settings } from './settings';
import { SharedoClient } from './sharedoClient';
import { SharedoEnvironments } from './environments';
import { TreeNodeProvider, TreeNode } from './treeprovider';
import { TreeProviderFactory } from './TreeProviders/TreeProviderFactory';
import { ConnectionManager } from './core/ConnectionManager';

// Type definitions and enums
import { ElementTypes } from './enums';
import { ICategory } from './Interfaces/Category';
import { IPostProcessedSharedoIDEItem } from './Request/IDE/ISharedoIDERequestResult';
import { SharedoWorkflowRow } from './Request/Workflows/IWorkflows';
import { ICreatePermission } from './Request/WorkTypes/IGetWorkTypeCreatePermissionResult';
import { GrantCreatePermissionType } from './Request/WorkTypes/GrantCreatePermission';
import { IWorkType } from './Request/WorkTypes/IGetWorkTypesRequestResult';
import { TNodeWorkTypeParticipantRole } from './TreeHelpers/WorkTypesTreeProviderHelper';

// Helper functions and utilities
import { findIDEItemImplementations, getSystemNameFromManifestItem } from './Helpers/findImplementationsHelper';
import { downloadFolderItems, downloadIDEFile } from './Request/File/ExtensionHelpers/fileDownloading';
import { publishFileFolderToServers } from './Request/File/ExtensionHelpers/filePublishing';
import { showTemplateOption } from './Request/IDETemplates/ideTemplatesExtensionHelper';
import { downloadWorkflow } from './Request/Workflows/ExtensionHelpers/workflowDownload';
import { findOptionSetOptionByIdTreeCommand } from './TreeHelpers/OptionSetTreeProviderHelper';
import { generateReportOutput } from './TreeHelpers/ReportHelper';
import { StringWriter, cleanName, getIDERootPath } from './Utilities/common';
import { showOutputInFile } from './Utilities/fileManagement';
import { Inform } from './Utilities/inform';
import { validatePublishServers } from './Utilities/publishUtils';
import { showObjectData, generateSettingsJson } from './Utilities/extensionUtils';

// Performance and monitoring utilities
import { treeCache } from './Utilities/TreeCache';
import { errorMonitor, ErrorSeverity } from './Utilities/ErrorMonitor';

/**
 * Extension identifier prefix used for all ShareDo commands
 */
const extensionPrefix = "sharedo";

/**
 * Global extension state variables
 * These maintain the extension's core state throughout its lifecycle
 */
let terminal: vscode.Terminal; // Terminal instance for command execution
let thisAppSettings: Settings; // Extension settings and configuration
export let treeDataProvider: TreeNodeProvider; // Tree view data provider (exported for global access)

/**
 * Creates and initializes the ShareDo tree view in VS Code's explorer
 * 
 * @param thisEnv - ShareDo environments configuration
 */
function createTreeView(thisEnv: SharedoEnvironments) {
	// Feature flag for new tree provider architecture
	const useNewTreeProvider = vscode.workspace.getConfiguration('sharedo').get('useNewTreeProvider', false);
	
	if (useNewTreeProvider) {
		// Use new refactored tree provider architecture
		const newTreeProvider = TreeProviderFactory.createTreeProvider(true);
		
		// Set the environment for the new provider (if needed)
		if (newTreeProvider.setEnvironment) {
			newTreeProvider.setEnvironment(thisEnv);
		}
		
		// For backward compatibility, store in global variable
		treeDataProvider = newTreeProvider;
		
		// Expose globally for icon refresh functionality
		(globalThis as any).treeDataProvider = treeDataProvider;
		
		// Register the tree view with VS Code
		const treeView = vscode.window.createTreeView('SharedoServers', {
			treeDataProvider: newTreeProvider,
			showCollapseAll: true,
			canSelectMany: false
		});
		
		// Preload data for better performance
		if (newTreeProvider.preloadData) {
			newTreeProvider.preloadData().catch(console.error);
		}
		
		console.log('ShareDo: Using new TreeProvider architecture');
	} else {
		// Use legacy tree provider (default for now)
		treeDataProvider = new TreeNodeProvider(thisEnv);
		
		// Expose globally for icon refresh functionality
		(globalThis as any).treeDataProvider = treeDataProvider;
		
		// Register the tree view with VS Code
		vscode.window.createTreeView('SharedoServers', {
			treeDataProvider: treeDataProvider
		});
		
		console.log('ShareDo: Using legacy TreeProvider');
	}
}

/**
 * Extension activation function - called when extension is first activated
 * 
 * This function initializes the extension, sets up event handlers, registers commands,
 * and establishes the tree view. It serves as the main entry point for all extension functionality.
 * 
 * @param context - VS Code extension context containing subscriptions and state
 */
export async function activate(context: vscode.ExtensionContext) {
	const startTime = Date.now();
	
	// Store context globally for use in commands
	(global as any).sharedoExtensionContext = context;
	
	try {
		// Initialize core extension components
		thisAppSettings = new Settings(context);
		const subscriptions = context.subscriptions;
		
		// Register all extension commands through centralized modules
		registerExtensionCommands(context, extensionPrefix, thisAppSettings);
		registerSetupWizardCommand(context);
		
		// Register execution engine commands
		registerExecutionEngineCommands(context, extensionPrefix);
		
		// Set up ShareDo environments event handlers
		setupEnvironmentEventHandlers(thisAppSettings, context);
		
		// Populate initial settings and show activation message
		thisAppSettings.populate();
		console.log('Congratulations, your extension "ShareDo" is now active!');
		
		// Register core navigation and management commands
		registerCoreCommands(context, extensionPrefix, thisAppSettings);
		
		// Register specialized feature commands
		registerFeatureCommands(context, extensionPrefix, thisAppSettings);
		
		// Register Form Builder commands
		FormBuilderCommands.registerCommands(context, thisAppSettings);

		// Register Workflow commands
		context.subscriptions.push(
			vscode.commands.registerCommand('sharedo.workflow.download', WorkflowCommands.downloadWorkflow),
			vscode.commands.registerCommand('sharedo.workflow.preview', WorkflowCommands.previewWorkflow),
			vscode.commands.registerCommand('sharedo.workflow.validate', WorkflowCommands.validateWorkflow),
			vscode.commands.registerCommand('sharedo.workflow.publish', WorkflowCommands.publishWorkflow),
			vscode.commands.registerCommand('sharedo.workflow.compareWithServer', WorkflowCommands.compareWithServer),
			vscode.commands.registerCommand('sharedo.workflow.compareAcrossServers', WorkflowCommands.compareAcrossServers),
			vscode.commands.registerCommand('sharedo.workflow.batchDownload', WorkflowCommands.batchDownloadWorkflows),
			vscode.commands.registerCommand('sharedo.workflow.search', WorkflowCommands.searchWorkflows),
			vscode.commands.registerCommand('sharedo.workflow.exportDocumentation', WorkflowCommands.exportAsDocumentation),
			vscode.commands.registerCommand('sharedo.workflow.create', WorkflowCommands.createNewWorkflow),
			vscode.commands.registerCommand('sharedo.workflow.list', WorkflowCommands.showWorkflowList)
		);

		// Register Cache commands
		context.subscriptions.push(
			vscode.commands.registerCommand('sharedo.cache.resetServer', CacheCommands.resetServerCache),
			vscode.commands.registerCommand('sharedo.cache.resetAll', CacheCommands.resetAllServersCache),
			vscode.commands.registerCommand('sharedo.cache.configure', CacheCommands.configureCacheSettings),
			vscode.commands.registerCommand('sharedo.cache.status', CacheCommands.showCacheStatus)
		);

		// Initialize HLD cache service
		const { ExportCacheService } = await import('./services/ExportCacheService');
		ExportCacheService.getInstance().initialize(context);
		
		// Register HLD Document Generation commands
		context.subscriptions.push(
			vscode.commands.registerCommand('sharedo.hld.generate', HLDCommands.generateHLD),
			vscode.commands.registerCommand('sharedo.hld.generateBatch', HLDCommands.generateBatchHLD),
			vscode.commands.registerCommand('sharedo.hld.generateWithTemplate', HLDCommands.generateHLDWithTemplate),
			vscode.commands.registerCommand('sharedo.hld.preview', HLDCommands.previewHLD),
			vscode.commands.registerCommand('sharedo.hld.previewWithPlaywright', HLDCommands.previewHLDWithPlaywright),
			vscode.commands.registerCommand('sharedo.hld.clearCache', HLDCommands.clearCache),
			vscode.commands.registerCommand('sharedo.hld.showCacheStatus', HLDCommands.showCacheStatus),
			vscode.commands.registerCommand('sharedo.hld.showPerformanceReport', HLDCommands.showPerformanceReport),
			vscode.commands.registerCommand('sharedo.hld.clearPerformanceMetrics', HLDCommands.clearPerformanceMetrics)
		);
		
		// Register Configurable HLD commands for stakeholder-specific documentation
		registerConfigurableHLDCommands(context);

		// Register Authentication commands for export operations
		AuthenticationCommands.registerCommands(context);

		// Register performance monitoring commands
		registerMonitoringCommands(context, extensionPrefix);
		
		// Register TreeProvider test command for development
		registerTreeProviderTestCommand(context);
		
		// Register diagnostic command for debugging
		registerDiagnosticCommand(context);
		
		// Track activation performance
		errorMonitor.trackPerformance('extension.activate', startTime, true);
		
	} catch (error) {
		errorMonitor.handleError(
			error as Error,
			{ context: 'extension.activate' },
			'Activating ShareDo extension',
			ErrorSeverity.critical
		);
		
		// Track failed activation
		errorMonitor.trackPerformance('extension.activate', startTime, false);
		throw error;
	}
}

/**
 * Sets up event handlers for ShareDo environments
 * Manages tree refresh, error handling, and server lifecycle events
 * 
 * @param thisAppSettings - Application settings instance
 * @param context - VS Code extension context
 */
function setupEnvironmentEventHandlers(thisAppSettings: Settings, context: vscode.ExtensionContext) {
	// Handle when servers are populated
	thisAppSettings.sharedoEnvironments.populatedEvent(() => {
		refreshTree(thisAppSettings, context);
		vscode.window.showInformationMessage('Sharedo Server(s) populated');
	});

	// Handle server removal
	thisAppSettings.sharedoEnvironments.itemRemovedEvent(() => {
		treeDataProvider.refresh();
		vscode.window.showInformationMessage('Sharedo Server removed');
	});

	// Handle environment errors
	thisAppSettings.sharedoEnvironments.errorEvent((error) => {
		let errorMessage = "There was an error:";
		if (error && error.message) {
			errorMessage = errorMessage + " " + error.message;
		}
		vscode.window.showErrorMessage(errorMessage, error);
	});

	// Handle server addition
	thisAppSettings.sharedoEnvironments.itemAddedEvent(() => {
		if (!treeDataProvider) { 
			refreshTree(thisAppSettings, context); 
		}
		treeDataProvider.refresh();
		thisAppSettings.save();
	});
}

/**
 * Registers core navigation and management commands
 * These commands handle basic server operations and tree navigation
 * 
 * @param context - VS Code extension context
 * @param extensionPrefix - Command prefix for the extension
 * @param thisAppSettings - Application settings instance
 */
function registerCoreCommands(context: vscode.ExtensionContext, extensionPrefix: string, thisAppSettings: Settings) {
	// Server deployment management
	vscode.commands.registerCommand(`${extensionPrefix}.addToDeploy`, (node: TreeNode) => { 
		thisAppSettings.sharedoEnvironments.addToDeployToServers(node.sharedoClient); 
	});
	
	vscode.commands.registerCommand(`${extensionPrefix}.removeFromDeploy`, (node: TreeNode) => { 
		thisAppSettings.sharedoEnvironments.removeFromDeployServer(node.sharedoClient); 
	});
	
	vscode.commands.registerCommand(`${extensionPrefix}.removeServer`, (node: TreeNode) => { 
		thisAppSettings.sharedoEnvironments.removeServer(node.sharedoClient); 
	});
	
	// Connection management
	vscode.commands.registerCommand(`${extensionPrefix}.connect`, async () => { 
		const connectionManager = new ConnectionManager(
			thisAppSettings as any, // Cast to avoid type issues
			{ emit: () => {}, on: () => {} } as any // Mock EventBus for now
		);
		connectionManager.setLegacyDependencies(thisAppSettings, thisAppSettings.sharedoEnvironments);
		const success = await connectionManager.connectToServer(context);
		if (success) {
			refreshTree(thisAppSettings, context);
		}
	});
	
	// Utility commands
	vscode.commands.registerCommand(`${extensionPrefix}.generateSettingsJson`, () => { 
		generateSettingsJson(); 
	});
}

/**
 * Registers specialized feature commands
 * These commands handle advanced functionality like workflows, work types, and file operations
 * 
 * @param context - VS Code extension context
 * @param extensionPrefix - Command prefix for the extension
 * @param thisAppSettings - Application settings instance
 */
function registerFeatureCommands(context: vscode.ExtensionContext, extensionPrefix: string, thisAppSettings: Settings) {
	// Continuous deployment file watcher
	vscode.commands.registerCommand(`${extensionPrefix}.continueDeploy`, () => {
		try {
			setupContinuousDeploymentWatcher(context, thisAppSettings);
			vscode.window.showInformationMessage('Continuous deployment watcher started');
		} catch (error) {
			// Log error for debugging
			console.error('Failed to setup continuous deployment:', error);
			
			// Show user-friendly error message
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			vscode.window.showErrorMessage(`Failed to start continuous deployment: ${errorMessage}`);
		}
	});

	// Workflow operations
	vscode.commands.registerCommand(`${extensionPrefix}.downloadWorkflow`, async (node: TreeNode) => {
		try {
			// Validate node data before processing
			if (!node || !node.data) {
				throw new Error('Invalid node or node data');
			}
			
			const workflowItem = node.data as SharedoWorkflowRow;
			
			// Validate workflow item has required properties
			if (!workflowItem?.data?.systemName) {
				throw new Error('Workflow system name not found');
			}
			
			if (!node.sharedoClient) {
				throw new Error('ShareDo client not initialized');
			}
			
			await downloadWorkflow(workflowItem.data.systemName, node.sharedoClient);
			vscode.window.showInformationMessage(`Workflow '${workflowItem.data.systemName}' downloaded successfully`);
		} catch (error) {
			// Log error for debugging
			console.error('Failed to download workflow:', error);
			
			// Show user-friendly error message
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			vscode.window.showErrorMessage(`Failed to download workflow: ${errorMessage}`);
			
			// Track error for monitoring
			if (typeof errorMonitor !== 'undefined') {
				errorMonitor.handleError(
					error as Error,
					{ command: 'downloadWorkflow', node: node?.label },
					'Downloading workflow',
					ErrorSeverity.high
				);
			}
		}
	});

	vscode.commands.registerCommand(`${extensionPrefix}.compairWorkflowToLocal`, () => { 
		vscode.window.showInformationMessage('Not Implemented Yet'); 
	});

	vscode.commands.registerCommand(`${extensionPrefix}.compairToLocal`, () => { 
		vscode.window.showInformationMessage('Not Implemented Yet'); 
	});

	// Work type permission management
	registerWorkTypePermissionCommands(extensionPrefix, thisAppSettings);

	// File and folder operations
	registerFileOperationCommands(extensionPrefix, thisAppSettings);

	// Search and utility operations
	vscode.commands.registerCommand(`${extensionPrefix}.findOptionSetOptionById`, (node: TreeNode) => { 
		try {
			// Validate node before processing
			if (!node) {
				throw new Error('Invalid node provided');
			}
			findOptionSetOptionByIdTreeCommand(node);
		} catch (error) {
			// Log error for debugging
			console.error('Failed to find option set option:', error);
			
			// Show user-friendly error message
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			vscode.window.showErrorMessage(`Failed to find option: ${errorMessage}`);
		}
	});

	vscode.commands.registerCommand(`${extensionPrefix}.notImplementedYet`, async (node: TreeNode) => { 
		vscode.window.showInformationMessage("Not Implemented Yet"); 
	});

	// Template generation
	vscode.commands.registerCommand(`${extensionPrefix}.generateTemplatedFolder`, async (file: vscode.Uri) => {
		try {
			// Validate file URI before processing
			if (!file || !file.fsPath) {
				throw new Error('Invalid file URI provided');
			}
			
			await generateTemplatedFolderHandler(file, thisAppSettings);
			vscode.window.showInformationMessage('Template generated successfully');
		} catch (error) {
			// Log error for debugging
			console.error('Failed to generate templated folder:', error);
			
			// Show user-friendly error message
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			vscode.window.showErrorMessage(`Failed to generate template: ${errorMessage}`);
		}
	});

	vscode.commands.registerCommand(`${extensionPrefix}.retryError`, async (node: TreeNode) => { 
		showObjectData(node); 
		thisAppSettings.save(); 
	});
}

/**
 * Sets up continuous deployment file watcher for the _IDE folder
 * Monitors file changes and automatically publishes to configured servers
 * 
 * @param context - VS Code extension context
 * @param thisAppSettings - Application settings instance
 */
function setupContinuousDeploymentWatcher(context: vscode.ExtensionContext, thisAppSettings: Settings) {
	try {
		// Validate workspace folders exist
		if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
			throw new Error('No workspace folder is open. Please open a workspace to enable continuous deployment.');
		}
		
		// Get workspace path for monitoring
		const workspacePath = getIDERootPath();
		
		// Validate workspace path
		if (!workspacePath) {
			throw new Error('Unable to determine workspace path for IDE root');
		}
		
		// Create file watcher pattern for all files in _IDE folder
		const pattern = new vscode.RelativePattern(vscode.workspace.workspaceFolders[0], '_IDE/**/*.*');
		const watcher = vscode.workspace.createFileSystemWatcher(pattern, false, false, false);

		// Handle file changes with error handling
		watcher.onDidChange(async e => {
			try {
				vscode.window.showInformationMessage(`File changed: ${e.fsPath}`);
				if (validatePublishServers(thisAppSettings.sharedoEnvironments)) {
					await publishFileFolderToServers(e.path, thisAppSettings);
				}
			} catch (error) {
				console.error('Error handling file change:', error);
				vscode.window.showErrorMessage(`Failed to publish changed file: ${error instanceof Error ? error.message : 'Unknown error'}`);
			}
		});

		// Handle file creation with error handling
		watcher.onDidCreate(async e => {
			try {
				vscode.window.showInformationMessage(`File created: ${e.fsPath}`);
				if (validatePublishServers(thisAppSettings.sharedoEnvironments)) {
					await publishFileFolderToServers(e.path, thisAppSettings);
				}
			} catch (error) {
				console.error('Error handling file creation:', error);
				vscode.window.showErrorMessage(`Failed to publish created file: ${error instanceof Error ? error.message : 'Unknown error'}`);
			}
		});

		// Handle file deletion with error handling
		watcher.onDidDelete(e => {
			try {
				vscode.window.showInformationMessage(`File deleted: ${e.fsPath}`);
				// TODO: Implement server-side file deletion with proper error handling
			} catch (error) {
				console.error('Error handling file deletion:', error);
				vscode.window.showErrorMessage(`Failed to handle file deletion: ${error instanceof Error ? error.message : 'Unknown error'}`);
			}
		});

		// Ensure watcher is disposed when extension deactivates
		context.subscriptions.push(watcher);
	} catch (error) {
		// Log the error and re-throw to be handled by the calling function
		console.error('Failed to setup continuous deployment watcher:', error);
		throw error;
	}
}

/**
 * Registers work type permission management commands
 * 
 * @param extensionPrefix - Command prefix for the extension
 * @param thisAppSettings - Application settings instance
 */
function registerWorkTypePermissionCommands(extensionPrefix: string, thisAppSettings: Settings) {
	// Remove create permission from current work type
	vscode.commands.registerCommand(`${extensionPrefix}.removeCreatePermissionCurrentWorkTypes`, async (node: TreeNode) => {
		const workTypeSystemName = node.parent?.parent?.data.systemName;
		if (!workTypeSystemName) {
			vscode.window.showErrorMessage("Work Type System Name not found");
			return;
		}
		
		const data = node.data as { createPermission: ICreatePermission, workType: IWorkType };
		const type: GrantCreatePermissionType = data.createPermission.subjectType === "team" 
			? GrantCreatePermissionType.team 
			: GrantCreatePermissionType.user;
		
		try {
			await node.sharedoClient.removeCreatePermission(workTypeSystemName, data.createPermission.subjectId, type);
			vscode.window.showInformationMessage('Permission Removed');
			treeDataProvider.refresh();
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to remove permission: ${error}`);
		}
	});

	// Remove create permission from current and derived work types
	vscode.commands.registerCommand(`${extensionPrefix}.removeCreatePermissionFromCurrentAndDerivedWorkTypes`, async (node: TreeNode) => {
		const workTypeSystemName = node.parent?.parent?.data.systemName;
		if (!workTypeSystemName) {
			vscode.window.showErrorMessage("Work Type System Name not found");
			return;
		}
		
		const data = node.data as { createPermission: ICreatePermission, workType: IWorkType };
		const type: GrantCreatePermissionType = data.createPermission.subjectType === "team" 
			? GrantCreatePermissionType.team 
			: GrantCreatePermissionType.user;
		
		try {
			const promises = [
				node.sharedoClient.removeCreatePermission(workTypeSystemName, data.createPermission.subjectId, type),
				node.sharedoClient.removeCreatePermissionToDerivedTypes(workTypeSystemName, data.createPermission.subjectId, type, true)
			];
			
			await Promise.all(promises);
			vscode.window.showInformationMessage('Permission Removed');
			treeDataProvider.refresh();
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to remove permissions: ${error}`);
		}
	});

	// Grant create permission to derived work types
	vscode.commands.registerCommand(`${extensionPrefix}.grantCreatePermissionToDerivedWorkTypes`, async (node: TreeNode) => {
		const workTypeSystemName = node.parent?.parent?.data.systemName;
		if (!workTypeSystemName) {
			vscode.window.showErrorMessage("Work Type System Name not found");
			return;
		}
		
		const data = node.data as { createPermission: ICreatePermission, workType: IWorkType };
		const type: GrantCreatePermissionType = data.createPermission.subjectType === "team" 
			? GrantCreatePermissionType.team 
			: GrantCreatePermissionType.user;
		
		try {
			await node.sharedoClient.grantCreatePermissionToDerivedTypes(
				workTypeSystemName, 
				data.createPermission.subjectId, 
				type, 
				true
			);
			vscode.window.showInformationMessage('Permission Granted');
			treeDataProvider.refresh();
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to grant permission: ${error}`);
		}
	});

	// Copy permissions from type to derived types
	vscode.commands.registerCommand(`${extensionPrefix}.copyPermissionsFromTypeToDerivedTypes`, async (node: TreeNode) => {
		const workTypeSystemName = node.parent?.parent?.data.systemName;
		if (!workTypeSystemName) {
			vscode.window.showErrorMessage("Work Type System Name not found");
			return;
		}
		
		const data = node.data as TNodeWorkTypeParticipantRole;
		try {
			await node.sharedoClient.copyPermissionsFromTypeToDerivedTypes(workTypeSystemName, data.participantRole.systemName);
			vscode.window.showInformationMessage('Permissions Copied');
			treeDataProvider.refresh();
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to copy permissions: ${error}`);
		}
	});
}

/**
 * Registers file and folder operation commands
 * 
 * @param extensionPrefix - Command prefix for the extension
 * @param thisAppSettings - Application settings instance
 */
function registerFileOperationCommands(extensionPrefix: string, thisAppSettings: Settings) {
	// Work type management
	vscode.commands.registerCommand(`${extensionPrefix}.openWorkTypeManagement`, async (node: TreeNode) => {
		const data: IWorkType = node.data;
		const url = `${node.sharedoClient.url}/modeller/sharedoTypes/${data.systemName}`;
		vscode.env.openExternal(vscode.Uri.parse(url));
	});

	// Find implementations
	vscode.commands.registerCommand(`${extensionPrefix}.findImplementations`, async (node: TreeNode) => {
		const ideItem = node.data as IPostProcessedSharedoIDEItem;
		const systemName = await getSystemNameFromManifestItem(ideItem, node.sharedoClient);
		
		vscode.window.showInformationMessage(`Searching for Implementations of ${systemName}`);
		
		try {
			const items = await findIDEItemImplementations(systemName, node.sharedoClient);
			
			if (!items || items.length === 0) { 
				vscode.window.showInformationMessage(`No Implementations Found`); 
				return; 
			}
			
			vscode.window.showInformationMessage(`Found ${items.length} Implementations`);
			
			for (const item of items) {
				vscode.window.showInformationMessage(`Workflow: ${item.workflowId} - ${item.steps.length} steps`);
			}
		} catch (error) {
			vscode.window.showErrorMessage(`Error finding implementations: ${error}`);
		}
	});

	// Download operations
	vscode.commands.registerCommand(`${extensionPrefix}.download`, (node: TreeNode) => {
		vscode.window.showInformationMessage('Downloading File');
		const ideItem = node.data as IPostProcessedSharedoIDEItem;
		downloadIDEFile(ideItem, node.sharedoClient);
	});

	vscode.commands.registerCommand(`${extensionPrefix}.downloadFolder`, (node: TreeNode) => {
		vscode.window.showInformationMessage('Downloading Folder and File Contents');
		const ideItem = node.data as IPostProcessedSharedoIDEItem;
		downloadFolderItems(ideItem, node.sharedoClient);
	});

	// Refresh operations
	vscode.commands.registerCommand(`${extensionPrefix}.refreshAll`, async (node: TreeNode) => {
		thisAppSettings.sharedoEnvironments.forEach(server => {
			server.initialize();
		});
		treeDataProvider.refresh();
	});
}

/**
 * Registers monitoring and debugging commands
 * These commands help with performance monitoring and error debugging
 * 
 * @param context - VS Code extension context
 * @param extensionPrefix - Command prefix for the extension
 */
function registerMonitoringCommands(context: vscode.ExtensionContext, extensionPrefix: string) {
	// Show error statistics
	vscode.commands.registerCommand(`${extensionPrefix}.showErrorStats`, async () => {
		const stats = errorMonitor.getErrorStats();
		const message = `Total Errors: ${stats.totalErrors}\nRecent Errors: ${stats.recentErrors.length}`;
		vscode.window.showInformationMessage(message, 'Show Details', 'Export Debug Info')
			.then(choice => {
				if (choice === 'Show Details') {
					showObjectData(stats as any);
				} else if (choice === 'Export Debug Info') {
					errorMonitor.exportDebugInfo();
				}
			});
	});

	// Show performance statistics
	vscode.commands.registerCommand(`${extensionPrefix}.showPerformanceStats`, async () => {
		const stats = errorMonitor.getPerformanceStats();
		const message = `Avg Response Time: ${stats.averageResponseTime}ms\nOperations Tracked: ${Object.keys(stats.operationStats).length}`;
		vscode.window.showInformationMessage(message, 'Show Details')
			.then(choice => {
				if (choice === 'Show Details') {
					showObjectData(stats as any);
				}
			});
	});

	// Clear cache
	vscode.commands.registerCommand(`${extensionPrefix}.clearCache`, () => {
		treeCache.clear();
		vscode.window.showInformationMessage('Tree cache cleared successfully');
	});

	// Show cache stats
	vscode.commands.registerCommand(`${extensionPrefix}.showCacheStats`, () => {
		const stats = treeCache.getStats();
		const message = `Cache Hit Rate: ${(stats.hitRate * 100).toFixed(1)}%\nCache Size: ${stats.size} entries`;
		vscode.window.showInformationMessage(message, 'Show Details')
			.then(choice => {
				if (choice === 'Show Details') {
					showObjectData(stats as any);
				}
			});
	});

	// NEW COMMANDS: Technical Debt Management and Development Tools

	// Scan for technical debt and TODO items
	vscode.commands.registerCommand(`${extensionPrefix}.scanTechnicalDebt`, async () => {
		if (!vscode.workspace.workspaceFolders) {
			vscode.window.showErrorMessage('No workspace folder found');
			return;
		}

		try {
			vscode.window.showInformationMessage('Scanning workspace for technical debt...');
			
			const cleanupManagerModule = await import('./Utilities/CodeCleanupManager');
			const cleanupManager = new cleanupManagerModule.CodeCleanupManager(vscode.workspace.workspaceFolders[0].uri.fsPath);
			
			await cleanupManager.scanWorkspace();
			
			const report = cleanupManager.generateTechnicalDebtReport();
			const todoItems = cleanupManager.getTodoItems();
			const recommendations = cleanupManager.getCleanupRecommendations();
			
			vscode.window.showInformationMessage(
				`Scan complete! Found ${todoItems.length} TODO items and ${recommendations.length} cleanup recommendations`,
				'View Report', 'Interactive Cleanup'
			).then(async choice => {
				if (choice === 'View Report') {
					const doc = await vscode.workspace.openTextDocument({
						content: report,
						language: 'markdown'
					});
					vscode.window.showTextDocument(doc);
				} else if (choice === 'Interactive Cleanup') {
					await cleanupManager.showInteractiveCleanup();
				}
			});
		} catch (error) {
			vscode.window.showErrorMessage(`Technical debt scan failed: ${(error as Error).message}`);
		}
	});

	// Security manager - API key management
	vscode.commands.registerCommand(`${extensionPrefix}.manageApiKeys`, async () => {
		try {
			const securityManagerModule = await import('./Utilities/SecurityManager');
			
			if (!securityManagerModule.SecurityManager.getInstance) {
				// Initialize security manager if not already done
				securityManagerModule.SecurityManager.initialize(context.secrets);
			}
			
			const securityManager = securityManagerModule.SecurityManager.getInstance();
			
			const action = await vscode.window.showQuickPick([
				{ label: 'Add API Key', description: 'Store a new API key for a server', action: 'add' },
				{ label: 'Remove API Key', description: 'Remove an existing API key', action: 'remove' },
				{ label: 'Test API Key', description: 'Test an existing API key', action: 'test' }
			], {
				placeHolder: 'Select API key management action',
				ignoreFocusOut: true
			});

			if (!action) {
				return;
			}

			switch (action.action) {
				case 'add':
					const serverUrl = await vscode.window.showInputBox({
						prompt: 'Enter ShareDo server URL',
						placeHolder: 'https://your-server.com',
						ignoreFocusOut: true
					});
					
					if (serverUrl) {
						await securityManager.promptAndStoreApiKey(serverUrl);
					}
					break;

				case 'remove':
					const urlToRemove = await vscode.window.showInputBox({
						prompt: 'Enter ShareDo server URL to remove API key for',
						placeHolder: 'https://your-server.com',
						ignoreFocusOut: true
					});
					
					if (urlToRemove) {
						await securityManager.removeApiKey(urlToRemove);
						vscode.window.showInformationMessage(`API key removed for ${urlToRemove}`);
					}
					break;

				case 'test':
					const urlToTest = await vscode.window.showInputBox({
						prompt: 'Enter ShareDo server URL to test API key for',
						placeHolder: 'https://your-server.com',
						ignoreFocusOut: true
					});
					
					if (urlToTest) {
						const hasKey = await securityManager.hasApiKey(urlToTest);
						if (hasKey) {
							vscode.window.showInformationMessage(`✅ API key found for ${urlToTest}`);
						} else {
							vscode.window.showWarningMessage(`❌ No API key found for ${urlToTest}`);
						}
					}
					break;
			}
		} catch (error) {
			vscode.window.showErrorMessage(`API key management failed: ${(error as Error).message}`);
		}
	});

	// Command registry management
	vscode.commands.registerCommand(`${extensionPrefix}.showCommandRegistry`, async () => {
		try {
			const commandRegistryModule = await import('./core/CommandRegistry');
			const registry = commandRegistryModule.CommandRegistry.getInstance();
			
			const report = registry.generateRegistrationReport();
			const stats = registry.getExecutionStats();
			
			const doc = await vscode.workspace.openTextDocument({
				content: report,
				language: 'markdown'
			});
			
			vscode.window.showTextDocument(doc);
			vscode.window.showInformationMessage(
				`Command Registry: ${stats.totalCommands} commands, ${stats.activeExecutions} active executions`
			);
		} catch (error) {
			vscode.window.showErrorMessage(`Command registry display failed: ${(error as Error).message}`);
		}
	});

	// Development workflow automation
	vscode.commands.registerCommand(`${extensionPrefix}.runDevelopmentChecks`, async () => {
		if (!vscode.workspace.workspaceFolders) {
			vscode.window.showErrorMessage('No workspace folder found');
			return;
		}

		try {
			vscode.window.showInformationMessage('Running development quality checks...');
			
			const developmentWorkflowModule = await import('./core/DevelopmentWorkflowManager');
			const workflowManager = new developmentWorkflowModule.DevelopmentWorkflowManager(vscode.workspace.workspaceFolders[0].uri.fsPath);
			
			await workflowManager.initialize();
			const checksPass = await workflowManager.runPreCommitChecks();
			
			if (checksPass) {
				vscode.window.showInformationMessage('✅ All development checks passed!');
			} else {
				vscode.window.showWarningMessage('⚠️ Some development checks failed. See output for details.');
			}
		} catch (error) {
			vscode.window.showErrorMessage(`Development checks failed: ${(error as Error).message}`);
		}
	});

	// Automated code cleanup
	vscode.commands.registerCommand(`${extensionPrefix}.runAutomatedCleanup`, async () => {
		if (!vscode.workspace.workspaceFolders) {
			vscode.window.showErrorMessage('No workspace folder found');
			return;
		}

		try {
			const developmentWorkflowModule2 = await import('./core/DevelopmentWorkflowManager');
			const workflowManager = new developmentWorkflowModule2.DevelopmentWorkflowManager(vscode.workspace.workspaceFolders[0].uri.fsPath);
			
			await workflowManager.initialize();
			await workflowManager.runAutomatedCleanup();
			
		} catch (error) {
			vscode.window.showErrorMessage(`Automated cleanup failed: ${(error as Error).message}`);
		}
	});
}

/**
 * Handles template folder generation with server selection
 * 
 * @param file - URI of the file to generate templates for
 * @param thisAppSettings - Application settings instance
 */
async function generateTemplatedFolderHandler(file: vscode.Uri, thisAppSettings: Settings) {
	const items: vscode.QuickPickItem[] = [];
	
	// Build server selection list
	for (let i = 0; i < thisAppSettings.sharedoEnvironments.length; i++) {
		const env = thisAppSettings.sharedoEnvironments.getItem(i);
		items.push({ label: env.url });
	}
	
	// Show server selection dialog
	const selectedQuickPick = await vscode.window.showQuickPick(items, { 
		canPickMany: false, 
		placeHolder: "Select Server" 
	});
	
	if (!selectedQuickPick) {
		vscode.window.showErrorMessage("No Server Selected");
		return;
	}
	
	// Find selected server
	const selectedServer = thisAppSettings.sharedoEnvironments.getServerByUrl(selectedQuickPick.label);
	if (!selectedServer) {
		vscode.window.showErrorMessage("Server not found");
		return;
	}

	// Generate template
	showTemplateOption(file, selectedServer);
}

/**
 * Utility functions for extension management
 */

/**
 * Generates a class structure for a ShareDo folder and its contents
 * 
 * @param folder - Category folder to process
 * @param sharedoClient - ShareDo client instance
 * @param writer - String writer for output
 * @returns Promise resolving to generated class string
 */
async function generateClassForFolder(
	folder: ICategory, 
	sharedoClient: SharedoClient,
	writer: StringWriter
): Promise<string> {
	// Validate input parameters
	if (!folder) {
		throw new Error('Folder parameter is required');
	}
	
	if (!sharedoClient) {
		throw new Error('ShareDo client is required');
	}
	
	if (!writer) {
		throw new Error('String writer is required');
	}
	
	const folderCleanName = _.capitalize(cleanName(folder.displayName || "unknown"));
	let classString = "";
	const errors: string[] = [];

	try {
		// Process folder items with individual error handling
		let items: any[] = [];
		try {
			items = await sharedoClient.getCategoryItems(folder);
		} catch (itemError) {
			const errorMsg = `Failed to get items for folder '${folder.displayName}': ${itemError instanceof Error ? itemError.message : 'Unknown error'}`;
			console.error(errorMsg);
			errors.push(errorMsg);
		}
		
		for (const folderItem of items) {
			try {
				// Process individual folder item (implementation depends on requirements)
				// TODO: Add actual processing logic here
			} catch (itemProcessError) {
				const errorMsg = `Failed to process item in folder '${folder.displayName}': ${itemProcessError instanceof Error ? itemProcessError.message : 'Unknown error'}`;
				console.error(errorMsg);
				errors.push(errorMsg);
				// Continue processing other items
			}
		}

		// Process subfolders recursively with individual error handling
		let subFolders: ICategory[] = [];
		try {
			subFolders = await sharedoClient.getCategorySubFolders(folder);
		} catch (subFolderError) {
			const errorMsg = `Failed to get subfolders for '${folder.displayName}': ${subFolderError instanceof Error ? subFolderError.message : 'Unknown error'}`;
			console.error(errorMsg);
			errors.push(errorMsg);
		}
		
		for (const subFolder of subFolders) {
			try {
				await generateClassForFolder(subFolder, sharedoClient, writer);
			} catch (recursiveError) {
				const errorMsg = `Failed to process subfolder '${subFolder.displayName}': ${recursiveError instanceof Error ? recursiveError.message : 'Unknown error'}`;
				console.error(errorMsg);
				errors.push(errorMsg);
				// Continue processing other subfolders
			}
		}
		
		// If there were errors, optionally notify the user
		if (errors.length > 0) {
			console.warn(`Processed folder '${folder.displayName}' with ${errors.length} error(s)`);
		}
	} catch (error) {
		// Log critical error and re-throw
		const errorMsg = `Critical error processing folder '${folder.displayName}': ${error instanceof Error ? error.message : 'Unknown error'}`;
		console.error(errorMsg);
		throw new Error(errorMsg);
	}

	return classString;
}

/**
 * Opens a workflow in the K2 Manager interface
 * 
 * @param node - Tree node containing workflow data
 */
function openWorkflowInK2Manager(node: TreeNode) {
	const id = node.data; // TODO: Ensure this contains the correct workflow ID
	const url = `${node.sharedoClient.url}/management/?id=${id}`;
	vscode.env.openExternal(vscode.Uri.parse(url));
}

/**
 * Refreshes the ShareDo tree view
 * 
 * @param settings - Extension settings
 * @param context - VS Code extension context
 */
function refreshTree(settings: Settings, context: vscode.ExtensionContext) {
	if (settings.sharedoEnvironments) { 
		createTreeView(settings.sharedoEnvironments); 
	}
	settings.save();
}

/**
 * Registers execution engine related commands
 * 
 * @param context - VS Code extension context
 * @param extensionPrefix - Command prefix for extension
 */
function registerExecutionEngineCommands(context: vscode.ExtensionContext, extensionPrefix: string) {
	// Start manual execution
	context.subscriptions.push(vscode.commands.registerCommand(
		`${extensionPrefix}.startManualExecution`,
		(node?: TreeNode) => ExecutionEngineCommands.startManualExecution(node)
	));

	// Cancel execution
	context.subscriptions.push(vscode.commands.registerCommand(
		`${extensionPrefix}.cancelExecution`,
		(node?: TreeNode) => ExecutionEngineCommands.cancelExecution(node)
	));

	// Show execution details
	context.subscriptions.push(vscode.commands.registerCommand(
		`${extensionPrefix}.showExecutionDetails`,
		(node?: TreeNode) => ExecutionEngineCommands.showExecutionDetails(node)
	));

	// Refresh execution monitoring
	context.subscriptions.push(vscode.commands.registerCommand(
		`${extensionPrefix}.refreshExecutionMonitoring`,
		() => ExecutionEngineCommands.refreshExecutionMonitoring()
	));

	// Show advisor issues
	context.subscriptions.push(vscode.commands.registerCommand(
		`${extensionPrefix}.showAdvisorIssues`,
		(node?: TreeNode) => ExecutionEngineCommands.showAdvisorIssues(node)
	));

	// Export execution statistics
	context.subscriptions.push(vscode.commands.registerCommand(
		`${extensionPrefix}.exportExecutionStatistics`,
		(node?: TreeNode) => ExecutionEngineCommands.exportExecutionStatistics(node)
	));

	// Download workflow code for executing plan
	context.subscriptions.push(vscode.commands.registerCommand(
		`${extensionPrefix}.downloadWorkflowCode`,
		(node?: TreeNode) => ExecutionEngineWorkflowCommands.downloadWorkflowCode(node)
	));

	// Download all executing workflows
	context.subscriptions.push(vscode.commands.registerCommand(
		`${extensionPrefix}.downloadAllExecutingWorkflows`,
		(node?: TreeNode) => ExecutionEngineWorkflowCommands.downloadAllExecutingWorkflows(node)
	));

	// Show workflow code for executing plan
	context.subscriptions.push(vscode.commands.registerCommand(
		`${extensionPrefix}.showWorkflowCode`,
		(node?: TreeNode) => ExecutionEngineWorkflowCommands.showWorkflowCode(node)
	));
}

/**
 * Extension deactivation function - called when extension is deactivated
 * Cleanup function for extension shutdown
 */
export function deactivate() {
	// Cleanup resources if needed
}