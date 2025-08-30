import * as vscode from 'vscode';
import { SharedoEnvironments } from '../environments';
import { Inform } from './inform';

export function validatePublishServers(sharedoEnvironments: SharedoEnvironments): boolean {
    if (sharedoEnvironments.deployToServers.length === 0) {
        vscode.window.showErrorMessage('No Publish Servers defined');
        return false;
    }
    sharedoEnvironments.deployToServers.forEach(server => {
        Inform.writeInfo(`Publishing to server: ${server.url}`);
    });
    return true;
}
