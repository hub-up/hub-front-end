'use strict';

// Colors
const chalk = require('chalk');

const todo = chalk.yellow('TODO');

const instructions = `
${chalk.underline.bold('Chat Commands')}
/bye ← Disconnect from the server and exit the program
/details ← ${todo}: Needs update: See your name, the room you're in, and a list of other users in your current room
/help ← This menu
/leave  ← Leave the current room and return to the lobby
/join ${chalk.blue('room')} ← ${todo}: Join the ongoing chat in ${chalk.blue('room')}
/me :D ← ${todo}: Should be hooked to emojic. ${chalk.magenta(':D')}
/msg ${chalk.yellow('user')} ← Send a direct message to ${chalk.yellow('user')}
/nick ${chalk.cyan('username')} ← Update your username to ${chalk.cyan('username')}
<<<<<<< HEAD
/room ${chalk.green('name')} ← TODO: Create and automatically join a room called ${chalk.green('name')}
/launch ← send me to a game!
=======
/room ${chalk.green('name')} ← Create and automatically join a room called ${chalk.green('name')}
>>>>>>> 9519eeb05669323a5f24ddda7430ae748e5cb484
`;

module.exports = instructions;
