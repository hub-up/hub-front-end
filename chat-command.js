'use strict';

// Socket.io
const io = require('socket.io-client');

const chalk = require('chalk');

const rl = require('./readline-interface.js');
const log = require('./log.js');

// Chat room instructions
const instructions = require('./instructions');

/**
 * Handler function for custom chatroom commands
 * @function
 * @name chatCommand
 * @param cmd {string} A reserved command keyword
 * @param arg {object} A payload containing information necessary to execute the command
 **/

/*
from client we query object and get Object.keys => array of the keys
then for each object[key] we will expect there to be a instructions property
the instructions are what pops up in the /help command

The remote export looks like: 
module.exports = 
{ 
  bye: {
    instructions: '/bye says bye',
    logic: () => {
      socket.emit....
      rl.close....
     }
   }
}
*/




function chatCommand(cmd, arg, socket, user) {
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
      socket = io.connect('http://localhost:3333');
      console.log(user);
      socket.emit('user', user);
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
  

module.exports = chatCommand;