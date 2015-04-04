#!/usr/bin/env node

var commands = require('./lib/cli/commands.js');

// Parse the commandline arguments
var args = process.argv.slice(2);

// The first argument is the command.
if (args.length == 0) {
    console.error("You need to specify the command that shall be executed.")
    process.exit(1);
}

if (commands.hasOwnProperty(args[0])) {
    commands[args[0]](args.slice(1));
} else {
    console.error("The specified command is unknown.");
    process.exit(1);
}
