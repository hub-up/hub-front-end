'use strict';

const rl = require('./readline-interface.js');

/**
 * Helper function that preserves the prompt and cursor position,
 * as `console.log()` seems to interfere with the readline interface
 * @function
 * @name log
 * @param msg {string} A message to log to the console
 **/
const log = msg => {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  console.log(msg);
  
  // Shows the prompt character
  rl.prompt(true);
};

module.exports = log;