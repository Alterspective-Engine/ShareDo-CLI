
import { ArrayHelper } from "./arrayHelper";

export function cleanName(name: string): string {
	name = name.replace(/[^a-z0-9]/gi, '');
	return name;
}

export function titleCase(str: string) {


	str = str.replace(/_/g, " ");
	str = str.replace(/\./g, " ");

	var splitStr = str.split(' ');
	for (var i = 0; i < splitStr.length; i++) {
		// You do not need to check if i is larger than splitStr length, as your for does that for you
		// Assign it back to the array
		splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);

	}
	// Directly return the joined string
	return splitStr.join(' ');
}

//** finds the display name in an object */
export function findDisplayName(item: any): string | undefined {
	let keys = Object.keys(item);
	let retValue: string | undefined = "";
	retValue = keys.find(k => k.toLowerCase().includes("display") && k.toLowerCase().includes("name"));
	if (retValue) {return retValue;}

	retValue = keys.find(k => k.toLowerCase() === "name");
	if (retValue) {return retValue;}

	retValue = keys.find(k => k.toLowerCase() === "id");
	if (retValue) {return retValue;}

}




export function getObjectBaseType(obj: any) {
	if (obj)
		{if (obj.constructor)
			{if (obj.constructor.name)
				{return obj.constructor.name;}}}

	return "unknown";

}

export class NamedArrayItem<T>
{
	arraySetName: string;
	items: Array<T>;

	constructor(arraySetName: string, data?: Array<T>) {
		this.arraySetName = arraySetName;
		this.items = new Array<T>();
		if (data)
			{this.items = data;}
	}
}

export class NamedArray<T>
{
	items: NamedArrayItem<T>[];

	constructor(data?: NamedArray<T>) {
		this.items = new Array<NamedArrayItem<T>>();
		if (data) {
			this.items = data.items;
		}
	}

	/**
	 * Add or updates an item to an named array and return the items in the names array
	 * @param arraySetName 
	 * @param item 
	 * @param uniqueProperty a proeprty of T that makes it unqiue in the array set
	 */
	public upsertItem(arraySetName: string, item: T, uniqueProperty: string): Array<T> {
		let arraySet = this.items.find(i => i.arraySetName === arraySetName);
		if (!arraySet) {
			arraySet = new NamedArrayItem(arraySetName);
			this.items.push(arraySet);
		}
		let itemAsAny: any = item;
		ArrayHelper.upsert<T>(arraySet.items, item, x => x[uniqueProperty] === itemAsAny[uniqueProperty]);
		return arraySet.items;
	}

	/**
	 * Add or updates an item to an named array and return the items in the names array
	 * @param arraySetName 
	 * @param item 
	 * @param uniqueProperty a proeprty of T that makes it unqiue in the array set
	 */
	public upsertArraySet(arraySetName: string, uniqueProperty: string): Array<T> {
		let arraySet = this.items.find(i => i.arraySetName === arraySetName);
		if (!arraySet) {
			arraySet = new NamedArrayItem(arraySetName);
			this.items.push(arraySet);
		}
		return arraySet.items;
	}

}
