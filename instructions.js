'use strict';

// Colors
const chalk = require('chalk');

const todo = chalk.yellow('TODO: ');

const instructions = `
${chalk.underline.bold('Chat Commands')}
/bye ← Disconnect from the server and exit the program
/details ← ${todo}Needs update: See your name, the room you're in, and a list of other users in your current room
/help ← This menu
/launch ← ${todo}Send me to a game!
/leave  ← Leave the current room and return to the lobby
/join ${chalk.blue('room')} ← ${todo}Join the ongoing chat in ${chalk.blue('room')}
/me :D ← ${todo}Should be hooked to emojic. ${chalk.magenta(':D')}
/msg ${chalk.yellow('user')} ← Send a direct message to ${chalk.yellow('user')}
/nick ${chalk.cyan('username')} ← Update your username to ${chalk.cyan('username')}
/room ${chalk.green('name')} ← Create and automatically join a room called ${chalk.green('name')}
`;

module.exports = instructions;
