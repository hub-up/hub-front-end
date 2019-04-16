'use strict';

// Readline
const readline = require('readline');
const options = { input: process.stdin, output: process.stdout, prompt: '» ' };
const rl = readline.createInterface(options);

module.exports = rl;