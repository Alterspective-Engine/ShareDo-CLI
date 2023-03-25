#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var chalk_1 = __importDefault(require("chalk"));
var clear_1 = __importDefault(require("clear"));
var figlet_1 = __importDefault(require("figlet"));
var commander_1 = require("commander");
(0, clear_1.default)();
console.log(chalk_1.default.green(figlet_1.default.textSync('ShareDo', { horizontalLayout: 'full' })));
console.log(chalk_1.default.red(figlet_1.default.textSync('--cli--', { horizontalLayout: 'controlled smushing', font: 'Star Wars' })));
commander_1.program
    .version('0.0.3')
    .description("ShareDo CLI")
    .option('-s, --server', 'serverAlias')
    .option('-P, --publish', 'Publish')
    .option('-f, --folder', 'Folder Path')
    .option('-l, --log <type>', 'specify logging type [verboase,Error,Info]')
    .parse(process.argv);
var options = commander_1.program.opts();
console.log('you executed the cli with:');
if (options.server)
    console.log('  - server');
if (options.publish)
    console.log('  - publish');
if (options.folder)
    console.log('  - folder');
var log = undefined === options.log
    ? 'marble'
    : options.cheese || 'no';
console.log('  - %s log', log);
if (!process.argv.slice(2).length) {
    commander_1.program.outputHelp();
}
