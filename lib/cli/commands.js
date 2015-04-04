var fs = require('fs');
var TomahawkJS = require('tomahawkjs');
var failOn = require('./utils').failOn;

exports.generate = function (args) {
    failOn(args.length !== 1, "You need to specify the name of the new resolver.");
    console.error("Not yet implemented. Please stand by!");
    // FIXME: Implement!
};

exports.resolve = function (args) {
    failOn(args.length == 0, "You need to specify a resolver to utilise.");
    failOn(args.length < 3 || args.length > 4, "Usage: \n\t tomahawkjs resolve <resolver> <artist> <title> [<album>]");
    fs.stat(args[0], function (err, stats) {
        failOn(err, "Error while reading the resolver path:", err);
        if (stats.isFile()) {
            // Load the resolver from a (zipped) bundle.
            TomahawkJS.loadAxe(args[0], function (err, axe) {
                failOn(err, "Error while loading axe:", err);
                axe.getInstance(function(err, instance_context) {
                    failOn(err, "Could not instantiate a resolver object:", err);
                    var instance = instance_context.instance;
                    var context = instance_context.context;
                    instance.init();
                    context.on('track-result', function (qid, result) {
                        console.log(JSON.stringify(result, null, 4));
                    });
                    instance.resolve("some-id", args[1], args[3], args[2]);
                });
            });
        } else if (stats.isDirectory()) {
            // Load the resolver from a directory.
            // FIXME: Implement!
        } else {
            // Will be interesting what kind of fs type people will access here
            console.error("Unsupported FS item for a resolver bundle.");
            process.exit(1);
        }
    });
};


