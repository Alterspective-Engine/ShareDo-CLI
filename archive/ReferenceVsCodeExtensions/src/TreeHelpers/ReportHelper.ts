import { showOutputInFile } from "../Utilities/fileManagement";
import { SharedoClient } from "../sharedoClient";


export function generateReportOutput(client: SharedoClient | undefined,actionName:string, data:any) {
	let report = {};
	let actionDate = new Date();
	if(client)
	{
	
	 report = {
		"action": actionName,
		"server": client?.url || "unknown",
		"date": actionDate.toISOString(),
		"data": data
	};
	}
	else
	{
		report = data;	
	}
	showOutputInFile(`${actionName}_${actionDate.toISOString()}.json`, report);
}