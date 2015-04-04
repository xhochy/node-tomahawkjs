#!/usr/bin/env node

var commands = require('./lib/cli/commands.js');
var failOn = require('./lib/cli/utils.js').failOn;

// Parse the commandline arguments
var args = process.argv.slice(2);

// The first argument is the command.
failOn(args.length == 0, "You need to specify the command that shall be executed.");

// Check if we have a matching command defined.
failOn(!commands.hasOwnProperty(args[0]), "The specified command is unknown.");

// Execute the command.
commands[args[0]](args.slice(1));
