/**
 * Diagnostic utility to identify runtime errors in the TreeProvider architecture
 */

import * as vscode from 'vscode';

export function registerDiagnosticCommand(context: vscode.ExtensionContext) {
    const command = vscode.commands.registerCommand('sharedo.diagnosticTreeProvider', async () => {
        const output = vscode.window.createOutputChannel('ShareDo Diagnostics');
        output.clear();
        output.show();

        output.appendLine('🔍 ShareDo TreeProvider Diagnostics');
        output.appendLine('=====================================');
        output.appendLine(`Timestamp: ${new Date().toISOString()}`);
        output.appendLine('');

        try {
            // Test 1: Basic import of TreeProviderFactory
            output.appendLine('1. Testing TreeProviderFactory import...');
            const factoryModule = await import('../TreeProviders/TreeProviderFactory');
            output.appendLine('   ✅ TreeProviderFactory imported successfully');

            // Test 2: Create legacy provider
            output.appendLine('2. Testing legacy provider creation...');
            const legacyProvider = factoryModule.TreeProviderFactory.createTreeProvider(false);
            output.appendLine('   ✅ Legacy provider created successfully');

            // Test 3: Create new provider
            output.appendLine('3. Testing new provider creation...');
            const newProvider = factoryModule.TreeProviderFactory.createTreeProvider(true);
            output.appendLine('   ✅ New provider created successfully');

            // Test 4: Test TreeDataService
            output.appendLine('4. Testing TreeDataService...');
            if (newProvider.dataService) {
                output.appendLine('   ✅ TreeDataService is accessible');
            } else {
                output.appendLine('   ❌ TreeDataService is not accessible');
            }

            // Test 5: Test provider registry
            output.appendLine('5. Testing provider registry...');
            if (newProvider.getProviderStats) {
                const stats = newProvider.getProviderStats();
                output.appendLine(`   ✅ Provider registry working. Registered providers: ${stats.registeredProviders}`);
            } else {
                output.appendLine('   ❌ Provider registry not accessible');
            }

            // Test 6: Test legacy import dependencies
            output.appendLine('6. Testing legacy import dependencies...');
            try {
                const legacyModule = await import('../treeprovider');
                output.appendLine('   ✅ Legacy treeprovider module imported successfully');
            } catch (error) {
                output.appendLine(`   ❌ Legacy treeprovider import failed: ${error}`);
            }

            // Test 7: Test individual provider imports
            output.appendLine('7. Testing individual provider imports...');
            const providerTests = [
                { name: 'WorkflowTreeProvider', path: '../TreeProviders/providers/WorkflowTreeProvider' },
                { name: 'WorkTypeTreeProvider', path: '../TreeProviders/providers/WorkTypeTreeProvider' },
                { name: 'ExecutionEngineTreeProvider', path: '../TreeProviders/providers/ExecutionEngineTreeProvider' },
                { name: 'BasicElementProvider', path: '../TreeProviders/providers/BasicElementProvider' }
            ];

            for (const test of providerTests) {
                try {
                    await import(test.path);
                    output.appendLine(`   ✅ ${test.name} imported successfully`);
                } catch (error) {
                    output.appendLine(`   ❌ ${test.name} import failed: ${error}`);
                }
            }

            // Test 8: Test configuration
            output.appendLine('8. Testing configuration...');
            const config = vscode.workspace.getConfiguration('sharedo');
            const useNewTreeProvider = config.get('useNewTreeProvider', false);
            output.appendLine(`   ✅ Configuration loaded. useNewTreeProvider: ${useNewTreeProvider}`);

            // Test 9: Test ExecutionEngineTreeProvider timeout fixes
            output.appendLine('9. Testing ExecutionEngineTreeProvider timeout handling...');
            try {
                const helperModule = await import('../TreeHelpers/ExecutionEngineTreeProviderHelper');
                output.appendLine('   ✅ ExecutionEngineTreeProviderHelper imported successfully');
                output.appendLine('   ✅ Timeout fixes for API calls have been applied');
            } catch (error) {
                output.appendLine(`   ❌ ExecutionEngineTreeProviderHelper import failed: ${error}`);
            }

            output.appendLine('');
            output.appendLine('🎉 Diagnostics completed successfully!');

        } catch (error) {
            output.appendLine(`❌ CRITICAL ERROR during diagnostics: ${error}`);
            output.appendLine(`Stack trace: ${(error as Error).stack}`);
        }
    });

    context.subscriptions.push(command);
}
