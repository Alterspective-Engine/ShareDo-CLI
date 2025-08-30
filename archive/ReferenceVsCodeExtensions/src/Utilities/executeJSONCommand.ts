
export interface ICommand {
    command: string;
    args: string[];
}



export function executeCommand(jsonContents: string): Promise<any> {

    const command: ICommand = JSON.parse(jsonContents);

    switch (command.command) {
        case "deleteUser":
            return Promise.resolve(deleteUser(command.args));
        default:
            return Promise.reject(`Unknown command: ${command.command}`);
    }
}
function deleteUser(args: string[]): any {
    
    
    

}

