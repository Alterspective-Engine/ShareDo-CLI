import * as vscode from 'vscode';
import { SharedoClient } from '../../sharedoClient';
import { TreeNode } from '../../treeprovider';
import { downloadFolderItems } from '../File/ExtensionHelpers/fileDownloading';
import { ensureTreePath } from '../File/sharedoIDEFileHelper';
import { getIDEFolderByFilePath, getIDEItemByFilePath } from '../IDE/ideHelper';
import { IPostProcessedSharedoIDEItem, SharedoIDEType } from '../IDE/ISharedoIDERequestResult';
import { SharedoCreateFolderWithTemplateRequestInputs } from './templateCreateRequest';

export async function showTemplateOption(fileUri: vscode.Uri, server: SharedoClient) {

    let ensureResponse = await ensureTreePath(fileUri.fsPath, server);

    let newFolderName = await vscode.window.showInputBox({
         prompt: `Enter a folder name to generate scafolding under: ${ensureResponse?.ideItem.name}\\`,
         value: "" 
        });

    if (newFolderName === undefined) {
        vscode.window.showErrorMessage("No folder name entered - cancelled");
        return;
    }


    let ideItem = ensureResponse?.ideItem;
    if(ideItem === undefined) {
        vscode.window.showErrorMessage("Can't find file in IDE");
        return;
    }

    if(ideItem.type !== SharedoIDEType.folder) {
        vscode.window.showErrorMessage("Can't create template in a file");
        return;
    }

    let items: vscode.QuickPickItem[] = [];
    let templates = await server.getIDETemplates();
    if (templates === undefined || templates.length === 0) {
        vscode.window.showInformationMessage("No templates found");
        return;
    }
    for (let index = 0; index < templates.length; index++) {
        let item = templates[index];
        let newItem: vscode.QuickPickItem = {
            label: item.title,
            description: '',
            detail: '',
            picked: false,
            alwaysShow: true,
        };
        items.push(newItem);
    }

    vscode.window.showQuickPick(items).then(selection => {
        // the user canceled the selection
        console.log("showQuickPick", selection);
        if (!selection) {
            return;
        }

        let selectedTemplate = templates?.find((template) => template.title === selection.label);

        if (selectedTemplate === undefined) {
            vscode.window.showInformationMessage("No template found");
            return;
        }

        vscode.window.showInformationMessage(`Selected: ${selectedTemplate.title} (${selectedTemplate.id})`);

        
        let input: SharedoCreateFolderWithTemplateRequestInputs =
        {
            templateId: selectedTemplate.id,
            parentFolderId: ideItem!.id,
            newFolderName: newFolderName
        };

        server.createTemplate(input).then(async response => {
            if (response?.result) {
                vscode.window.showInformationMessage(`Created: ${response.result.name} (${response.result.id})`);
                let ideResults = await server.getIDE();
                let newFolderPAth = fileUri.fsPath + "/" + newFolderName + "/";

               

                let newIdeItem =  getIDEItemByFilePath(newFolderPAth,ideResults);
                
                if(newIdeItem === undefined) {
                    vscode.window.showErrorMessage("Can't find new folder in IDE");
                    return;
                }

                await downloadFolderItems(newIdeItem, server);

            }
        });
    });
}
