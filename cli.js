#!/usr/bin/env node

var fs = require('fs');

// Parse the commandline arguments
var args = process.argv.slice(2);

// The first argument is the command.
if (args.length == 0) {
    console.error("You need to specify the command that shall be executed.")
    process.exit(1);
}

var commands = {
    "generate": function (args) {
        if (args.length !== 1) {
            console.error("You need to specify the name of the new resolver.");
            process.exit(1);
        }
        console.error("Not yet implemented. Please stand by!");
        // FIXME: Implement!
    },
    "resolve": function (args) {
        if (args.length == 0) {
            console.error("You need to specify a resolver to utilise.");
            process.exit(1);
        }
        if (args.length < 3 || args.length > 4) {
            console.error("Usage: \n\t tomahawkjs resolve <resolver> <artist> <title> [<album>]");
            process.exit(1);
        }
        fs.stat(args[0], function (err, stats) {
            if (err) {
                console.error("Error while reading the resolver path:");
                console.error(err);
                process.exit(1);
            }
            if (stats.isFile()) {
                // Load the resolver from a (zipped) bundle.
                // FIXME: Implement!
            } else if (stats.isDirectory()) {
                // Load the resolver from a directory.
                // FIXME: Implement!
            } else {
                // Will be interesting what kind of fs type people will access here
                console.error("Unsupported FS item for a resolver bundle.");
                process.exit(1);
            }
        });
    }
}

if (commands.hasOwnProperty(args[0])) {
    commands[args[0]](args.slice(1));
} else {
    console.error("The specified command is unknown.");
    process.exit(1);
}
