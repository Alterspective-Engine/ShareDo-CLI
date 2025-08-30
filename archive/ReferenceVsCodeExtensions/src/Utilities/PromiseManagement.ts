//this class contains interfaces and class implementations to manage promises 
//this is used to manage a running promise of a call 
//its use is to help when a cal to a promise is made and another call to create the same promise is called
//we then check if we have a promise for that call in flight and return that existing promise
import { EventEmitter } from "events";
import _ = require("lodash");
import { IBaseTTL, RequestBase } from "../Execution/ExecutionBase";
import { IExecutionBaseResult } from "../Execution/IExecutionBaseResult";

// Utility function for logging
function logInfo(module: string, func: string, message: string, context?: any) {
    console.log(`[INFO] [${module}::${func}] ${message}`, context || '');
}

function logError(module: string, func: string, message: string, error?: Error) {
    console.error(`[ERROR] [${module}::${func}] ${message}`, error?.stack || error || '');
}

export enum RunningPromiseStatus {
	pending,
	resolved,
	rejected,
	queue
}


export interface IRunningPromiseCacheResult<R> {
	results: Promise<R[]>,
	runningPromise: RunningPromise<R[]>
}

interface IResultsObjectPredicate<R> {
	(value: R, index: number, array: R[]): boolean
}


interface ICallback<R> {
	(result: R[], error?: Error): void;
}

/** 
 * A running promise has a key that needs to be unique to the call it is waiting for.
 */
export class RunningPromise<T>
{
	key: string;
	status: RunningPromiseStatus;
	expiryDate: Date | undefined;
	requestBase: RequestBase<any, any>;
	promise: Promise<IExecutionBaseResult<T>> ;
	executionCount = 0;
	resolve!: (value: IExecutionBaseResult<T>) => void;
	reject!: (reason?: any) => void;

	execute() 
	{
		this.executionCount++;
		logInfo('RunningPromise', 'execute', `Executing promise with key: ${this.key}`, { status: this.status, executionCount: this.executionCount });

		if (this.status === RunningPromiseStatus.pending || this.status === RunningPromiseStatus.resolved || this.status === RunningPromiseStatus.rejected)
		{
			if (this.hasExpired())
			{
				logInfo('RunningPromise', 'execute', `Promise with key: ${this.key} has expired. Resetting to queue state.`);
				this.status = RunningPromiseStatus.queue; //put back into queue state
			}
		}

		if (this.status !== RunningPromiseStatus.queue)
		{
			logInfo('RunningPromise', 'execute', `Returning already running promise for key: ${this.key}`);
			return this.promise; //return the promise that is already running
		}

	
		this.status = RunningPromiseStatus.pending;

		this.requestBase.execute().then((results) => {
			logInfo('RunningPromise', 'execute', `Promise with key: ${this.key} resolved successfully.`);
			this.status = RunningPromiseStatus.resolved;
			this.resolve(results);
		}).catch((error) => {
			logError('RunningPromise', 'execute', `Promise with key: ${this.key} rejected.`, error);
			this.status = RunningPromiseStatus.rejected;
			this.reject(error);
		}
		);
	}
	
	hasExpired() : boolean
	{
		if(this.expiryDate)
		{
			const expired = this.expiryDate < new Date();
			if (expired) {
				logInfo('RunningPromise', 'hasExpired', `Promise with key: ${this.key} has expired.`);
			}
			return expired;
		}
		return true;
	}
	
	/**
	 * @param key  unique key for the promise 
	 * @param promise the promise to manage
	 */
	constructor(
		 key: string,
		 requestBase: RequestBase<any, any>
		) {
			this.key=key;
			this.status = RunningPromiseStatus.queue;
			this.requestBase = requestBase;
			this.promise = new Promise((resolve, reject) => {
				this.resolve = resolve;
				this.reject = reject;
			});
			
			

		if(requestBase) //get expiry from the configuration of the request object
		{
			this.expiryDate =  new Date(Date.now()+ requestBase.ttl);
		}
		else
		{
			this.expiryDate =  new Date(Date.now()+1000); //nothing set then expire 
		}
		
	}
}


export class PromiseManagement {

	private runningPromises = new Array<RunningPromise<any>>();
	

	constructor(public events: EventEmitter) { }

	getRunningPromise<T>(key: string): RunningPromise<T> | undefined {

		let retValue = this.runningPromises.find(p => p.key === key);
		return retValue;
	}

	getRunningPromiseIndex(key: string) {
		return this.runningPromises.findIndex(p => p.key === key);
	}

	deleteRunningPromise(key: string) {
		const foundRunningPromiseIndex = this.getRunningPromiseIndex(key);
		if (foundRunningPromiseIndex >= 0) {
			logInfo('PromiseManagement', 'deleteRunningPromise', `Deleting running promise with key: ${key}`);
			this.runningPromises.splice(foundRunningPromiseIndex, 1);
		} else {
			logInfo('PromiseManagement', 'deleteRunningPromise', `No running promise found with key: ${key} to delete.`);
		}
	}

	/**
	 * @param newItem  a RunningPromise to be inserted / updated in the running promises array
	 */
	upsertRunningPromise<T>(newItem: RunningPromise<T> | undefined): RunningPromise<T> {

		if (!newItem) {
			const errorMessage = "newItem is undefined";
			logError('PromiseManagement', 'upsertRunningPromise', errorMessage);
			throw new Error(errorMessage);
		}

		logInfo('PromiseManagement', 'upsertRunningPromise', `Upserting running promise with key: ${newItem.key}`);

		const foundRunningPromiseIndex = this.getRunningPromiseIndex(newItem.key);
		if (foundRunningPromiseIndex >= 0) {
			logInfo('PromiseManagement', 'upsertRunningPromise', `Removing existing running promise with key: ${newItem.key}`);
			_.remove(this.runningPromises, (item) => item.key === newItem.key);
		}
		
		this.runningPromises.push(newItem);

		newItem.promise.finally(() => {
			logInfo('PromiseManagement', 'upsertRunningPromise', `Promise with key: ${newItem.key} has completed.`);
		});

		newItem.promise.then(() => {
			logInfo('PromiseManagement', 'upsertRunningPromise', `Promise with key: ${newItem.key} resolved.`);
			newItem.status = RunningPromiseStatus.resolved;
		});

		newItem.promise.catch((error) => {
			logError('PromiseManagement', 'upsertRunningPromise', `Promise with key: ${newItem.key} encountered an error.`, error);
			newItem.status = RunningPromiseStatus.rejected;
			this.deleteRunningPromise(newItem.key);
		});

		return newItem;
	}

	/**
	 * @param newItem  a RunningPromise to be inserted / updated in the running promises array
	 */
	upsertRunningPromiseItem<T>(key: string,  requestBase: RequestBase<T,any>,func?: Function,): RunningPromise<T> {

		//first see if the promise already exists
		let foundRunningPromise = this.getRunningPromise<T>(key);
		if (foundRunningPromise) {
			logInfo('PromiseManagement', 'upsertRunningPromiseItem', `Found existing running promise with key: ${key}`);
			return foundRunningPromise;
		};

		logInfo('PromiseManagement', 'upsertRunningPromiseItem', `Creating new running promise with key: ${key}`);
		let newRunningPromise = new RunningPromise<T>(key,requestBase);

		this.runningPromises.push(newRunningPromise);

		newRunningPromise.promise.finally(() => {
			logInfo('PromiseManagement', 'upsertRunningPromiseItem', `Promise with key: ${newRunningPromise.key} has completed.`);
		});
		return newRunningPromise;
	}

	// populateObjectWithResults<I, R>(executionObject: RequestBase<R, I>,
	// 	promiseKey: string, resultsObject: Array<R>, resultsObjectPredicate: IResultsObjectPredicate<R> | null, parentObject: any, clearCache: boolean = false,
	// 	callback: ICallback<R>): IRunningPromiseCacheResult<R> | undefined {

	// 	let runningPromise: RunningPromise<R[]> | undefined = this.getRunningPromise<R[]>(promiseKey);
	// 	if (clearCache === true) { runningPromise = undefined; };

	// 	let itemsToReturn: R[];

	// 	if (!runningPromise) {
	// 		//No running promise so execute the call to get the items 
	// 		let promise = executionObject.execute();
	// 		runningPromise = new RunningPromise(promiseKey, executionObject);
	// 		this.upsertRunningPromise(runningPromise);
	// 		//when the results come back pupu;ate the results object and emit caller to do update of ui
	// 		promise.then(results => {
	// 			if (resultsObjectPredicate) {
	// 				let indexToRemove = [];
	// 				resultsObject.filter(resultsObjectPredicate).forEach(itemToRemove => {
	// 					let itemToRemoveOfAny: any = itemToRemove;
	// 					let idx = _.findIndex(resultsObject, itemToRemoveOfAny);
	// 					resultsObject.splice(idx, 1);
	// 					//indexToRemove.push(idx)

	// 				});



	// 			}
	// 			else {
	// 				resultsObject.splice(0, resultsObject.length);
	// 			}
	// 			results.forEach(item => {
	// 				let anyItem: any = item;
	// 				if (parentObject) { anyItem.parent = parentObject;};
	// 				resultsObject.push(anyItem);
	// 			});

	// 			if (resultsObjectPredicate) {
	// 				itemsToReturn = resultsObject.filter(resultsObjectPredicate);
	// 			}
	// 			callback(resultsObject);
	// 		});
	// 	}
	// 	//after execution if we have cached items then return thoes while we wait for the results to come


	// 	if (resultsObjectPredicate) {
	// 		itemsToReturn = resultsObject.filter(resultsObjectPredicate);
	// 		//return { results: Promise.resolve(itemsToReturn), runningPromise: runningPromise }
	// 	}
	// 	else {
	// 		itemsToReturn = resultsObject;
	// 	}


	// 	if (itemsToReturn.length === 0) {
	// 		return {
	// 			results: runningPromise.promise,
	// 			runningPromise: runningPromise
	// 		};
	// 	}
	// 	else {
	// 		return {
	// 			results: Promise.resolve(resultsObject),
	// 			runningPromise: runningPromise
	// 		};
	// 	};
	// }





}


