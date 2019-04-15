'use strict';

// Colors
const chalk = require('chalk');

const instructions = `        
${chalk.underline.bold('Chat Commands')}
/bye ← Disconnect from the server and exit the program
/details ← See your name, the room you're in, and a list of other users in your current room
/help ← This menu
/leave  ← TODO: Leave the current room and return to the lobby
/join ${chalk.blue('room')} ← TODO: Join the ongoing chat in ${chalk.blue('room')}
/me :D ← ${chalk.magenta(':D')}
/msg ${chalk.yellow('user')} ← Send a direct message to ${chalk.yellow('user')}
/nick ${chalk.cyan('username')} ← Update your username to ${chalk.cyan('username')}
/room ${chalk.green('name')} ← TODO: Create and automatically join a room called ${chalk.green('name')}
/launch ← send me to a game!
`;

module.exports = instructions;
