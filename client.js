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
let socket = io.connect(SERVER_URL);

// Colors
const chalk = require('chalk');

// Emoji
const emojic = require('emojic');

// Readline
const readline = require('readline');
const options = { input: process.stdin, output: process.stdout, prompt: '» ' };
const rl = readline.createInterface(options);

// User object
const user = require('./user.js');

// Chat room instructions
const instructions = require('./instructions');

/*** READLINE CLI INTERFACE ***/
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
const loginUser = () =>
  rl.question(greeting, entry => {
    entry = entry.trim();
    // Check server to see if the username is in use
    socket.emit('is-duplicate', entry);
    // Server returns an is-duplicate event with a Boolean payload
    socket.on('is-duplicate-io', isDuplicate => {
      // If the entry is in use, log it and call the loginUser function recursively
      if (isDuplicate) {
        log(chalk.red(`That username is already in use!`));
        loginUser();
        // Proceed if the entry is not in use as a username
      } else {
        // Base case for the recursion
        if (user.username) {
          return;
        }
        user.setUsername(entry);
        const message = `${chalk.yellow(user.username)} has joined the chat`;
        // Announce user to the server
        socket.emit('login', { message, username: user.username });
        // Shows the prompt character
        rl.prompt(true);
      }
    });
  });

loginUser();

// Basic flow control - prevent spamming
// 10 messages in 4 seconds, then throttled.
// Gotta keep to average of < 1 message per 4 seconds
// Unless they are commands.
// TODO: Include DMs in flow control!
let msgCount = 0;
const msgMax = 10;
const interval = 4000;
setInterval(() => {
  if (msgCount >= 0) {
    msgCount--;
  }
}, interval);

// Input handler
rl.on('line', line => {
  // Flow control
  msgCount++;
  // The maximum length of a message is `maxLength` characters
  // Remove leading or trailing spaces
  line = line.trim();
  const maxLength = 240;
  // If it starts with a slash and text
  if (line[0] === '/' && line.length > 1) {
    // Grab the first set of letters after the slash
    const cmd = line.match(/[a-z]+\b/)[0];
    // Ignoring the first part of the string(`/cmd `), grab the rest
    const arg = line.slice(cmd.length + 2, line.length);
    // Fire off a chat command
    chatCommand(cmd, arg);
    // Flow control
  } else if (msgCount >= msgMax) {
    log(chalk.red(`Message not sent. You're typing up a storm! Wait... ${emojic.scream}`));
  } else if (line.length <= maxLength) {
    // Send chat message to the server
    socket.emit('chat', { message: line, username: user.username, room: user.room });
  } else {
    const { scissors } = emojic;
    const tooLong = chalk.red(
      `Your message can be no more than ${maxLength} characters. ${scissors}`
    );
    log(tooLong);
  }
  // Shows the prompt character
  rl.prompt(true);
});

// Close program
rl.on('close', () => {
  log(`${emojic.smiley} Have a great day! ${emojic.wave}`);
  process.exit(0);
});

/**
 * Handler function for custom chatroom commands
 * @function
 * @name chatCommand
 * @param cmd {string} A reserved command keyword
 * @param arg {object} A payload containing information necessary to execute the command
 **/
function chatCommand(cmd, arg) {
  let message, newNick, oldNick, recipient, room, newRoom;
  switch (cmd) {
    // Exit the program; disconnect from the socket and CLI interface
    case 'bye':
      socket.emit('disconnect-start', user);
      rl.close();
      break;
    // TODO: Needs update: A user can see details: their name, the room they're in, other users in their chat room
    case 'details':
      socket.emit('details', user);
      break;
    // Help menu
    case 'help':
      log(instructions);
      break;
    // User can leave their current room and return to the lobby
    case 'leave':
      room = user.room;
      newRoom = 'Lobby';
      socket.emit('room', { newRoom, room, user });
      break;
    // TODO: User can join an existing room
    case 'join':
      log('TODO');
      break;
    // User can emote
    // TODO: Hook this up to emojic
    case 'me':
      room = user.room;
      message = `${user.username} ${arg}`;
      socket.emit('emote', { message, room });
      break;
    // Users can direct message each other
    case 'msg':
      recipient = arg.match(/[a-z]+\b/i)[0];
      message = arg.slice(recipient.length, arg.length);
      socket.emit('private', { message, to: recipient, from: user.username });
      break;
    // Users can change their usernames
    case 'nick':
      room = user.room;
      oldNick = user.username;
      newNick = arg.match(/[a-z]+\b/i)[0]; // No numbers allowed in a newNick at present
      message = `${chalk.red(oldNick)} changed their name to ${chalk.green(newNick)}`;
      socket.emit('nick', { message, newNick, oldNick, room });
      break;
    case 'launch':
      socket.emit('disconnect-start', { username: user.username });
      socket.disconnect();
      socket = io.connect('http://localhost:3000');
      break;
    // User can create and automatically join a room from the lobby
    case 'room':
      room = user.room;
      newRoom = arg.match(/[a-z]+\b/i)[0]; // new room name
      socket.emit('room', { newRoom, room, user });
      break;
    // Catch-all
    default:
      log(`Invalid command. Type ${chalk.cyan('/help')} for assistance.`);
  }
}

/**
 * SOCKET.IO SERVER EVENTS
 **/
// The regular chat event is received from the server
socket.on('chat-io', payload => {
  const leader = chalk.yellow(`‹${payload.username}›`);
  log(`${leader} ${payload.message}`);
});

// A details event is received from the server
socket.on('details-io', payload => {
  const users = payload.usersDisplay.map(user => chalk.cyan(user)).join(', ');
  const message = `
Your Socket.io client id is ${chalk.cyan(payload.socketId)}
Your username is ${chalk.cyan(payload.username)}
You are one of ${chalk.cyan(payload.usersNum)} users in ${chalk.cyan(payload.room)}
Other users in the room are: ${users}
`;
  log(message);
});

// A disconnect event is received from the server
socket.on('disconnect-io', user => {
  const username = chalk.yellow(user.username);
  log(chalk.cyan(`${emojic.loudspeaker} ${username} has left the chat ${emojic.upsideDownFace}`));
  // Proceed with disconnection
  socket.emit('disconnect');
});

// An emote event is received from the server
socket.on('emote-io', message => {
  log(chalk.magenta(message));
});

// A login event is received from the server
socket.on('login-io', payload => {
  log(chalk.cyan(`${emojic.loudspeaker} ${payload.message} ${emojic.wave}`));
});

// A login-update event is received from the server
// Directed to new user
socket.on('login-update-io', update => {
  const message = chalk.yellow(
    `\n${emojic.grin} Welcome to Hubbub, ${user.username}! ${emojic.wave}`
  );
  const helpCmd = `\nType ${chalk.cyan('/help')} for a list of commands.\n`;
  log(message + helpCmd);

  const { id, room } = update;

  user.setSocketId(id);
  user.setRoom(room);
});

// A nick event is received from the server
socket.on('nick-io', payload => {
  log(chalk.cyan(`${emojic.loudspeaker} ${payload.message}`));
});

// A nick-update event is received from the server
// Only sent to the user who changed their name
socket.on('nick-update-io', payload => {
  const oldNick = chalk.red(user.username);
  user.setUsername(payload.username);
  const newNick = chalk.green(user.username);
  log(chalk.cyan(`Your username has been changed from ${oldNick} to ${newNick}`));
});

// A nick-update-failed event is received from the server
// Only sent to the user who tried to change their name
// Happens when user tries to change their username to one that's already taken
socket.on('nick-update-failed-io', () => {
  log(chalk.red(`That username is already in use!`));
});

// A private event is received from the server
// Only sent to target user
socket.on('private-io', payload => {
  const leader = chalk.magenta(`[${payload.from} → ${payload.to}]`);
  log(`${leader} ${payload.message}`);
});

// A room-join event is received from the server
socket.on('room-join-io', payload => {
  const { newRoom, user } = payload;
  const message = `${chalk.yellow(user.username)} has joined you in ${chalk.green(newRoom)}`;
  log(message);
});

// A room-join-update event is received from the server
// Update the user object with the new room
socket.on('room-join-update-io', payload => {
  const message = `You have joined ${chalk.cyan(payload.newRoom)}`;
  user.setRoom(payload.newRoom);
  log(message);
});

// A room-leave event is received from the server
socket.on('room-leave-io', payload => {
  const { user, room, newRoom } = payload;
  const message = `${chalk.yellow(user.username)} has left ${chalk.red(
    room
  )} and joined ${chalk.green(newRoom)}`;
  log(message);
});
