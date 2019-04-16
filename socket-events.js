'use strict';

const log = require('./log.js');
const chalk = require('chalk');
const emojic = require('emojic');

const socketEvents = (socket, user) => {
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
};

module.exports = socketEvents;