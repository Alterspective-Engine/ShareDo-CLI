
/**
 * Settings Management Module for ShareDo VS Code Extension
 *
 * This module provides centralized configuration and state management for the ShareDo extension,
 * handling persistence, serialization, and environment management.
 *
 * @responsibilities
 * - Manage extension settings and user preferences
 * - Handle ShareDo environments collection and persistence
 * - Provide configuration constants and folder structures
 * - Serialize and deserialize extension state to VS Code global storage
 *
 * @architecture
 * - Implements ISettings interface for type safety
 * - Uses VS Code ExtensionContext for state persistence
 * - Integrates with SharedoEnvironments for server management
 * - Provides clear separation between settings and business logic
 *
 * @author ShareDo Team
 * @version 0.8.1
 */

import * as vscode from 'vscode';
import { SharedoEnvironments } from './environments';
import { Inform } from './Utilities/inform';
import { replacer } from './Utilities/JSONHelpers';

/**
 * Interface defining the structure of extension settings
 */
export interface ISettings {
	sharedoEnvironments: SharedoEnvironments;
}

/**
 * Configuration constants for file organization
 */
export const DOWNLOAD_IDE_ROOT_FOLDER = "_IDE";
export const DOWNLOAD_WORKFLOW_ROOT_FOLDER = "_Workflow";
export const SETTINGS_FOLDER = "Sharedo";
export const WORKFLOW_SETTINGS_FOLDER = SETTINGS_FOLDER + "/Workflow";

/**
 * Main settings class for managing extension configuration and state
 * 
 * This class handles all aspects of extension settings including persistence,
 * ShareDo environment management, and configuration state.
 */
export class Settings implements ISettings {
	sharedoEnvironments: SharedoEnvironments;

	/**
	 * Creates a new Settings instance
	 * 
	 * @param context - VS Code extension context for state persistence
	 */
	constructor(public context: vscode.ExtensionContext) {
		this.sharedoEnvironments = new SharedoEnvironments();
	}

	/**
	 * Clears all settings and resets to default state
	 * Used for extension reset or cleanup operations
	 */
	public clear(): void {
		this.sharedoEnvironments = new SharedoEnvironments();
	}

	/**
	 * Persists current settings to VS Code global storage
	 * 
	 * Serializes the settings object and stores it in the extension's global state.
	 * Handles serialization errors gracefully and provides error logging.
	 */
	public save(): void {
		try {
			// Serialize settings using custom replacer for complex objects
			const serializedSettings = JSON.stringify(this, replacer);
			
			// Store in VS Code global state
			this.context.globalState.update("settings", serializedSettings);
			
			Inform.writeInfo("Settings saved successfully");
		} catch (error) {
			// Clear settings on serialization error to prevent corruption
			this.context.globalState.update("settings", null);
			Inform.writeError("Error saving settings: " + error);
			console.error("Settings save error:", error);
		}
	}

	/**
	 * Loads settings from VS Code global storage and populates the instance
	 * 
	 * Retrieves stored settings, deserializes them, and restores the extension state.
	 * Handles missing or corrupted settings gracefully with fallback behavior.
	 */
	public populate(): void {
		// Retrieve stored settings from VS Code global state
		const storedData = this.context.globalState.get<string>("settings");
		
		if (storedData && storedData.length > 0) {
			console.log(`Stored settings found - size: ${storedData.length}`);
			Inform.writeInfo(`Loading stored settings (${storedData.length} bytes)`);

			try {
				// Parse stored JSON data
				const parsedData: Settings = JSON.parse(storedData);
				
				if (!parsedData) {
					// No valid data found, save current empty state
					this.save();
				} else {
					// Restore ShareDo environments from stored data
					this.sharedoEnvironments.populate(parsedData.sharedoEnvironments);
					Inform.writeInfo("Settings loaded successfully");
				}
			} catch (error) {
				// Handle corrupted settings data
				Inform.writeError("Failed to parse stored settings: " + error);
				console.error("Settings parse error:", error);
				
				// Reset to clean state and save
				this.sharedoEnvironments.clear();
				this.save();
			}
		} else {
			// No stored data found, initialize with empty state
			Inform.writeInfo("No stored settings found, initializing with defaults");
			this.sharedoEnvironments.clear();
			this.save();
		}
	}
}

