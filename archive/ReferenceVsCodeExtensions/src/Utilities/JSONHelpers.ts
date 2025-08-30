import { SharedoClient } from "../sharedoClient";
import { TreeNode } from "../treeprovider";
import { getObjectBaseType } from "./common";

/**
 * JSON serialization helper that handles circular references and complex objects
 * Used primarily for serializing favorites and SharedoClient instances
 */
export function replacer(key: string, value: any): any {
	//console.log(key)
	// if (key == "favorites") {

	switch (key) {
		case "promiseManagement":
		case "parent":
		case "k2Server":
		case "workHorse":
		case "context":
			return undefined;
		case "favorites": //sharedoClient causes circular ref, so we need to serialize without it
		 	let item: Array<TreeNode> = value;
		 	let newItem = new Array<any>();
		 	item.forEach(element => {
		 		if (element) {
		 			// Create a serializable copy without the circular reference
		 			let serializedElement = {
		 				id: element.id,
		 				label: element.label,
		 				entityId: element.entityId,
		 				collapsibleState: element.collapsibleState,
		 				type: element.type,
		 				data: element.data,
		 				typeFlags: element.typeFlags,
		 				duplicateNumber: element.duplicateNumber,
		 				icon: element.icon,
		 				additionalData: element.additionalData
		 				// Note: sharedoClient and parent are not serialized to avoid circular references
		 				// They will be restored when the favorites are loaded
		 			};
		 			newItem.push(serializedElement);
		 		}
		 	});
	
		 	return newItem;
		
		default:
			break;
	}

	switch (getObjectBaseType(value)) {
		case "SharedoClient":
			return value;
		default:
			break;
	}
		return value;
}