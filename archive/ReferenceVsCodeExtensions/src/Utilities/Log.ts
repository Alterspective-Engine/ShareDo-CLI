
import * as clc from 'cli-color';
import { ChalkInstance } from 'chalk';
import chalk from 'chalk';

chalk.level = 3;
let mode: ChalkInstance = chalk.magentaBright.bgBlack.bold;


// console.log(colors.enabled)

// let l = console.log

let cwidth = clc.windowSize.width;

export function lcol(heading: Array<string>, data: Array<Array<string>>) {

    process.stdout.write(
        clc.columns([
            heading,
            data
        ])
    );
}


export class Section {
    sectionName: string;
    parent: Section | undefined;
    c: ChalkInstance;
    indent = 0;
    indentPad = "";
    constructor(sectionName: string, c: ChalkInstance, section?: Section) {
        this.c = c;
        this.sectionName = sectionName;

        if (section) {
            this.indent = section.indent + 1;
            this.indentPad = "-".repeat(this.indent * 2);
        }

        this.parent = section;
    }
    log(...args: any[]) {
        console.log(mode(args));
    }
    lh1(heading: string) {
        return lh1(this.indentPad + heading, this);
    }
    lh2(heading: string) {
        return lh2(this.indentPad + heading, this);
    }
    lh3(heading: string) {
        return lh3(this.indentPad + heading, this);
    }
    l(...args: any[]) {
        //log with the current mode ensure full with and padding

        let firstArg = this.indentPad + args.shift();
        //remove color formatting from first arg
        let totLen = firstArg.length - firstArg.replace(/\u001b\[.*?m/g, '').length - 2;

        console.log(this.c("|" + firstArg.padEnd(cwidth + totLen, " ") + "|"));

        args.forEach((arg) => {
            console.log(this.c(arg.padStart((cwidth / 2) + (arg.length / 2), " ").padEnd(cwidth, " ")));
        });
    }
}




function logHeadingSection(c: ChalkInstance, heading: string, section?: Section) {
    console.log(c("".padStart(cwidth, "-")));
    let sec = new Section(heading, c, section);
    let time = new Date(Date.now()).toLocaleString();

    let path = "";
    if (section) {
        path = section.sectionName;
        while (section.parent) {
            section = section.parent;
            path = section.sectionName + " -> " + path;
        }
    }

    //add add heading to end of path and only add -> if path is not empty
    if (path.length > 0) {
        path += " -> ";
    }
    path += heading;



    //position the heading in the middle of the screen
    // console.log(c(heading.padStart((cwidth / 2) + (heading.length / 2), " ").padEnd(cwidth, " ")));
    console.log(c.red(path.padStart((cwidth / 2) + (path.length / 2), " ").padEnd(cwidth, " ")));
    console.log(c.red(`at ${time}`.padStart((cwidth / 2) + (`at ${time}`.length / 2), " ").padEnd(cwidth, " ")));

    console.log(c("".padStart(cwidth, "-")));
    mode = c;
    return sec;
}

export function lh1(heading: string, section?: Section) {
    let c = chalk.bgHex("#000000");
    return logHeadingSection(c, heading, section);
}

export function lh2(heading: string, section?: Section) {
    let c = chalk.bgHex("#31332b");
    return logHeadingSection(c, heading, section);
}

export function lh3(heading: string, section?: Section) {
    let c = chalk.bgHex("#5e5151");
    return logHeadingSection(c, heading, section);
}

export function l(...args: any[]) {

}
export const lh = lh1;


export const imp = (text: string) => {
    return chalk.redBright(text);
};

export const inf = (text: string) => {
    return chalk.blueBright(text);
};

export const wrn = (text: string) => {
    return chalk.yellowBright(text);
};

export const err = (text: string) => {
    return chalk.redBright(text);
};

export const suc = (text: string) => {
    return chalk.greenBright(text);
};

export const hl = (text: string) => {
    return chalk.bgBlueBright(text);
};

export const hl1 = (text: string) => {
    return chalk.bgMagentaBright(text);
};

export const nv = (name: string, value: string) => {
    return chalk.bgBlueBright(name.padEnd(30, " ")) + " : " + chalk.cyanBright(value);
};

export function runTest() {

    let sec = lh1("Test Heading 1");
    sec.l(imp("This is something important"));
    sec.l("Line 1");
    sec.l("Line 2");
    sec.l("Line INFO: " + imp("This is something important"));
    sec.l("Line WITH ADDITINAL INFO: " + imp("This is something important") + " and this is some additional info");
    sec.l("Test 2:" + imp("An important value"));
    sec.l("Test 3:" + inf("An info value"));
    sec.l("Test 4:" + wrn("An warn value"));
    sec.l("Test 5:" + err("An error value"));
    sec.l("Test 6:" + suc("An success value"));
    sec.l("Test 7:" + hl("An highlight value"));
    sec.l("Test 8:" + hl1("An highlight value"));
    sec.l(nv("Name", "Value"));
    sec.l(nv("Example Name", "http://www.example.com"));
    sec.l(nv("Example Name", "http://www.example.com"));

    sec = sec.lh2("Heading 2");
    sec.l("Test");
    sec.l("Test 2:" + imp("An important value"));
    sec.l("Test 3:" + inf("An info value"));
    sec.l("Test 4:" + wrn("An warn value"));
    sec.l("Test 5:" + err("An error value"));
    sec.l("Test 6:" + suc("An success value"));
    sec.l("Test 7:" + hl("An highlight value"));
    sec.l("Test 8:" + hl1("An highlight value"));
    sec.l(nv("Name", "Value"));
    sec.l(nv("Example Name", "http://www.example.com"));
    sec.l(nv("Example Name", "http://www.example.com"));


    sec = sec.lh3("Head 3");
    sec.l("Test");
    sec.l("Test 2:" + imp("An important value"));
    sec.l("Test 3:" + inf("An info value"));
    sec.l("Test 4:" + wrn("An warn value"));
    sec.l("Test 5:" + err("An error value"));
    sec.l("Test 6:" + suc("An success value"));
    sec.l("Test 7:" + hl("An highlight value"));
    sec.l("Test 8:" + hl1("An highlight value"));
    sec.l(nv("Name", "Value"));
    sec.l(nv("Example Name", "http://www.example.com"));
    sec.l(nv("Example Name", "http://www.example.com"));

}


