var fs = require('fs');
var TomahawkJS = require('tomahawkjs');
var failOn = require('./utils').failOn;

/**
 * Load an AXE bundle and terminate on errors.
 */
var loadResolver = function (path, callback) {
    fs.stat(path, function (err, stats) {
        failOn(err, "Error while reading the resolver path:", err);
        if (stats.isFile()) {
            TomahawkJS.loadAxe(path, function (err, axe) {
                failOn(err, "Error while loading axe:", err);
                axe.getInstance(function(err, instance_context) {
                    failOn(err, "Could not instantiate a resolver object:", err);
                    var instance = instance_context.instance;
                    var context = instance_context.context;
                    if (instance.init.length > 0) {
                        // init takes a callback, so we wait until the callback gets invoked.
                        instance.init(function (err) {
                            failOn(err, "Could not initialise the resolver object:", err);
                            callback(instance, context);
                        });
                    } else {
                        // init does not accept a callback and thus we assume it is sync
                        instance.init();
                        callback(instance, context);
                    }
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

exports.generate = function (args) {
    failOn(args.length !== 1, "You need to specify the name of the new resolver.");
    console.error("Not yet implemented. Please stand by!");
    // FIXME: Implement!
};

exports.resolve = function (args) {
    failOn(args.length === 0, "You need to specify a resolver to utilise.");
    failOn(args.length < 3 || args.length > 4, "Usage: \n\t tomahawkjs resolve <resolver> <artist> <title> [<album>]");
    loadResolver(args[0], function (instance, context) {
        context.on('track-result', function (qid, result) {
            console.log(JSON.stringify(result, null, 4));
        });
        instance.resolve("some-id", args[1], args[3], args[2]);
    });
};

exports.search = function (args) {
    failOn(args.length === 0, "You need to specify a resolver to utilise.");
    failOn(args.length < 2, "Usage: \n\t tomahawkjs search <resolver> <query-part1> [<query-part2> ..]");
    loadResolver(args[0], function (instance, context) {
        context.on('track-result', function (qid, result) {
            console.log(JSON.stringify(result, null, 4));
        });
        instance.search("some-id", args.slice(1).join(' '));
    });
};
