import Axios from "axios";
import { SharedoClient } from "../server/sharedoClient";
import { Inform } from "../Utilities/inform";

// TODO: Move API KEY into settings and ask for it when adding a  server

let executionCounter = 0;

export enum MethodType {
	get = "GET",
	post = "POST",
	put = "PUT",
	delete = "DELETE"
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
	inputProperties: T;
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
		return this.inputProperties;
	}


	//optional override to allow for custom processing of the results
	 async postProcessResults(results: Results) : Promise<Results>
	 {
		 return results;

	 }

	 //create optional method that can be overriden to allow for custom processing of the input properties
	 preProcessInputProperties(inputProperties: Inputs)
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



	async execute(): Promise<Results> {

		try {
			executionCounter += 1;
			let inputs = this.preProcessInputProperties(this.inputProperties);

			let thisExecutionCounter = executionCounter;
			let startTime = Date.now();
			if (this.information?.displayName) {
				Inform.writeDebug(`${thisExecutionCounter} - Executing [${this.method}][${this.information.displayName}]`,inputs);
				if(inputs){
					// let inputsAsString = JSON.stringify(inputs);
				//	Inform.writeInfo(`${thisExecutionCounter} - with: ${inputsAsString}`,inputs);
				}
			}

			let data = JSON.stringify(this.body, replacer);
			
			//check if this.sharedoClient.url ends with a slash and if so remove it
			let baseUrl = this.sharedoClient.url.endsWith("/") ? this.sharedoClient.url.slice(0, -1) : this.sharedoClient.url;
			let pathUrl = this.path.startsWith("/") ? this.path : "/" + this.path;

			let restAPIURL = baseUrl + pathUrl;

			let bearer = await this.sharedoClient.getBearer();

			return Axios(restAPIURL, {
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

				//add more debugging and error checking
				Inform.writeDebug(`${thisExecutionCounter} - recevied [${JSON.stringify(result.data).length}] bytes in ${millisToMinutesAndSeconds(timePassed)}ms`);

				return await this.postProcessResults(result.data);
				// let arrayResult: Results[] | Results = postProcessedResults;

				// //make array so predicatable results so everything returned is an array
				// if (!isArray(arrayResult)) {
				// 	arrayResult = [arrayResult]; 
				// }

				//return Promise.resolve(postProcessedResults);
			}).catch(error => {
				//console.log("Error in axios: " + error);
				 Inform.writeError("Error in axios:",error);
				return Promise.reject(error);
			});
		}
		catch (error) {
			//console.log("Error in execute: " + error);
			 Inform.writeError("Error in execute rest service: ",error);
			return Promise.reject(error);
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