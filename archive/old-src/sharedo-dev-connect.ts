#!/usr/bin/env node

import { Command } from '@commander-js/extra-typings';
import { connect } from './connect/connect.js';


const program = new Command()
  .option('-f, --force', 'force installation');

program.parse(process.argv);

connect();