'use strict';

const rl = require('./readline-interface.js');
const log = require('./log.js');

const chalk = require('chalk');
const emojic = require('emojic');

// handleQuestion
function handleQuestion(entry = null, socket, user, loginUser) {
  // Don't go down the recursive rabbit hole with no entry
  if (!entry) {
    // TODO
    log('TODO: Handle no entry better');
    socket.emit('disconnect');
    rl.close();
  }
  let trimmed = entry.trim();
  // Check server to see if the username is in use
  if (trimmed) {
    socket.emit('is-duplicate', trimmed);
  }
  // Server returns an is-duplicate event with a Boolean payload
  socket.on('is-duplicate-io', isDuplicate => {
    if (!trimmed) {
      return;
    }
    // If the entry is in use, log it and call the loginUser function recursively
    if (isDuplicate) {
      log(chalk.red(`That username is already in use!`));
      trimmed = null;
      return loginUser();
      // Proceed if the entry is not in use as a username
    } else {
      // Base case for the recursion
      if (user.username) {
        return;
      }
      user.setUsername(trimmed);
      const message = `${chalk.yellow(user.username)} has joined the chat`;
      // Announce user to the server
      socket.emit('login', { message, username: user.username });
      // Shows the prompt character
      rl.prompt(true);
    }
  });
}

function handleLine(line, socket, user, chatCommand) {
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
    chatCommand(cmd, arg, socket, user);
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
}
  
function handleClose() {
  log(`${emojic.smiley} Have a great day! ${emojic.wave}`);
  process.exit(0);
}
  


module.exports = {handleClose, handleLine, handleQuestion };