
import { SortDirection } from "../enums";


export namespace ArrayHelper {

	export function upsert<T>(array: Array<T>, item: any, predicate: (value: any, index: number, obj: T[]) => unknown, thisArg?: any) {
		let existingItem = array.find(predicate);
		if (existingItem) { existingItem = item; }
		else { array.push(item); }
	}

}

/**
 * Sorts a TreeNode by its label in alphabetical order
 * Call this method passing in a array of TreeNodes
 * @param treeNodeArray an array of TreeNodes to be sorted
 */
export function sortArrayBy(array: any[], property: string, direction: SortDirection = SortDirection.descending) {
	return array.sort((a, b) => {

		if (!a[property]) {
			throw new Error(`Cannot sort array, property ${property} does not exist in object ${a.constructor.name}`);

		}

		let as = a[property];
		let bs = b[property];

		if (direction == SortDirection.ascending) {
			if (as < bs) { return -1; }
			if (as > bs) { return 1; }
		}
		else {
			if (as > bs) { return -1; }
			if (as < bs) { return 1; }
		}
		return 0;
	});
}



/**
 * Sorts a TreeNode by its label in alphabetical order
 * Call this method passing in a array of TreeNodes
 * @param treeNodeArray an array of TreeNodes to be sorted
 */
export function sortArrayByDateProperty<T>(array: any[], property: string, direction: SortDirection = SortDirection.descending): T[] {
	return array.sort((a, b) => {

		if (!a[property]) { throw new Error(`Cannot sort array, property ${property} does not exist in object ${a.constructor.name}`); }

		let as = new Date(Date.parse(a[property])).getTime();
		let bs = new Date(Date.parse(b[property])).getTime();

		if (direction == SortDirection.ascending) { return as - bs; }
		else { return bs - as; }


	});
}
