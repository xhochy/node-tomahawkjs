var crypto = require('crypto');
var EventEmitter = require('events').EventEmitter;
var fs = require('fs');
var path = require('path');
var vm = require('vm');

// Load internal modules
var contexthelper = require('./contexthelper');

// Create a new resolver instance from an axe container
exports.getInstance = function (cb) {
    var that = this;
    // Load the javascript helpers that are shipped with the desktop version of Tomahawk
    fs.readFile(path.resolve(__dirname, 'tomahawk-desktop', 'tomahawk.js'), 'UTF-8', function (err, data) {
        var context = vm.createContext({
            Tomahawk: {
                events: new EventEmitter(),
                log: function (data) {
                    console.log(data);
                },
                resolverData: function () {
                    return {
                        scriptPath: function () {
                            return that.manifest.main;
                        }
                    };
                },
                setInterval: setInterval,
                setTimeout: setTimeout,
                sha256: function (string) {
                    return crypto.createHash("sha256").update(string).digest('base64');
                }
            },
            // There is no windows object in Node but some resolvers are assuming to be run in
            // a browser process and store data in localStorage and sessionStorage.
            // TODO: Make these variables persistent.
            window: {
                localStorage: {},
                sessionStorage: {}
            }
        });

        // Load standard Tomahawk API
        vm.runInContext(data, context, "tomahawk.js");

        // Sugar Tomahawk object with our interfaces.
        context.Tomahawk.addArtistResults = contexthelper.addArtistResults;
        context.Tomahawk.addTrackResults = contexthelper.addTrackResults;
        context.Tomahawk.addUrlResult = contexthelper.addUrlResult;
        context.Tomahawk.asyncRequest = contexthelper.asyncRequest;
        // Capability handling
        context.Tomahawk.capabilities = [];
        context.Tomahawk.reportCapabilities = contexthelper.reportCapabilities;
        context.hasCapability = contexthelper.hasCapability;
        context.on = contexthelper.onRedirect;

        // Load the resolver
        vm.runInContext(that.sourcecode, context, that.manifest.main);

        // We're done, hand out our fresh instance.
        cb(null, {instance: context.Tomahawk.resolver.instance, context: context});
    });
};


