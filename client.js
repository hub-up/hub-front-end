#!/usr/bin/env node
'use strict';

/***
 * Socket.io client and command line interface
 * @module client
 ***/



/*** IMPORTS AND INITIALIZATION ***/
require('dotenv').config();
const SERVER_URL = require('./server-url.js');
console.log(`Hubbub client up and running!\nConnecting to the server at: ${SERVER_URL}`);

// Socket.io
const io = require('socket.io-client');
const socket = io.connect(SERVER_URL);
const socketEvents = require('./socket-events.js');

// Colors
const chalk = require('chalk');

// Readline Interface
const rl = require('./readline-interface.js');
const { handleQuestion, handleLine, handleClose } = require('./readline-handlers.js');

// Chat Commands
const chatCommand = require('./chat-command.js');

// User object
const user = require('./user.js');

/*** READLINE CLI INTERFACE ***/
// greeting used in loginUser function
const welcome = chalk.underline.bold(`\nWelcome to Hubbub!\n`);
const usernamePrompt = `\nPlease enter a username: `;
const greeting = chalk.white(welcome + usernamePrompt);

/***
 * loginUser returns a readline question prompt with a callback that
 * queries the server for the user's username input and requests a new
 * username entry if there is a duplicate. Otherwise, it adds the username
 * to the user object, emits a login event, and sets a sticky prompt.
 * @function
 * @name loginUser
 ***/
const loginUser = () => {
  rl.question(greeting, entry => handleQuestion(entry, socket, user, loginUser));
};
loginUser();

// Input handler
rl.on('line', line => handleLine(line, socket, user, chatCommand));

// Close program
rl.on('close', handleClose);

// Socket event handlers
socketEvents(socket, user);