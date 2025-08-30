import Axios from "axios";
import { SharedoClient } from "../sharedoClient";
import * as https from 'https';
import { Inform } from "../Utilities/inform";
import { IExecutionBaseResult } from "./IExecutionBaseResult";

// Utility function for logging
function logInfo(module: string, func: string, message: string, context?: any) {
    console.log(`[INFO] [${module}::${func}] ${message}`, context || '');
}

function logError(module: string, func: string, message: string, error?: any) {
    const errorDetails = error?.stack || error?.message || error;
    console.error(`[ERROR] [${module}::${func}] ${message}`, errorDetails);
}

// ✅ RESOLVED: API KEY management implemented via SecurityManager utility
// The SecurityManager provides secure storage using VS Code's SecretStorage API
// and prompts users for API keys when needed during server connection setup.



let executionCounter = 0;

export enum MethodType {
	get = "get",
	post = "post",
	put = "put",
	delete = "delete"
}

export enum ResultType {
	json = "json",
	csv = "csv",
	csvwithheader = "csvwithheader",
	xml = "xml",
	text = "text",
	blob = "blob",
	none = "none"
}


export interface SharedoInfo {
	description: string;
	displayName?: string;
	created?: string;
	categories?: string;
}

export interface IBaseTTL
{
	ttl: number;
}


export interface IBaseExecutionSettings<T> extends IBaseTTL {

	method: MethodType;
	inputProperties: T ;
	path: string;
	information: SharedoInfo | undefined;
	resultType: ResultType;
}

// export abstract class BaseExecutionSettings implements IBaseExecutionSettings {
// 	abstract method: MethodType;
// 	abstract path: string;
// 	abstract inputProperties : T;
// 	information: SharedoInfo = new SharedoInfo();
// 	resultType = undefined;

// }

const millisToMinutesAndSeconds = (millis: number) => {
	let minutes: number = Math.floor(millis / 60000);
	let seconds: number = +(((millis % 60000) / 1000).toFixed(0));
	//ES6 interpolated literals/template literals 
	//If seconds is less than 10 put a zero in front.
	return `${minutes}:${(seconds < 10 ? "0" : "")}${seconds}`;
};

// Utility function to get caller information
function getCallerInfo(): string {
    const error = new Error();
    const stack = error.stack?.split("\n");
    if (stack && stack.length > 3) {
        // Extract the caller from the stack trace (3rd line is the caller)
        return stack[3].trim();
    }
    return "Unknown caller";
}

export abstract class RequestBase<Results, Inputs> implements IBaseExecutionSettings<Inputs> {
	sharedoClient: SharedoClient;
	abstract method: MethodType;
	abstract inputProperties: Inputs;
	abstract path: string;
	abstract information: SharedoInfo;
	abstract resultType: ResultType;
	public ttl: number = 600; //? should we move into a configuration setting for the vs code extension and pass down into this class 
	private _settingToLoad?: IBaseExecutionSettings<Inputs> | undefined;

	public get settingToLoad(): IBaseExecutionSettings<Inputs> | undefined {
		return this._settingToLoad || undefined;
	}
	public set settingToLoad(v: IBaseExecutionSettings<Inputs> | undefined) {
		this._settingToLoad = v;
	}

	public get body() : any {
		logInfo('RequestBase', 'body', `Returning input properties`, this.inputProperties);
		return this.inputProperties;
	}


	//optional override to allow for custom processing of the results
	 async postProcessResults(results: Results) : Promise<Results>
	 {
		 return results;

	 }

	 //create optional method that can be overriden to allow for custom processing of the input properties
	 preProcessInputProperties(inputProperties: Inputs | undefined)
	 {
		 return inputProperties;
	 }

	/**
	 * Instantiate this class with a configured  client 
	 * @param shareDoConfiguration A Client with configured username, password and API key
	 */
	constructor(sharedoClient: SharedoClient, executionSettings?: IBaseExecutionSettings<Inputs>) {
		this.sharedoClient = sharedoClient;
		if (executionSettings) {
			this.settingToLoad = executionSettings;
		}
		Object.assign(this, this.settingToLoad);
	}



	async execute(): Promise<IExecutionBaseResult<Results>> {

		let retValue : IExecutionBaseResult<Results> = {
			success: false,
			error: undefined,
			result: undefined,
			executionTime: 0,
			freindlyError: undefined
		};
		
		let startTime = Date.now();
		executionCounter += 1;
		let thisExecutionCounter = executionCounter;
		const callerInfo = getCallerInfo();

		try {
			
			let inputs = this.preProcessInputProperties(this.inputProperties);
			
			if (this.information?.displayName) {
				logInfo('RequestBase', 'execute', `${thisExecutionCounter} - Executing [${this.method}][${this.information.displayName}]`, { inputs, caller: callerInfo });
			}

			let data = JSON.stringify(inputs, replacer);
			
			let baseUrl = this.sharedoClient.url.endsWith("/") ? this.sharedoClient.url.slice(0, -1) : this.sharedoClient.url;
			let pathUrl = this.path.startsWith("/") ? this.path : "/" + this.path;

			let restAPIURL = baseUrl + pathUrl;
			logInfo('RequestBase', 'execute', `REST API URL: ${restAPIURL}`, { caller: callerInfo });
			//log the input data
			logInfo('RequestBase', 'execute', `Input Data: ${data}`, { caller: callerInfo });

			let bearer = await this.sharedoClient.getBearer();

			const instance = Axios.create({
				baseURL: restAPIURL,
			});
			
			instance.defaults.httpsAgent = new https.Agent({
				rejectUnauthorized: false,
			});
			
			instance.interceptors.request.use(
				(config) => {
					logInfo('RequestBase', 'execute', `Request Config:`, config);
					return config;
				},
				(error) => {
					logError('RequestBase', 'execute', `Request Interceptor Error`, error);
					return Promise.reject(error);
				}
			);

			
			
			
			return instance(restAPIURL, {
				method: this.method,
				
				headers: {
					// eslint-disable-next-line @typescript-eslint/naming-convention
					"Content-Type": "application/json",
					// eslint-disable-next-line @typescript-eslint/naming-convention
					"Authorization": `Bearer ${bearer}`

				},
				data: data

			}).then(async result => {


				let timePassed = Date.now() - startTime;
				logInfo('RequestBase', 'execute', `${thisExecutionCounter} - Received [${JSON.stringify(result.data).length}] bytes in ${millisToMinutesAndSeconds(timePassed)}ms`, { caller: callerInfo });
				retValue.success = true;
				retValue.executionTime = timePassed;
				retValue.result = await this.postProcessResults(result.data);

				return retValue;

			}).catch(error => {
				retValue.success = false;
				retValue.error = error;
				retValue.executionTime = Date.now() - startTime;
				retValue.freindlyError = error.message || "An unexpected error occurred";
				// logError('RequestBase', 'execute', `${thisExecutionCounter} - Axios Error`, error);
				// logError('RequestBase', 'execute', `${thisExecutionCounter} - Axios Error Data`, error.response?.data);
				logError('RequestBase', 'execute', `${thisExecutionCounter} - Url`, restAPIURL);
				logError('RequestBase', 'execute', `${thisExecutionCounter} - Axios Status Text`, error.response?.data.errorMessage);
				logError('RequestBase', 'execute', `${thisExecutionCounter} - Data Sent`, data);
				logError('RequestBase', 'execute', `${thisExecutionCounter} - Caller Info`, callerInfo);
				return retValue;
			});
		} catch (error: any) {
			retValue.success = false;
			retValue.error = error;
			retValue.executionTime = Date.now() - startTime;
			retValue.freindlyError = error.message || "An unexpected error occurred";
			logError('RequestBase', 'execute', `${thisExecutionCounter} - Execution Error`, error);
			logError('RequestBase', 'execute', `${thisExecutionCounter} - Caller Info`, callerInfo);
			return retValue;
		}

	}
}



function replacer(key: string, value: any): any {
	//console.log(key)

	if (key === "sharedoClient") { return undefined; }

	// if (getObjectBaseType(value) === "FileType") {return value.toString;}
	// else {return value;}
	return value;
}