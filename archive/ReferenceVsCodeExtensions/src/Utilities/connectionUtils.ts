import * as vscode from 'vscode';
import { SharedoEnvironments } from '../environments';
import { Settings } from '../settings';
import { SharedoClient } from '../sharedoClient';
import { Inform } from './inform';
import { refreshTree } from './treeUtils';

export async function connectToSharedo(thisEnv: SharedoEnvironments, context: vscode.ExtensionContext, settings: Settings, thisAppSettings: Settings) {
    try {
        const startTime = Date.now();
        let sharedoClient: SharedoClient;
        sharedoClient = new SharedoClient(undefined, settings.sharedoEnvironments);
        let sharedoServer = await vscode.window.showInputBox(
            { prompt: "Enter your Sharedo Server URL", value: "https://demo-aus.sharedo.tech" });
        try {
            if (sharedoServer) {
                let json = JSON.parse(sharedoServer);
                if (json.url) {
                    sharedoServer = json.url;
                    sharedoClient.url = json.url;
                    sharedoClient.clientId = json.clientId;
                    sharedoClient.clientSecret = json.clientSecret;
                    sharedoClient.impersonateUser = json.impersonateUser;
                    sharedoClient.impersonateProvider = json.impersonateProvider;
                }
            }
        }
        catch (error) {}
        if (!sharedoServer) { throw new Error("Sharedo Server URL is required"); }
        if (sharedoServer.endsWith("/")) {
            sharedoServer = sharedoServer.slice(0, -1);
        }
        sharedoClient.url = sharedoServer;
        let clientId = await vscode.window.showInputBox({ prompt: "Client ID", value: sharedoClient.clientId || "VSCodeAppClientCreds" });
        if (!clientId) { throw new Error("Client ID is required"); }
        sharedoClient.clientId = clientId;
        let clientSecret = await vscode.window.showInputBox({ prompt: "Client Secret", value: sharedoClient.clientSecret || "", password: true });
        if (!clientSecret) { throw new Error("Client Secret is required"); }
        sharedoClient.clientSecret = clientSecret;
        let impersonateUser = await vscode.window.showInputBox({ prompt: "Impersonate User [blank for none]", value: sharedoClient.impersonateUser || "", password: false });
        sharedoClient.impersonateUser = impersonateUser;
        let impersonateProvider = await vscode.window.showInputBox({ prompt: "Impersonate Provider [blank for none]", value: sharedoClient.impersonateProvider || "idsrv", password: false });
        sharedoClient.impersonateProvider = impersonateProvider;
        const tokenEndpointDefault = calculateIdentityUrl(sharedoClient.url);
        let tokenEndpoint = await vscode.window.showInputBox({ prompt: "Token Endpoint", value: tokenEndpointDefault, password: false });
        if (!tokenEndpoint) { throw new Error("Token Endpoint is required"); }
        sharedoClient.tokenEndpoint = tokenEndpoint;
        Inform.writeInfo("Starting authentication to Sharedo server at " + sharedoClient.url);
        const authStart = Date.now();
        let authTime = 0;
        let refreshTime = 0;
        await sharedoClient.getBearer()
            .then(() => {
                authTime = Date.now() - authStart;
                Inform.writeInfo(`Authenticated to Sharedo server in ${authTime} ms.`);
                vscode.window.showInformationMessage('Sharedo Server Connected');
                const refreshStart = Date.now();
                refreshTree(settings, context);
                refreshTime = Date.now() - refreshStart;
                Inform.writeInfo(`TreeView refreshed in ${refreshTime} ms.`);
            })
            .catch((error) => {
                Inform.writeError('Error trying to connect:', error);
                vscode.window.showErrorMessage('Error trying to connect: ' + error);
            });
        let exitingServer = thisEnv.find(sharedoClient);
        if (exitingServer) {
            exitingServer = sharedoClient;
            vscode.window.showInformationMessage('Sharedo Server Updated');
            refreshTree(settings, context);
        }
        else {
            thisEnv.addServer(sharedoClient);
            vscode.window.showInformationMessage('Sharedo Server Added');
        }
        thisAppSettings.save();
        const totalTime = Date.now() - startTime;
        Inform.writeInfo(`Total time to connect and refresh: ${totalTime} ms.`);
    }
    catch (error: any) {
        Inform.writeError(error.toString());
    }
}

function calculateIdentityUrl(url: string) {
    const baseUrl = url;
    const dotIndex = url.indexOf('.');
    const tokenEndpointDefault = `${baseUrl.slice(0, dotIndex)}-identity${baseUrl.slice(dotIndex)}/connect/token`;
    return tokenEndpointDefault;
}
