
import { EventEmitter } from "events";
import _ = require("lodash");
import { SharedoClient } from "./sharedoClient";
import * as fs from "fs";
import * as JSON5 from 'json5';
import { findConfigFileInDirectory, SharedoConfig } from "./config";

class EventListener {
	constructor(public listenerType: string,
		public listenerFunction: (...args: any[]) => void) { }
}

export class SharedoEnvironments {
	internalArray: Array<SharedoClient>;
	events = new EventEmitter();

	public deployToServers = new Array<SharedoClient>();
	public compareServers = new Array<SharedoClient>();
	private listeners: EventListener[];

	public isCompareServer(server: SharedoClient) {
		return this.compareServers.find(s => s.url === server.url) !== undefined;
	}

	public addToCompareServers(server: SharedoClient) {
		if (!this.isCompareServer(server)) {
			this.compareServers.push(server);
			this.events.emit("populated", this.internalArray);
		}
	}

	public removeFromCompareServers(sharedoClient: SharedoClient) {
		_.remove(this.compareServers, (item) => item.url === sharedoClient.url);
		this.events.emit("populated", this.internalArray);
	}

	private addIK2ServerConfiguration(data?: SharedoEnvironments) {
		if (data) {
			//this.K2Server.push(new K2ServerConfiguration(item))
			try {
				if (data.internalArray) {
					data.internalArray.forEach(item => {
						let newItem = new SharedoClient(item, this);
						this.internalArray.push(newItem);
						this.events.emit("populated", this.internalArray);
					});
				}
			}
			catch (err) {
				throw err;
			}
		}
	}

	constructor(data?: SharedoEnvironments) {
		this.internalArray = new Array();
		this.listeners = new Array<EventListener>();
		this.addIK2ServerConfiguration(data);
		this.addListenerTypeEventHandlers("populated");
		this.addListenerTypeEventHandlers("itemAdded");
		this.addListenerTypeEventHandlers("itemRemoved");
		this.addListenerTypeEventHandlers("error");
	}

	addListenerTypeEventHandlers(name: string) {
		this.events.addListener(name,(...args: any[]) => {
			this.listeners.filter(l => l.listenerType === name).forEach(listener => {
				listener.listenerFunction(...args);
			});
		});
	}

	public clear() {
		this.internalArray = new Array();
	}

	public populatedEvent(listener: (...args: any[]) => void) {
		this.listeners.push(new EventListener("populated", listener));
	}

	public isDeployToServer(server: SharedoClient) {
		if (this.deployToServers) {
			return this.deployToServers.find(s => s.url === server.url) !== undefined;
		}
		return false;
	}
	

	public addToDeployToServers(server: SharedoClient) {
		if (!this.deployToServers) {
			this.deployToServers = new Array<SharedoClient>();
		}
		this.deployToServers.push(server);
		this.events.emit("populated", this.internalArray);
	}

	public removeFromDeployServer(sharedoClient: SharedoClient) {
		if (this.deployToServers) {
			_.remove(this.deployToServers, (item) => {
				return item.url === sharedoClient.url;
			});

		}
		this.events.emit("populated", this.internalArray);
	}
	

	public itemAddedEvent(listener: (...args: any[]) => void) {
		this.listeners.push(new EventListener("itemAdded", listener));
	}

	public errorEvent(listener: (...args: any[]) => void) {
		this.listeners.push(new EventListener("error", listener));
	}

	public itemRemovedEvent(listener: (...args: any[]) => void) {
		this.listeners.push(new EventListener("itemRemoved", listener));
	}

	public populate(data?: SharedoEnvironments) {
		this.addIK2ServerConfiguration(data);
	}
	public get length() { return this.internalArray.length; }
	public find(server: SharedoClient) {
		return this.internalArray.find(i => {
			if (i.url === server.url && i.username === server.username) { return i; }
		});
	}
	public addServer(server: SharedoClient) {
		this.internalArray.push(server);
		server.initialize();
		this.events.emit("itemAdded", server);
	}

	public getLocalServer() {
		//check existing workspace for sharedo.config.json
		//if not found, create one
		//return the local server
		//use fs to search current folder for sharedo.config.json
		//use fs to find config file
		let configPath = findConfigFileInDirectory();
		if (configPath) {
			let config = JSON5.parse(fs.readFileSync(configPath, "utf8"));
			if (config) {
				let server = new SharedoClient(config, this);
				return server;
			}
		}
		return null;
	}



	


	public removeServer(server: SharedoClient) {
		let arr = this.internalArray;
		_.remove(arr, (item) => {
			return item.url === server.url;
		});
		console.log(arr);
		this.events.emit("itemRemoved", server);
	}
	public getItem(index: number) {
		return this.internalArray[index];
	}
	// public getCurent() {
	// 	return this.internalArray[0]; //TODO: Add ability to set current server
	// }

	public getServerByUrl(url: string) {
		return this.internalArray.find(s => s.url === url);
	}
	public listServers(): string[] {
		return this.internalArray.map(a => a.url);
	}
	public forEach(callbackfn: (value: SharedoClient, index: number, array: SharedoClient[]) => void, thisArg?: any): void {
		this.internalArray.forEach(function (t, index, array) {
			callbackfn(t, index, array);
		});
	}

}
