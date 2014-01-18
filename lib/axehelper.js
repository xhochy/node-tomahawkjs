var crypto = require('crypto');
var EventEmitter = require('events').EventEmitter;
var fs = require('fs');
var vm = require('vm');

// Load internal modules
var contexthelper = require('./contexthelper');

exports.getInstance = function (cb) {
    var that = this;
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
            window: {
                localStorage: {},
                sessionStorage: {}
            }
        });

        // Load standard Tomahawk API
        vm.runInContext(data, context, "tomahawk.js");

        // Sugar Tomahawk object with our interfaces.
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


