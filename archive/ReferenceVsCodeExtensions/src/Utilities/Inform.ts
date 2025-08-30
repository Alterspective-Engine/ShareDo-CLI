
import * as vscode from 'vscode';

export class Inform {
	static outputChannel?: vscode.LogOutputChannel;

	private static get outputToUser() {
		if (!this.outputChannel) {
			this.outputChannel = vscode.window.createOutputChannel("Sharedo",{ log: true
				
			});
			this.outputChannel.show();

		}
		return this.outputChannel;
	}

	public static writeInfo(message: string,...args: any[]) {
		this.outputToUser.info(message,...args);
		// let x : vscode.OutputChannel;
		console.log(message,...args);
	
	}

	public static writeError(message: string,...args: any[]) {
		this.outputToUser.error( message,...args);
		console.error(message,...args);
	}

	public static error(message: string,...args: any[]) {
		this.outputToUser.error( message,...args);
		console.error(message,...args);
	}

	public static writeDebug(message: string,...args: any[]) {
		this.outputToUser.debug(message,...args);
		console.debug(message,...args);
	}


}

