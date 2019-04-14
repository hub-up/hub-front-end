'use strict';

// User object with all the relevant properties and state.
// Will hold auth tokens, database info, and persist while the user is logged in.
class User {
  constructor() {
    this.username = null;
    this.socketId = null;
  }
  setUsername(name) {
    this.username = name;
  }
  setSocketId(id) {
    this.socketId = id;
  }
}

// Exports an instance of the user
module.exports = new User();
