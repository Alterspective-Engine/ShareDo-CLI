#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var chalk_1 = __importDefault(require("chalk"));
var clear_1 = __importDefault(require("clear"));
var figlet_1 = __importDefault(require("figlet"));
// import {program} from '@commander-js/extra-typings';
var extra_typings_1 = require("@commander-js/extra-typings");
(0, clear_1.default)();
console.log(chalk_1.default.green(figlet_1.default.textSync('ShareDo', { horizontalLayout: 'full' })));
console.log(chalk_1.default.red(figlet_1.default.textSync('--cli--', { horizontalLayout: 'controlled smushing', font: 'Star Wars' })));
var program = new extra_typings_1.Command()
    .name('sharedo')
    .version('0.0.3')
    .description("ShareDo CLI")
    .command('dev', 'Commands to develop on the ShareDo.');
// .option('-l, --log <type>', 'specify logging type [verboase,Error,Info]');
// .command('connect', 'connect to a server')
// .command('publish', 'publish a folder')
// .command('download', 'download a item')
try {
    program.parse(process.argv);
}
catch (e) {
    console.log("e", e);
}
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
