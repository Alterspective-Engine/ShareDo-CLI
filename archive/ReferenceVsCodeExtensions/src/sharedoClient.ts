/**
 * Implementation of a K2 Server that implements the functions that can be executed against the K2 Server 
 * ? This class is the interface between the vs code extension ( tree view and commands etc ) and the service 
 * ? This class could be separated into its own NPM package and referenced so we could potentially use this in other
 * ? projects that need rest based K2 server management capabilities
 */


import EventEmitter = require("events");
// import { FileType, Uri } from "vscode";
import { authenticate } from "./Authentication/authenticate";
import { ElementTypes, RunningPromiseStatus } from "./enums";
import { SharedoEnvironments } from "./environments";
import { RequestBase } from "./Execution/ExecutionBase";
import { ICategory, ICategoryItem } from "./Interfaces/Category";
import { ServerParentItem } from "./Interfaces/Server";
import { ISharedoIDEFileCreateInputProperties, SharedoFileCreateRequest } from "./Request/File/fileCreateRequest";
import { SharedoFileDownloadRequest } from "./Request/File/fileDownloadRequest";
import { SharedoFileSaveRequest } from "./Request/File/fileSaveRequest";
import { ISharedoFileResponse } from "./Request/File/ISharedoFileResponse";
import { IShareDoAuthorizeResponse } from "./Request/IauthorizeResponse";
import { IDERequest } from "./Request/IDE/ideRequest";
import { IPostProcessedSharedoIDEItem, IPostProcessedSharedoIDERequestResult, ISharedoIDERequestResult, SharedoIDEType } from "./Request/IDE/ISharedoIDERequestResult";
import { SharedoIDETemplateResponse } from "./Request/IDETemplates/IIDETemplate";
import { SharedoCreateFolderWithTemplateRequest, SharedoCreateFolderWithTemplateRequestInputs } from "./Request/IDETemplates/templateCreateRequest";
import { SharedoIDETemplateRequest } from "./Request/IDETemplates/templatesRequest";
import { SharedoWorkflowRequestResult } from "./Request/Workflows/IWorkflow";
import { ISharedoWorkflowsRequestResult, SharedoWorkflowRow } from "./Request/Workflows/IWorkflows";
import { SharedoWorkflowRequest, SharedoWorkflowRequestInput } from "./Request/Workflows/workflowRequest";
import { SharedoWorkflowsRequest } from "./Request/Workflows/workflowsRequest";
// import { TreeNode } from "./treeprovider";
import { PromiseManagement, RunningPromise } from "./Utilities/PromiseManagement";
import { IExecutionBaseResult } from "./Execution/IExecutionBaseResult";
import { ListViewRequest } from "./Request/ListViews/listViewRequest";
import { DeleteUserRequest } from "./Request/Users/Delete/DeleteUserRequest";
import { IListViewFilterItem } from "./Request/ListViews/IListViewInput";
import { IShareDoUser } from "./Interfaces/IShareDoUser";
import { GetUserRequest } from "./Request/Users/Get/GetUserRequest";
import { IGetUserResponse } from "./Request/Users/Get/IGetUserResponse";
import { ServerEmmitType, IServerEvent, IServerEventPublishingFolder, IServerEventPublishingFilesUpdated, IServerEventPublishingFileCompleted as IServerEventPublishingFile } from "./Interfaces/IEmmit";
import { IGetWorkTypesRequestResult, IWorkType } from "./Request/WorkTypes/IGetWorkTypesRequestResult";
import { GetWorkTypesRequest } from "./Request/WorkTypes/GetWorkTypesRequest";
import { GetWorkTypeCreatePermissions } from "./Request/WorkTypes/GetWorkTypeCreatePermissions";
import { GrantCreatePermissionType, GrantCreatePermission } from "./Request/WorkTypes/GrantCreatePermission";
import { IGetWorkTypeCreatePermissionResult } from "./Request/WorkTypes/IGetWorkTypeCreatePermissionResult";
import { RemoveCreatePermission } from "./Request/WorkTypes/RemoveCreatePermission";
import { Func } from "mocha";
import { CopyPermissionsFromType } from "./Request/ParticipantRoles/CopyPermissionsFromType";
import { GetWorkTypeGetParticipantRoles } from "./Request/ParticipantRoles/GetParticipantRoles";
import { IModellerAspectSections, IGetWorkTypeAspectsRequestResult } from "./Request/Aspects/IGetWorkTypeAspectsRequest";
import { GetWorkTypeAspectsRequest } from "./Request/Aspects/GetWorkTypeAspectsRequest";
import { IOptionsSet, GetOptionsSetsRequest } from "./Request/OptionSets/GetOptionsSetsRequest";
import { generateOptionSets } from "./TreeHelpers/OptionSetTreeProviderHelper";
import { GetOptionSetOptionsRequest as GetOptionSetInfoRequest } from "./Request/OptionSets/GetOptionSetOptionsRequest";
import { IOptionSetInfo } from "./Request/OptionSets/IOptionSet";
import { SharedoWorkflowExecutingRequest } from "./Request/Workflows/plansExecutingRequest";
import { IPlansExecutingRequestResult } from "./Request/Workflows/IPlanExecuting";
import { GetExecutingPlansEnhanced, IExecutingPlansResponse } from "./Request/ExecutionEngine/GetExecutingPlans";
import { StartManualExecution, IManualExecutionResponse } from "./Request/ExecutionEngine/StartManualExecution";
import { CancelExecution, ICancelExecutionResponse } from "./Request/ExecutionEngine/CancelExecution";
import { GetAdvisorIssues, IAdvisorIssue } from "./Request/ExecutionEngine/GetAdvisorIssues";
import { FormbuilderListRequest } from "./Request/FormBuilder/formbuilderListRequest";
import { FormbuilderLoadRequest } from "./Request/FormBuilder/formbuilderLoadRequest";
import { IFormBuilderRequestResult } from "./Request/FormBuilder/IFormBuilderRequestResult";




export class SharedoClient {
   
   
	//interface properties
	configured: boolean;
	username: string | undefined;
	password: string | undefined;
	clientSecret: string | undefined;
	clientId: string | undefined;
	url: string;
	apiKey: string | undefined;
	parent?: SharedoEnvironments | undefined;
	//execution properties
	promiseManagement: PromiseManagement;
	getCatsPromise?: Promise<any[]> | undefined;
	lastRefresh?: Date | undefined;
	isLocalServer: boolean = false;
	//event management
	events: EventEmitter;

	hasIssue = {
		hasIssue: false,
		message: ""
	};


	favorites: any[];
	//OLDER
	categories: any[];
	categoryItems: any[];
	errorLogs: any[];


	authenticationExpiry: Date | undefined;
	lastAuthorization: IShareDoAuthorizeResponse | undefined;
	tokenEndpoint: string | undefined;
	ideResult: IPostProcessedSharedoIDERequestResult | undefined;
	ideTemplates: SharedoIDETemplateResponse | undefined;
	workflows: SharedoWorkflowRow[];
	impersonateUser: string | undefined;
	impersonateProvider: string | undefined;
	
	workTypes: IGetWorkTypesRequestResult | undefined;
	formBuilders: IFormBuilderRequestResult[] | undefined;
	


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

	_bearer: string | undefined;
	//create a property
	// private _bearer: string | undefined;
	//create the getter
	/**
	 * Generic request method for making API calls
	 */
	public async makeRequest(options: {
		method: 'GET' | 'POST' | 'PUT' | 'DELETE';
		path: string;
		body?: any;
		headers?: any;
	}): Promise<any> {
		try {
			// Get authentication token
			const bearer = await this.getBearer();
			if (!bearer) {
				throw new Error('Not authenticated');
			}

			// Build full URL
			const fullUrl = `${this.url}${options.path}`;

			// Prepare headers
			const headers: any = {
				'Authorization': `Bearer ${bearer}`,
				'Content-Type': 'application/json'
			};

			// Add any custom headers
			if (options.headers) {
				Object.assign(headers, options.headers);
			}
			
			// Log request details for /progress endpoints
			if (options.path.includes('/progress')) {
				console.log('📡 Making progress request:');
				console.log(`   Method: ${options.method}`);
				console.log(`   URL: ${fullUrl}`);
				console.log(`   Headers: ${JSON.stringify({
					...headers,
					'Authorization': `Bearer ${bearer.substring(0, 20)}...` // Truncate token for security
				}, null, 2)}`);
				if (options.body) {
					console.log(`   Body: ${JSON.stringify(options.body, null, 2)}`);
				}
			}

			// Use the axios library which is already imported
			const axios = require('axios');
			
			const requestConfig: any = {
				method: options.method,
				url: fullUrl,
				headers: headers
			};

			if (options.body) {
				requestConfig.data = options.body;
			}

			const response = await axios(requestConfig);
			
			// Log response for /progress endpoints
			if (options.path.includes('/progress')) {
				console.log('✅ Progress response received:');
				console.log(`   Status: ${response.status} ${response.statusText}`);
				console.log(`   Data: ${JSON.stringify(response.data, null, 2)}`);
			}
			
			return response.data;

		} catch (error: any) {
			// Enhanced error logging for /progress endpoints
			if (options.path.includes('/progress')) {
				console.error('❌ Progress request failed:');
				console.error(`   Path: ${options.path}`);
				if (error.response) {
					console.error(`   Status: ${error.response.status} ${error.response.statusText}`);
					console.error(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
				} else {
					console.error(`   Error: ${error.message}`);
				}
			} else {
				console.error('makeRequest failed:', error);
			}
			// Return null instead of throwing to match existing pattern
			return null;
		}
	}

	public async getBearer(): Promise<string | undefined> {
		try {
			// Validate authentication expiry
			if (this.authenticationExpiry) {
				//check the token timeout
				let now = new Date();
				if (now > this.authenticationExpiry) {
					// Token has expired - clear authentication state
					console.info('Authentication token has expired, refreshing...');
					this.lastAuthorization = undefined;
					this._bearer = undefined;
				}
			}
			
			// Check if bearer token needs to be obtained
			if (!this._bearer) {
				//we need to get a new token
				return authenticate(this).then((authResponse) => {
					this.lastAuthorization = authResponse;
					this.authenticationExpiry = new Date(Date.now() + (authResponse.expires_in * 1000));
					this._bearer = authResponse.access_token;
					return this._bearer;
				}).catch((err) => {
					this.events.emit("error", err);
					return Promise.reject(err);
				});
			}
			return this._bearer;
		} catch (error) {
			console.error('Error in getBearer:', error);
			this.events.emit("error", error);
			return Promise.reject(error);
		}
	}

	public getBaseUrl(): string {
		return this.url;
	}



	//#region Constructor - initialization of the object as new or from saves raw JSON
	/**
	 * @param data  data to use to instantiate this class with, this can be SharedoClient json 
	 * @param parent the environment this  Server Client exist
	 */
	constructor(data?: SharedoClient, parent?: SharedoEnvironments) {
		this.errorLogs = new Array<any>();
		this.parent = parent;
		this.events = parent?.events || new EventEmitter();
		this.promiseManagement = new PromiseManagement(this.events);
		this.workflows = new Array<any>();
		this.favorites = new Array<any>();
		this.categories = new Array<any>();
		this.categoryItems = new Array<any>();
		this.configured = false;
		this.username = "";
		this.password = "";
		this.url = "";

		//if we have instance data ( i.e. raw JSON ) then create this instance based of the passed in data
		if (data) {
			Object.assign(this, data);
			this.parent = parent;
			this.events = parent?.events || new EventEmitter();
			this.promiseManagement = new PromiseManagement(this.events);
			this.authenticationExpiry = data.authenticationExpiry ? new Date(data.authenticationExpiry) : undefined;
			if (data.favorites) {
				this.favorites = new Array<any>();
				console.log("favorites :" + data.favorites.length);
				data.favorites.forEach(fav => {
					let favItem: any = fav;
					favItem.sharedoClient = this; //put this back as we remove when serializing 
					this.favorites.push(favItem);
				});
			}
		}
		else {
			this.configured = false;
			this.username = "";
			this.password = "";
			this.url = "";
			this.lastRefresh = undefined;
		}
		this.initialize();
	}

	//#region Initialization methods
	/**
	 * 
	 */
	initialize(): void {
		try {
			// Validate authentication bearer
			if (!this.authenticationBearer || this.authenticationBearer.length === 0) {
				console.warn('No authentication bearer available for initialization');
				return;
			}
			
			// Validate URL
			if (!this.url || this.url.length === 0) {
				console.warn('No URL configured for ShareDo client');
				return;
			}
			
			this.configured = true;
			
			// Initialize resources with error handling
			this.getIDE().catch(error => {
				console.error('Failed to initialize IDE:', error);
				// Continue initialization even if IDE fails
			});
			
			this.getWorkflows().catch(error => {
				console.error('Failed to initialize workflows:', error);
				// Continue initialization even if workflows fail
			});
			
			// Uncommented calls should also have error handling when enabled
			// this.getCatagories(true).catch(error => console.error('Failed to get categories:', error));
			// this.getAllProcessesDefinitions(true).catch(error => console.error('Failed to get process definitions:', error));
		} catch (error) {
			console.error('Error during ShareDo client initialization:', error);
			this.configured = false;
		}
	}

	public getParentItems(): ServerParentItem[] {
		let retValue: ServerParentItem[] = [];
		retValue = [
			new ServerParentItem("Favorites", ElementTypes.favorites, this),
			new ServerParentItem("IDE", ElementTypes.ide, this),
			new ServerParentItem("Execution Monitoring", ElementTypes.executionOverview, this),
			new ServerParentItem("Workflows", ElementTypes.workflows, this),
			new ServerParentItem("Errors", ElementTypes.errors, this),
			new ServerParentItem("Work Types", ElementTypes.workTypes, this),
			new ServerParentItem("Forms", ElementTypes.forms, this),
			new ServerParentItem("Option Sets", ElementTypes.optionSets, this, generateOptionSets)

		];
		return retValue;
	}

	//#endregion
	//#endregion

	//#region Events

	generateEmitId(type:ServerEmmitType):string
	{
		return "ServerEvent:" + type;
	}

	async emitServerEvent<T>(info:IServerEvent<T>) {
		this.events.emit(this.generateEmitId(info.type), info);
	}

	onServerEvent<T>(listener: (info: IServerEvent<T>) => void) {
		this.events.on("ServerEvent", listener);
	}

	//List to server events


	// async emmitPublishingEvent(info:IServerEventPublishing) {			
	// 	let serverEvent : IServerEvent<IServerEventPublishing> = {
	// 		type:ServerEmmitType.publishingFiles,
	// 		data:info
	// 	};
	// 	this.emitServerEvent(serverEvent);	
	// }

	//IServerEventPublishingFileCompleted
	async emmitPublishingFileCompletedEvent(info:IServerEventPublishingFile) {
		let serverEvent : IServerEvent<IServerEventPublishingFile> = {
			type:ServerEmmitType.publishingFileComplete,
			data:info
		};
		this.emitServerEvent(serverEvent);
	}
	onPublishingFileCompleted(listener: (info: IServerEvent<IServerEventPublishingFile>) => void) {
		this.events.on(this.generateEmitId(ServerEmmitType.publishingFileComplete), listener);
	}

	emmitPublishingFileStartedEvent(info:IServerEventPublishingFile) {
		let serverEvent : IServerEvent<IServerEventPublishingFile> = {
			type:ServerEmmitType.publishingFileStarted,
			data:info
		};
		this.emitServerEvent(serverEvent);
	}
	onPublishingFileStarted(listener: (info: IServerEvent<IServerEventPublishingFile>) => void) {
		this.events.on(this.generateEmitId(ServerEmmitType.publishingFileStarted), listener);
	}
	


	async emmitPublishingFilesUpdateEvent(info:IServerEventPublishingFilesUpdated) {			
		let serverEvent : IServerEvent<IServerEventPublishingFilesUpdated> = {
			type:ServerEmmitType.publishingFilesUpdated,
			data:info
		};
		this.emitServerEvent(serverEvent);	
	}
	onPublishingFilesUpdated(listener: (info: IServerEvent<IServerEventPublishingFilesUpdated>) => void) {
		this.events.on(this.generateEmitId(ServerEmmitType.publishingFilesUpdated), listener);
	}

	emmitPublishingFolderEvent(info: IServerEventPublishingFolder) {
		let serverEvent : IServerEvent<IServerEventPublishingFolder> = {
			type:ServerEmmitType.publishingFolder,
			data:info
		};
		this.emitServerEvent(serverEvent);	
	}
	onPublishingFolder(listener: (info: IServerEvent<IServerEventPublishingFolder>) => void) {
		this.events.on(this.generateEmitId(ServerEmmitType.publishingFolder), listener);
	}


	//#endregion


	//region Aspects


	async getWorkTypeAspectsSections(workTypeSystemName: string): Promise<IModellerAspectSections | undefined> {
		let executeItem = new GetWorkTypeAspectsRequest(this);
		executeItem.inputProperties.workTypeSystemName = workTypeSystemName;
		let results = await this.execute(executeItem, true);
		return results?.result?.aspects;
	}
	

	//#endregion


	//region OptionSets

	async getOptionSetInfo(optionSetSystemName: string): Promise<IOptionSetInfo | undefined> {
		let executeItem = new GetOptionSetInfoRequest(this);
		executeItem.inputProperties.optionSetSystemName = optionSetSystemName;
		let results = await this.execute(executeItem, true);
		return results?.result;
	}


	async getOptionSets(): Promise<IOptionsSet[]> 
	{
		let executeItem = new GetOptionsSetsRequest(this);
		let results = await this.execute<IOptionsSet[], undefined>(executeItem, true);
		return results?.result || [];
	}
	

	//#endregion


	//#region IDE
	// * Manages interactions with  folder system ( folders )
	// ! Will need to add Apps management to this at some point in the future

	//get IDE.
	async getIDE(): Promise<IPostProcessedSharedoIDERequestResult | undefined> {
		let executeItem = new IDERequest(this);
		let results = await this.execute<IPostProcessedSharedoIDERequestResult, undefined>(executeItem, true);
		this.ideResult = results?.result;
		return results?.result;
	}

	async getIDETemplates(): Promise<SharedoIDETemplateResponse | undefined> {
		let executeItem = new SharedoIDETemplateRequest(this);
		let results = await this.execute(executeItem, true);
		this.ideTemplates = results?.result;
		return results?.result;
	}

	async getUsers(filters?: IListViewFilterItem[]): Promise<IShareDoUser[]> {
		let executeItem = new ListViewRequest(this);
		executeItem.inputProperties.listView = "core-admin-users-all";
		executeItem.inputProperties.rows = 3000;
		if (filters) { executeItem.inputProperties.filters = filters;};


		try {
			let results = await this.execute(executeItem, true);
			return results?.result?.rows.map(r => {
				let newUser = {
					id: r.id
				};
				Object.assign(newUser, r.data);
				return newUser;

			}) as IShareDoUser[];;
		}
		catch (err) {
			console.log(err);
			return [];
		}
	}

	async getUserByEmail(email: string): Promise<IGetUserResponse | undefined> {
	
		let filter : IListViewFilterItem = {
			"fieldId": "primaryContactDetails",
			"filterId": "clv-filter-text",
			"config": "",
			"parameters": `{"text":"${email}"}`
		};

		let result = await this.getUsers([filter]);

		return this.getUserById(result[0].id);
		

	}

	async getUserById(id: string): Promise<IGetUserResponse | undefined> {
	
		let executeItem = new GetUserRequest(this);
		executeItem.inputProperties.userId = id;

		let result = await this.execute(executeItem);
		if(result && result.success===true)
		{
			return result?.result;
		}

		console.log(result?.error);

		return undefined;

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
		return result.then((result) => { return result?.result; });
	}

	async publishIDEFile(fileId: string, content: string): Promise<ISharedoFileResponse | undefined> {

		let executeItem = new SharedoFileSaveRequest(this);
		executeItem.inputProperties =
		{
			fileId: fileId,
			content: content
		};

		let result = this.execute(executeItem, true);
		return result.then((result) => { return result?.result; });


	}

	async createIDEFile(input: ISharedoIDEFileCreateInputProperties): Promise<ISharedoFileResponse | undefined> {

		let executeItem = new SharedoFileCreateRequest(this);
		executeItem.inputProperties = input;
		let result = this.execute(executeItem, true);
		await this.getIDE(); //refresh the local IDE cache
		return result.then((result) => { return result?.result; });


	}

	async getExecutingWorkflows(): Promise<IPlansExecutingRequestResult[] | undefined> {
		let executeItem = new SharedoWorkflowExecutingRequest(this);
		let result = this.execute(executeItem, true);
		
		return result.then((result) => {
			// this.executingWorkflows = result?.result;
			return result?.result; });
	}

	

	async getExecutingWorkflow(planSystemName: string): Promise<IPlansExecutingRequestResult[] | undefined> {
		let executeItem = new SharedoWorkflowExecutingRequest(this);
		let result = this.execute(executeItem, true);
		return result.then((result) => { 
			if(result?.success !== true)
			{
				return [];
			}
			return result?.result?.filter(r=>r.sharedoTypeSystemName === planSystemName);

		 });
		 


	}

	async getFormBuilders() {
		let executeItem = new FormbuilderListRequest(this);
		let result = this.execute(executeItem, true);
		return result.then((result) => { return result?.result; });
	}

	async getFormBuilder(id: string) {
		let executeItem = new FormbuilderLoadRequest(this);
		executeItem.inputProperties.id = id;
		let result = this.execute(executeItem, true);
		return result.then((result) => { return result?.result; });
	}


	async getWorkflows(): Promise<ISharedoWorkflowsRequestResult | undefined> {
		let executeItem = new SharedoWorkflowsRequest(this);
		let result = this.execute(executeItem, true);
		return result.then((result) => { return result?.result; });
	}

	async getWorkflow(sharedoWorkflowRequestInput: SharedoWorkflowRequestInput): Promise<SharedoWorkflowRequestResult | undefined> {
		let executeItem = new SharedoWorkflowRequest(this);
		executeItem.inputProperties = sharedoWorkflowRequestInput;
		let result = this.execute(executeItem, true);
		return result.then((result) => { return result?.result; });
	}

	async deleteUsers(users: IShareDoUser[]) {
		let executeItem = new DeleteUserRequest(this);

		users.forEach(user => {
			executeItem.inputProperties.userToDeleteId = user.id;
			this.execute(executeItem);
		});


		executeItem.inputProperties.userToDeleteId;
		let result = this.execute(executeItem, true);
		return result.then((result) => { return result?.result; });
	}

	//#endregion

	//#region Perticipant Roles

	async copyPermissionsFromType(fromWorkTypeSystemName: string, toWorkTypeSystemName: string, participantRoleSystemName: string) {
		let executeItem = new CopyPermissionsFromType(this);
		executeItem.inputProperties.fromWorkTypeSystemName = fromWorkTypeSystemName;
		executeItem.inputProperties.toWorkTypeSystemName = toWorkTypeSystemName;
		executeItem.inputProperties.participantRoleSystemName = participantRoleSystemName;
		let result = this.execute(executeItem, true);
		return result.then((result) => { return result?.result; });
	}

	async copyPermissionsFromTypeToDerivedTypes(fromWorkTypeSystemName: string, participantRoleSystemName: string, recursive: boolean = false) {
		let affectedTypes = new Array<string>();
		let derivedTypes = await this.getWorkTypeDerivedTypes(fromWorkTypeSystemName);
		if(derivedTypes)
		{
			let applyCreatePermissionRecursive = async (workTypes: IWorkType[]) => {
				for(let i = 0; i < workTypes.length; i++)
				{
					let wt = workTypes[i];
					await this.copyPermissionsFromType(fromWorkTypeSystemName,wt.systemName, participantRoleSystemName);
					affectedTypes.push(wt.systemName);
					if(recursive && wt.derivedTypes)
					{
						await applyCreatePermissionRecursive(wt.derivedTypes);
					}
				}
			};
			await applyCreatePermissionRecursive(derivedTypes);
		}
		return affectedTypes;
	}
	//#endregion

	//#Create Permissions


	async grantCreatePermission(workTypeSystemName: string,odsId: string, odsType: GrantCreatePermissionType) 
		{
			let executeItem = new GrantCreatePermission(this);
			executeItem.inputProperties.odsId = odsId;
			executeItem.inputProperties.odsType = odsType;
			executeItem.inputProperties.workTypeSystemName = workTypeSystemName;
			let result = this.execute(executeItem, true);
			return undefined;
		}

		async removeCreatePermission(workTypeSystemName: string, odsId: string, odsType: GrantCreatePermissionType ) 
		{
			let executeItem = new RemoveCreatePermission(this);
			executeItem.inputProperties.odsId = odsId;
			executeItem.inputProperties.odsType = odsType;
			executeItem.inputProperties.workTypeSystemName = workTypeSystemName;
			let result = this.execute(executeItem, true);
			return undefined;
		}

	//#region Execution


	//#region WorkTypes


	async getWorkTypes(): Promise<IGetWorkTypesRequestResult | undefined> {
		let executeItem = new GetWorkTypesRequest(this);
		let results = await this.execute<IGetWorkTypesRequestResult, undefined>(executeItem, true);
		this.workTypes = results?.result;
		return results?.result;
	}

	async getWorkTypeDerivedTypes(workTypeSystemName:string, flatList: boolean = false) : Promise<IWorkType[] | undefined>
	{
		let found = await this.getWorkType(workTypeSystemName);
		if(found && flatList)
		{
			let returnValue : IWorkType[] = [];
			let addWorkType = (workType: IWorkType) => {
				returnValue.push(workType);
				if(workType.derivedTypes)
				{
					workType.derivedTypes.forEach(wt => addWorkType(wt));
				}
			};
			found.derivedTypes.forEach(wt=>addWorkType(wt));
			return returnValue;
		}
		
		if(found)
		{
			return found.derivedTypes;
		}
		return undefined;
	}

	async getWorkType(workTypeSystemName:string)
	{
		await this.getWorkTypes();

		 workTypeSystemName = workTypeSystemName.toLowerCase();
		

		if(this.workTypes)
		{
			//recursive search for the worktype
			let findWorkType = (workTypes: IWorkType[]) : IWorkType | undefined => {
				
				for(let i = 0; i < workTypes.length; i++)
				{
					let workType = workTypes[i];
					if(workType.systemName.toLowerCase() === workTypeSystemName){
						return workType;
					}
					let found = findWorkType(workType.derivedTypes);
					if(found){return found;}
				}
			};
			
			let found = findWorkType(this.workTypes);
			if(found){return found;}
			
		}
		return undefined;

	}

	//GetWorkTypeGetParticipantRoles
	async getWorkTypeGetParticipantRoles(workTypeSystemName:string)
	{
		let executeItem = new GetWorkTypeGetParticipantRoles(this);
		executeItem.inputProperties.workTypeSystemName = workTypeSystemName;
		let results = await this.execute(executeItem, true);
		
		let r = results?.result;

		return r;
	}

	async getWorkTypeCreatePermissions(workTypeSystemName:string) : Promise<IGetWorkTypeCreatePermissionResult[] | undefined>
	{
		let executeItem = new GetWorkTypeCreatePermissions(this);
		executeItem.inputProperties.workTypeSystemName = workTypeSystemName;
		let results = await this.execute(executeItem, true);
		
		let r = results?.result;

		return r;
	}


	async grantCreatePermissionToDerivedTypes( workTypeSystemName:string, odsId: string, odsType: GrantCreatePermissionType, recursive: boolean = false)
	{
		return this.setCreatePermissionToDerivedTypes(this.grantCreatePermission.bind(this), workTypeSystemName, odsId, odsType, recursive);
	}
	async removeCreatePermissionToDerivedTypes( workTypeSystemName:string, odsId: string, odsType: GrantCreatePermissionType, recursive: boolean = false)
	{
		return this.setCreatePermissionToDerivedTypes(this.removeCreatePermission.bind(this), workTypeSystemName, odsId, odsType, recursive);
	}

	async setCreatePermissionToDerivedTypes(func: Function, workTypeSystemName:string, odsId: string, odsType: GrantCreatePermissionType, recursive: boolean = false)
	{
		let affectedTypes = new Array<string>();
		let derivedTypes = await this.getWorkTypeDerivedTypes(workTypeSystemName);
		if(derivedTypes)
		{
			let applyCreatePermissionRecursive = async (workTypes: IWorkType[]) => {
				for(let i = 0; i < workTypes.length; i++)
				{
					let wt = workTypes[i];
					await func(wt.systemName,odsId, odsType);
					affectedTypes.push(wt.systemName);
					if(recursive && wt.derivedTypes)
					{
						await applyCreatePermissionRecursive(wt.derivedTypes);
					}
				}
			};
			await applyCreatePermissionRecursive(derivedTypes);
		}
		return affectedTypes;
	}

	//#endregion

	//#region Category Management 
	// * Manages interactions with  folder system ( folders )
	// ! Will need to add Apps management to this at some point in the future

	/**
	 * Gets a category sub folders ( categories ) 
	 * If clear clear cache is set to true we then connect to the K2 server and get the sub folders
	 * then update the local categories folders or remove ones that have been deleted on the server 
	 * @param folder 
	 * @param clearCache 
	 */
	async getCategorySubFolders(folder: ICategory, clearCache: boolean = false): Promise<ICategory[]> {
		try {
			// Validate input folder
			if (!folder) {
				throw new Error('Folder parameter is required');
			}
			
			if (clearCache === true) {
				// TODO: Implement cache clearing logic
				console.info('Cache clearing requested for category subfolders');
				return Promise.resolve([]);
			}
			
			// TODO: Implement actual subfolder retrieval
			// Currently returns empty array - needs implementation
			console.warn('getCategorySubFolders not fully implemented');
			return Promise.resolve([]);
		} catch (error) {
			console.error('Error getting category subfolders:', error);
			// Return empty array on error to prevent tree view crashes
			return Promise.resolve([]);
		}
	}


	getCategoryItems(folder: ICategory, clearCache: boolean = false): Promise<ICategoryItem[]> {
		try {
			// Validate input folder
			if (!folder) {
				throw new Error('Folder parameter is required');
			}
			
			if (clearCache === true) {
				let promiseKey = "getCategoryItems" + (folder.name || 'unknown');
				// TODO: Implement cache clearing logic using promiseKey
				console.info(`Cache clearing requested for category items: ${promiseKey}`);
				return Promise.resolve([]);
			}
			
			// TODO: Implement actual category items retrieval
			// Currently returns empty array - needs implementation
			console.warn('getCategoryItems not fully implemented');
			return Promise.resolve([]);
		} catch (error) {
			console.error('Error getting category items:', error);
			// Return empty array on error to prevent tree view crashes
			return Promise.resolve([]);
		}
	}


	/**
	 * Downloads all catagories from the K2 server 
	 * TODO: implement and ability to return cached categories and then at same time fetch latest and then update the UI as they come in
	 */
	async getCatagories(clearCache?: boolean): Promise<ICategory[]> {

		// let catsPromiseKey = "getAllCategories";
		// let catsItemsPromiseKey = "getAllCategoryItems";


		// let pItems = this.promiseManagement.populateObjectWithResults(execCatItems, catsItemsPromiseKey, this.categoryItems, null, this, clearCache, items => {
		// 	this.events?.emit("itemAdded", items);
		// });
		// let pCats = this.promiseManagement.populateObjectWithResults(execCats, catsPromiseKey, this.categories, null, this, clearCache, items => {
		// 	this.events?.emit("itemAdded", items);
		// });

		// if (pItems && pCats) {
		// 	return pCats.results;
		// }
		return Promise.resolve([]);

	}


	/**
	 * Add a tree node to the K2 Server favorers
	 * @param node 
	 */
	public addFavorite(node: any) {

		if (!this.favorites.find(tn => tn.entityId === node.entityId)) {

			// Create a proper copy of the node for favorites
			let newTreeNode: any = {
				id: node.id + "_Favorite",
				label: node.label,
				entityId: node.entityId,
				collapsibleState: node.collapsibleState,
				type: node.type,
				data: node.data,
				sharedoClient: node.sharedoClient,
				parent: node.parent,
				children: node.children,
				icon: node.icon,
				additionalData: node.additionalData,
				duplicateNumber: node.duplicateNumber,
				typeFlags: node.typeFlags ? [...node.typeFlags] : new Array<ElementTypes>()
			};
			
			// Add favoriteItem flag
			newTreeNode.typeFlags.push(ElementTypes.favoriteItem);
			
			// Add to favorites list
			this.favorites.push(newTreeNode);
			
			// Emit event to update UI
			this.parent?.events.emit("itemAdded", newTreeNode);
		}
	}
	public removeFavorite(node: any) {
		// Find the favorite item by entityId (since favorite items have "_Favorite" suffix in their id)
		const favoriteIndex = this.favorites.findIndex(tn => tn.entityId === node.entityId);
		
		if (favoriteIndex !== -1) {
			const removedItem = this.favorites[favoriteIndex];
			this.favorites.splice(favoriteIndex, 1);
			
			// Emit event to update UI
			this.parent?.events.emit("itemRemoved", removedItem);
		}
	}

	//#endregion Favorites

	//#region Publishing



	// publish(description: string, displayName: string, systemName: string, file: FileType) {

	// }

	//#endregion Publishing

	//#region  Workflow / Process Management

	/**
	 * Get currently executing plans with enhanced monitoring capabilities
	 * @param limit Maximum number of results (default: 50)
	 * @param offset Number of results to skip (default: 0)
	 * @returns Promise with executing plans and monitoring data
	 */
	async getExecutingPlansEnhanced(limit: number = 50, offset: number = 0): Promise<IExecutingPlansResponse | undefined> {
		let executeItem = new GetExecutingPlansEnhanced(this);
		executeItem.setPagination(limit, offset);
		
		let result = await this.execute(executeItem);
		return result?.result;
	}

	/**
	 * Start manual execution of a workflow plan
	 * @param planId ID of the plan to execute
	 * @param context Execution context and parameters
	 * @param priority Execution priority (default: normal)
	 * @param timeout Execution timeout in seconds
	 * @param parameters Plan-specific parameters
	 * @returns Promise with execution details
	 */
	async startManualExecution(
		planId: string, 
		context: any, 
		priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal',
		timeout?: number,
		parameters?: any
	): Promise<IManualExecutionResponse | undefined> {
		let executeItem = new StartManualExecution(this);
		executeItem.setExecutionParams(planId, context, priority, timeout, parameters);
		
		let result = await this.execute(executeItem);
		return result?.result;
	}

	/**
	 * Cancel a currently executing plan
	 * @param planExecutionId The unique identifier of the plan execution to cancel
	 * @param reason Reason for cancellation
	 * @param force Force cancellation even if plan is in critical state
	 * @returns Promise with cancellation status
	 */
	async cancelExecution(
		planExecutionId: string, 
		reason?: string, 
		force: boolean = false
	): Promise<ICancelExecutionResponse | undefined> {
		let executeItem = new CancelExecution(this);
		executeItem.setPlanExecutionId(planExecutionId);
		executeItem.setCancellationParams(reason, force);
		
		let result = await this.execute(executeItem);
		return result?.result;
	}

	/**
	 * Get workflow advisor issues and recommendations
	 * @param severity Filter by issue severity
	 * @param category Filter by issue category
	 * @returns Promise with list of advisor issues
	 */
	async getAdvisorIssues(
		severity?: 'info' | 'warning' | 'error' | 'critical', 
		category?: string
	): Promise<IAdvisorIssue[] | undefined> {
		let executeItem = new GetAdvisorIssues(this);
		executeItem.setFilters(severity, category);
		
		let result = await this.execute(executeItem);
		return result?.result;
	}

	startWorklfow(k: SharedoClient, startSettings: any) {
		//todo: Implement workflow starter - will be enhanced with manual execution capabilities above
	}


	/**
	 * Manages execution of returning array items, and their execution promise 
	 * @param resultsObject the array that need to be returned / populated with the results of the function to execute ?prehaps drop this in future
	 * @param functionToExecute the function to execute to populate the array 
	 * @param promiseKey a unique key for the execution promise 
	 * @param clearCache force the clearing of the
	 */
	execute<Result, Inputs>(requestToExecute: RequestBase<Result, Inputs>,
		clearCache: boolean = false, promiseKey?: string): Promise<IExecutionBaseResult<Result> | undefined> {

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
		}).catch(err => {
			this.events?.emit("error", err);
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
