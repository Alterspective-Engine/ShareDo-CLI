

import { getWorkflowsRootPath } from '../../../config/config';
import { SharedoClient } from '../../../server/sharedoClient';
import { Inform } from '../../../Utilities/inform';
import fs from 'fs';

export async function downloadWorkflow(systemName: string, server: SharedoClient) {

    try {

        Inform.writeInfo(`Downloading workflow [${systemName}]`);
        //ensure there is a folder in the project called workflows
        Inform.writeInfo(`Ensuring workflows folder exists`);
        let rootFolder = getWorkflowsRootPath();
        let filePath = rootFolder + "/";
        let workflowRootPath = filePath;
         fs.mkdirSync(workflowRootPath);


        

        let startTime = new Date().getTime();

        //download the workflow
        let sharedoWorkflowRequestResult = await server.getWorkflow({ systemName: systemName });
        if (sharedoWorkflowRequestResult === undefined) {
            Inform.writeError("Error downloading workflow");
            return;
        }

        let endTime = new Date().getTime();
        let timeTaken = endTime - startTime;
        Inform.writeInfo(`Downloaded workflow [${systemName}] in ${timeTaken}ms`);



        //write the workflow to the file
        let fileName = systemName + ".json";
        let workflowFileSaveURI =filePath  + systemName + ".json";

        //check if file exists and ask if they want to overwrite
        let fileExists = false;
        try {
            fileExists = fs.statSync(workflowFileSaveURI).isFile();
        } catch (e) {
            Inform.writeInfo(`File does not exist`);
        }

        
        if (fileExists) {
   
            //compair the file contents
            let fileContent = fs.readFileSync (workflowFileSaveURI);
            let existingFileContents = fileContent.toString();
            
            let existingFileAsObject = JSON.parse(existingFileContents);
          
    
            //compare the objects
            if (JSON.stringify(existingFileAsObject) === JSON.stringify(sharedoWorkflowRequestResult)) {
                Inform.writeInfo(`Workflow [${systemName}] already exists and is the same, skipping`);
                return;
            }

            Inform.writeInfo(`File already exists and is different to server, validate overwrite`)
            // let overwrite = await vscode.window.showWarningMessage("File already exists, overwrite?", "Yes", "No");
            // if (overwrite === "No") {
            //     Inform.writeInfo(`User chose not to overwrite`);
            //     return;
            // }
            // Inform.writeInfo(`User chose to overwrite`);
        
            var currentdate = new Date(); 
        var datetime = currentdate.getDate() + "_"
                + (currentdate.getMonth()+1)  + "_" 
                + currentdate.getFullYear() + " @ "  
                + currentdate.getHours() + ":"  
                + currentdate.getMinutes() + ":" 
                + currentdate.getSeconds();
        let currentDateTime = `${datetime}` ;
        //set the new (.old) file name
        let oldFileName = `${fileName}_${currentDateTime}_.old`;
        let oldFile = filePath + oldFileName;
        //try to rename the file
        try {
             fs.renameSync(workflowFileSaveURI, oldFile);
        } catch (e) {
            Inform.writeError(`Could not rename [${fileName}] to [${oldFileName}] : ${e}`);
            return;
        }



        }

        //write the file

        try {

            let fileContent = Buffer.from(JSON.stringify(sharedoWorkflowRequestResult, null, 4));
            fs.writeFileSync(workflowFileSaveURI, fileContent);
            Inform.writeSuccess(`Workflow [${systemName}] saved to [${workflowFileSaveURI}]`);
        } catch (e) {
          
            Inform.writeError("Error writing file: " + e);
        }
    } catch (e) {
        Inform.writeError("Error downloading workflow: " + e);
    }



}
