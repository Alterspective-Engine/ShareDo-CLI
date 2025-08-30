import { SharedoEnvironments } from "../config/environments";
import { RunningPromiseStatus } from "../enums";
import { RequestBase } from "../Request/ExecutionBase";
import { ISharedoIDEFileCreateInputProperties, SharedoFileCreateRequest } from "../Request/File/fileCreateRequest";
import { SharedoFileDownloadRequest } from "../Request/File/fileDownloadRequest";
import { SharedoFileSaveRequest } from "../Request/File/fileSaveRequest";
import { ISharedoFileResponse } from "../Request/File/IFile";
import { IShareDoAuthorizeResponse } from "../Request/IauthorizeResponse";
import { IDERequest } from "../Request/IDE/ideRequest";
import { IPostProcessedSharedoIDERequestResult, IPostProcessedSharedoIDEItem } from "../Request/IDE/IIDE";
import { SharedoIDETemplateResponse } from "../Request/IDETemplates/IIDETemplate";
import { SharedoCreateFolderWithTemplateRequestInputs, SharedoCreateFolderWithTemplateRequest } from "../Request/IDETemplates/templateCreateRequest";
import { SharedoIDETemplateRequest } from "../Request/IDETemplates/templatesRequest";
import { SharedoWorkflowRequestResult } from "../Request/Workflows/IWorkflow";
import { ISharedoWorkflowsRequestResult } from "../Request/Workflows/IWorkflows";
import { SharedoWorkflowRequestInput, SharedoWorkflowRequest } from "../Request/Workflows/workflowRequest";
import { SharedoWorkflowsRequest } from "../Request/Workflows/workflowsRequest";
import { PromiseManagement, RunningPromise } from "../Utilities/promiseManagement";
import { authenticate } from "./authenticate";

export interface ISharedoClient {
	alias: string | undefined;
	clientSecret: string | undefined;
	clientId: string | undefined;
	url: string;
	tokenEndpoint: string | undefined;
	impersonateUser: string | undefined;
	impersonateProvider: string | undefined;
}

//create defaults for ISharedoClient
export const defaultSharedoClient: ISharedoClient = {
	alias: "hsf-vnext",
	clientSecret: "o+)u,L+Aza,ASL61BV,jJoJIa/Db8N",
	clientId: "VSCodeAppClientCreds",
	url: "https://hsf-vnext.sharedo.co.uk",
	tokenEndpoint: "https://hsf-vnext-identity.sharedo.co.uk/connect/token",
	impersonateUser: "igorj",
	impersonateProvider: "idsrv"
};

export class SharedoClient implements ISharedoClient {
	//interface properties
	alias: string | undefined;
	configured: boolean;
	clientSecret: string | undefined;
	clientId: string | undefined;
	url: string;
	tokenEndpoint: string | undefined;
	impersonateUser: string | undefined;
	impersonateProvider: string | undefined;

	//execution properties
	promiseManagement: PromiseManagement;
	getCatsPromise?: Promise<any[]> | undefined;
	lastRefresh?: Date | undefined;
	isLocalServer: boolean = false;
	_bearer: string | undefined;
	//event management
	// events: EventEmitter;

	hasIssue = {
		hasIssue: false,
		message: ""
	};

	authenticationExpiry: Date | undefined;
	lastAuthorization: IShareDoAuthorizeResponse | undefined;

	//get authentication bearer
	public get authenticationBearer(): string | undefined {
		if (!this.clientId && !this.clientSecret) {
			return undefined;
		}
		return "Basic " + Buffer.from(this.clientId + ":" + this.clientSecret).toString('base64');
	}

	get isAuthenticated(): boolean {
		return this._bearer !== undefined;
	}

	//create the getter
	public async getBearer(): Promise<string | undefined> {
		if (this.authenticationExpiry) {
			//check the token timeout
			let now = new Date();
			if (now > this.authenticationExpiry) {
				//token has expired
				this.lastAuthorization = undefined;
				this._bearer = undefined;
			}
		}
		if (!this._bearer) {
			//we need to get a new token
			return authenticate(this).then((authResponse) => {
				this.lastAuthorization = authResponse;
				this.authenticationExpiry = new Date(Date.now() + (authResponse.expires_in * 1000));
				this._bearer = authResponse.access_token;
				return this._bearer;
			}).catch((err) => {
				// this.events.emit("error", err);
				return Promise.reject(err);
			});
		}
		return this._bearer;
	}



	//#region Constructor - initialization of the object as new or from saves raw JSON
	/**
	 * @param data  data to use to instantiate this class with, this can be SharedoClient json 
	 * @param parent the environment this  Server Client exist
	 */
	constructor(data?: ISharedoClient, parent?: SharedoEnvironments) {

		this.url = "";

		//if we have instance data ( i.e. raw JSON ) then create this instance based of the passed in data
		if (data) {
			Object.assign(this, data);
			// this.events = parent?.events || new EventEmitter();
			this.promiseManagement = new PromiseManagement();
			//this.authenticationExpiry = data.authenticationExpiry ? new Date(data.authenticationExpiry) : undefined;

		}

		// this.events = parent?.events || new EventEmitter();
		this.promiseManagement = new PromiseManagement();
		this.configured = false;
		this.initialize();
	}

	//#region Initialization methods
	/**
	 * 
	 */
	initialize(): void {
		if (this.authenticationBearer && this.authenticationBearer.length > 0) {
			{
				if (this.url.length > 0) {
					this.configured = true;
					this.getIDE();
					this.getWorkflows();
					// this.getCatagories(true);
					// this.getAllProcessesDefinitions(true);
				}
			}
		}
	}

	// public getParentItems(): ServerParentItem[] {
	// 	let retValue: ServerParentItem[] = [];
	// 	retValue = [
	// 		new ServerParentItem(ElementTypes.favorites, ElementTypes.favorites, this),
	// 		new ServerParentItem(ElementTypes.ide, ElementTypes.ide, this),
	// 		new ServerParentItem(ElementTypes.workflows, ElementTypes.workflows, this),
	// 		new ServerParentItem(ElementTypes.errors, ElementTypes.errors, this),
	// 		new ServerParentItem(ElementTypes.workTypes, ElementTypes.workTypes, this)
	// 	];
	// 	return retValue;
	// }

	//#endregion
	//#endregion


	//#region Category Management 
	// * Manages interactions with  folder system ( folders )
	// ! Will need to add Apps management to this at some point in the future

	//get IDE.
	async getIDE(): Promise<IPostProcessedSharedoIDERequestResult | undefined> {
		let executeItem = new IDERequest(this);
		let results = await this.execute<IPostProcessedSharedoIDERequestResult, undefined>(executeItem, true);
		return results;
	}

	async getIDETemplates(): Promise<SharedoIDETemplateResponse | undefined> {
		let executeItem = new SharedoIDETemplateRequest(this);
		let results = await this.execute(executeItem, true);
		return results;

	}

	async createTemplate(sharedoCreateFolderWithTemplateRequestInputs: SharedoCreateFolderWithTemplateRequestInputs) {
		let executeItem = new SharedoCreateFolderWithTemplateRequest(this);
		executeItem.inputProperties = sharedoCreateFolderWithTemplateRequestInputs;
		let results = await this.execute(executeItem, true);
		return results;
	}

	//get IDE File.
	async getIDEFile(file: IPostProcessedSharedoIDEItem): Promise<ISharedoFileResponse | undefined> {
		let executeItem = new SharedoFileDownloadRequest(this);
		executeItem.inputProperties =
		{
			"fileId": file.id,
		};

		let result = this.execute(executeItem, true);
		return result;
	}

	async publishIDEFile(fileId: string, content: string): Promise<ISharedoFileResponse | undefined> {

		let executeItem = new SharedoFileSaveRequest(this);
		executeItem.inputProperties =
		{
			fileId: fileId,
			content: content
		};

		let result = this.execute(executeItem, true);
		return result;


	}

	async createIDEFile(input: ISharedoIDEFileCreateInputProperties): Promise<ISharedoFileResponse | undefined> {

		let executeItem = new SharedoFileCreateRequest(this);
		executeItem.inputProperties = input;
		let result = this.execute(executeItem, true);
		await this.getIDE(); //refresh the local IDE cache
		return result;


	}

	async getWorkflows(): Promise<ISharedoWorkflowsRequestResult | undefined> {
		let executeItem = new SharedoWorkflowsRequest(this);
		let result = this.execute(executeItem, true);
		return result;
	}

	async getWorkflow(sharedoWorkflowRequestInput: SharedoWorkflowRequestInput): Promise<SharedoWorkflowRequestResult | undefined> {
		let executeItem = new SharedoWorkflowRequest(this);
		executeItem.inputProperties = sharedoWorkflowRequestInput;
		let result = this.execute(executeItem, true);
		return result;
	}


	//#endregion



	//#region  Workflow / Process Management


	startWorklfow(k: SharedoClient, startSettings: any) {
		//todo
	}


	/**
	 * Manages execution of returning array items, and their execution promise 
	 * @param resultsObject the array that need to be returned / populated with the results of the function to execute ?prehaps drop this in future
	 * @param functionToExecute the function to execute to populate the array 
	 * @param promiseKey a unique key for the execution promise 
	 * @param clearCache force the clearing of the
	 */
	execute<Result, Inputs>(requestToExecute: RequestBase<Result, Inputs>,
		clearCache: boolean = false, promiseKey?: string): Promise<Result | undefined> {

		if (promiseKey === undefined) {
			//create a hash of settings.inputProperties
			promiseKey = requestToExecute.path + JSON.stringify(requestToExecute.inputProperties);
		}

		let runningPromise = this.promiseManagement.getRunningPromise<Result>(promiseKey);
		if (clearCache) { if (clearCache === true) { runningPromise = undefined; } };

		if (runningPromise) {
			if (runningPromise.status === RunningPromiseStatus.pending) {
				return Promise.resolve(undefined);// Check why this is returning an empty array before
			}
			else if (runningPromise.status = RunningPromiseStatus.resolved) {
				return runningPromise.promise;
			};
		}

		runningPromise = new RunningPromise(promiseKey, requestToExecute);
		this.promiseManagement.upsertRunningPromise(runningPromise);
		runningPromise.execute();

		runningPromise.promise.then(instances => {

			// this.events?.emit("itemAdded", instances);
		});


		// if (resultsObject.length > 0) { return Promise.resolve(resultsObject); };

		return runningPromise.promise;
	}


	// /**
	//  * Manages execution of returning array items, and their execution promise 
	//  * @param resultsObject the array that need to be returned / populated with the results of the function to execute ?prehaps drop this in future
	//  * @param functionToExecute the function to execute to populate the array 
	//  * @param promiseKey a unique key for the execution promise 
	//  * @param clearCache force the clearing of the
	//  */
	// executeGetArrayItems<T>(
	// 	resultsObject: Array<T>,
	// 	functionToExecute: (sharedoClient: SharedoClient) => Promise<T[]>,
	// 	promiseKey: string, clearCache: boolean = false): Promise<T[]> {
	// 	if (!resultsObject) { throw "resultsObject needs to be defined"; };
	// 	let runningPromise = this.promiseManagement.getRunningPromise<T[]>(promiseKey);
	// 	if (clearCache) { if (clearCache == true) {runningPromise = undefined;}; };

	// 	if (runningPromise) {
	// 		if (runningPromise.status === RunningPromiseStatus.pending && resultsObject.length > 0) { return Promise.resolve(resultsObject); }
	// 		else if (runningPromise.status = RunningPromiseStatus.resolved) { return runningPromise.promise; };
	// 	}

	// 	let promise = functionToExecute(this);


	// 	runningPromise = new RunningPromise(promiseKey, );
	// 	this.promiseManagement.upsertRunningPromise(runningPromise);

	// 	promise.then(instances => {

	// 		this.events?.emit("itemAdded", instances);
	// 	});


	// 	if (resultsObject.length > 0) { return Promise.resolve(resultsObject); };

	// 	return promise;
	// }



	//#endregion workflow management

}
