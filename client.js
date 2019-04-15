'use strict';

/***
 * Socket.io client and command line interface
 * @module client
 ***/

/*** IMPORTS AND INITIALIZATION ***/
require('dotenv').config();

// Socket.io
const io = require('socket.io-client');
const SERVER_URL = /* process.env.SERVER_URL || */ `http://localhost:3000`;
const socket = io.connect(SERVER_URL);

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
  rl.prompt();
};

// Sign in as username
const welcome = chalk.underline.bold(`\nWelcome to Hubbub!`);
rl.question(chalk.white(`${welcome}\n\nPlease enter a username: `), entry => {
  if (entry) {
    user.setUsername(entry.trim());
    const message = `${chalk.yellow(user.username)} has joined the chat`;
    // Announce user to the server
    socket.emit('login', { message, username: user.username });
    // Shows the prompt character
    rl.prompt();
  } else {
    // TODO This doesn't keep them from signing in to listen
    log('Please enter a username.');
  }
});

// Input handler
rl.on('line', line => {
  line = line.trim();
  // If it starts with a slash and text
  if (line[0] === '/' && line.length > 1) {
    // Grab the first set of letters after the slash
    const cmd = line.match(/[a-z]+\b/)[0];
    // Ignoring the first part of the string(`/cmd `), grab the rest
    const arg = line.slice(cmd.length + 2, line.length);
    // Fire off a chat command
    chatCommand(cmd, arg);
  } else {
    // Send chat message to the server
    socket.emit('chat', { message: line, username: user.username, room: user.room });
  }
  // Shows the prompt character
  rl.prompt();
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
      newRoom = 'lobby';
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
      message = arg.substr(recipient.length, arg.length);
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
  // TODO should indicate the namespace
  const message = `${emojic.grin} Welcome to the server, ${user.username}! ${emojic.wave}`;
  log(chalk.yellow(message));

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
socket.on('nick-update-failed-io', payload => {
  log(chalk.red(`The username '${payload.username}' is already taken`));
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

// Update the user object
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
