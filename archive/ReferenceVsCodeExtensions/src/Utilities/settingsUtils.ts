import { generateReportOutput } from '../TreeHelpers/ReportHelper';

export function generateSettingsJson() {
    let json = {
        url: "https://xxx.sharedo.co.uk/",
        clientId: "VSCodeAppClientCreds",
        clientSecret: "",
        impersonateUser: "",
        impersonateProvider: "idsrv/aad",
    };
    generateReportOutput(undefined, "Settings", json);
}
