
//this class contains interfaces and class implementations to manage promises 
//this is used to manage a running promise of a call 
//its use is to help when a cal to a promise is made and another call to create the same promise is called
//we then check if we have a promise for that call in flight and return that existing promise
import { EventEmitter } from "events";
import _ from "lodash";
import { RequestBase } from "../Request/ExecutionBase";


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
	promise: Promise<any> ;
	executionCount = 0;
	resolve!: (value: any[] | PromiseLike<any[]>) => void;
	reject!: (reason?: any) => void;

	execute()
	{
		this.executionCount++;
		if(this.status === RunningPromiseStatus.pending || this.status === RunningPromiseStatus.resolved || this.status === RunningPromiseStatus.rejected)
		{
			if(this.hasExpired())
			{
				this.status = RunningPromiseStatus.queue; //put back into queue state
			}
		}

		if(this.status !== RunningPromiseStatus.queue)
		{
			return this.promise; //return the promise that is already running
		}

	
		this.status = RunningPromiseStatus.pending;

		this.requestBase.execute().then((results) => {
			this.status = RunningPromiseStatus.resolved;
			this.resolve(results);
		}).catch((error) => {
			this.status = RunningPromiseStatus.rejected;
			this.reject(error);
		}
		);
	}
	
	hasExpired() : boolean
	{
		if(this.expiryDate)
		{
			return this.expiryDate < new Date();
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
	

	constructor() { }

	getRunningPromise<T>(key: string): RunningPromise<T> | undefined {

		let retValue = this.runningPromises.find(p => p.key === key);
		return retValue;
	}

	getRunningPromiseIndex(key: string) {
		return this.runningPromises.findIndex(p => p.key === key);
	}

	deleteRunningPromise(key: string) {
		let foundRunningPromiseIndex = this.getRunningPromiseIndex(key);
		if (foundRunningPromiseIndex > 0) {
			this.runningPromises.splice(foundRunningPromiseIndex);
		}
	}

	/**
	 * @param newItem  a RunningPromise to be inserted / updated in the running promises array
	 */
	upsertRunningPromise<T>(newItem: RunningPromise<T> | undefined): RunningPromise<T> {

		if (!newItem) {
			throw new Error("newItem is undefined");
		}

		//first see if the promise already exists
		let foundRunningPromiseIndex = this.getRunningPromiseIndex(newItem.key);
		if (foundRunningPromiseIndex > 0) {
			//this.runningPromises.splice(foundRunningPromiseIndex);//TODO: use _
			_.remove(this.runningPromises, (item) => item.key === newItem.key);
		}
		
		this.runningPromises.push(newItem);

		// newItem.promise = newItem.requestBase.execute();
		
		newItem.promise.finally(() => {

			//Automatically delete this promise from manage promises once its fulfilled
			//or do we not so and other call get this complete promise
			//this.deleteRunningPromise(newItem.key)
		});

		newItem.promise.then(() => newItem.status = RunningPromiseStatus.resolved);

		newItem.promise.catch(error => {
			newItem.status = RunningPromiseStatus.rejected;
			console.log("oops" + error);
			this.deleteRunningPromise(newItem.key);
			return Promise.reject(error);
		});

		return newItem;
	}

	/**
	 * @param newItem  a RunningPromise to be inserted / updated in the running promises array
	 */
	upsertRunningPromiseItem<T>(key: string,  requestBase: RequestBase<T,any>,func?: Function,): RunningPromise<T> {

		//first see if the promise already exists
		let foundRunningPromise = this.getRunningPromise<T>(key);
		if (foundRunningPromise) { return foundRunningPromise;};

		let newRunningPromise = new RunningPromise<T>(key,requestBase);

		this.runningPromises.push(newRunningPromise);

		// newRunningPromise.promise = newRunningPromise.requestBase.execute();

		newRunningPromise.promise.finally(() => {
			//Automatically delete this promise from manage promises once its fulfilled
			//this.deleteRunningPromise(newRunningPromise.key)
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


