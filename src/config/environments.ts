import { EventEmitter } from "events";
import _ from "lodash";
import * as fs from "fs";
import { findConfigFileInDirectory, SharedoConfig } from "./config";
import { SharedoClient } from "../server/sharedoClient";

class EventListener {
	constructor(public listenerType: string,
		public listenerFunction: (...args: any[]) => void) { }
}

export interface ISharedoEnvironments {
	internalArray: Array<SharedoClient>;
}

export class SharedoEnvironments {
	internalArray: Array<SharedoClient>;
	events = new EventEmitter();

	public deployToServers = new Array<SharedoClient>();
	private listeners: EventListener[];
	private addServerConfiguration(data?: SharedoEnvironments) {
		if (data) {
			//this.K2Server.push(new K2ServerConfiguration(item))
			try {
				if (data.internalArray) {
					data.internalArray.forEach(item => {
						let newItem = new SharedoClient(item, this);
						this.internalArray.push(newItem);
					});
					this.events.emit("populated", this.internalArray);
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
		this.addServerConfiguration(data);
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
		this.addServerConfiguration(data);
	}
	public get length() { return this.internalArray.length; }
	
	public find(server: SharedoClient) {
		return this.internalArray.find(i => {
			if (i.url === server.url) { return i; }
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
			let config = JSON.parse(fs.readFileSync(configPath, "utf8"));
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


	public getServerByUrl(url: string) {
		return this.internalArray.find(s => s.url === url);
	}
	public getServerByAlias(alias: string) {
		return this.internalArray.find(s => s.alias === alias);
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
