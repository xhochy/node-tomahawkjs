var fs = require('fs');
var TomahawkJS = require('tomahawkjs');

exports.generate = function (args) {
    if (args.length !== 1) {
        console.error("You need to specify the name of the new resolver.");
        process.exit(1);
    }
    console.error("Not yet implemented. Please stand by!");
    // FIXME: Implement!
};

exports.resolve = function (args) {
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
            TomahawkJS.loadAxe(args[0], function (err, axe) {
                if (err) {
                    console.error("Error while loading axe:");
                    console.error(err);
                    process.exit(1);
                }
                axe.getInstance(function(err, instance_context) {
                    if (err) {
                        console.error("Could not instantiate a resolver object:");
                        console.error(err);
                        process.exit(1);
                    }
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


