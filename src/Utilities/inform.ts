import chalk from "chalk";
import { Console } from "console";


export class Inform {
   
	


	public static writeInfo(message: string,...args: any[]) {
		console.info(message,...args);
	}

	public static writeSuccess(message: string,...args: any[]) {
		console.info(chalk.green(message),...args);
	}

	public static writeError(message: string,...args: any[]) {
		console.error(chalk.red(message),...args);
	}

	public static writeDebug(message: string,...args: any[]) {
		//console.debug(message,...args);
	}


}
