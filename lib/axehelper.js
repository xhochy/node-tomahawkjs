/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2013-2014 Uwe L. Korn
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

var crypto = require('crypto');
var EventEmitter = require('events').EventEmitter;
var fs = require('fs');
var path = require('path');
var vm = require('vm');

// Load internal modules
var contexthelper = require('./contexthelper');

// Create a new resolver instance from an axe container
exports.getInstance = function (cb, config) {
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

        // Load the supplied config
        context.config = config;

        // Sugar Tomahawk object with our interfaces.
        context.Tomahawk.addArtistResults = contexthelper.addArtistResults;
        context.Tomahawk.addAlbumResults = contexthelper.addAlbumResults;
        context.Tomahawk.addAlbumTrackResults = contexthelper.addAlbumTrackResults;
        context.Tomahawk.addCustomUrlHandler = contexthelper.addCustomUrlHandler;
        context.Tomahawk.addTrackResults = contexthelper.addTrackResults;
        context.Tomahawk.addUrlResult = contexthelper.addUrlResult;
        context.Tomahawk.asyncRequest = contexthelper.asyncRequest;
        context.Tomahawk.reportStreamUrl = contexthelper.reportStreamUrl;
        context.Tomahawk.base64Encode = contexthelper.base64Encode;
        context.Tomahawk.base64Decode = contexthelper.base64Decode;
        context.Tomahawk.hasCustomUrlHandler = false;

        // Overwrite base resolver functions
        context.TomahawkResolver.getUserConfig = function () {
            return context.config;
        };

        // Capability handling
        context.Tomahawk.capabilities = [];
        context.Tomahawk.reportCapabilities = contexthelper.reportCapabilities;
        context.hasCapability = contexthelper.hasCapability;

        // Other helper interfaces
        context.on = contexthelper.onRedirect;
        context.once = contexthelper.onceRedirect;
        context.getStreamUrl = contexthelper.getStreamUrl;

        // Link some core functions into the context
        context.setInterval = function (cb, ms) {
            var timer = setInterval(cb, ms);
            // Do not register this interval into the main event loop.
            // We want resolvers not to block the process from exiting.
            timer.unref();
        };

        // Load the resolver
        vm.runInContext(that.sourcecode, context, that.manifest.main);

        // We're done, hand out our fresh instance.
        cb(null, {instance: context.Tomahawk.resolver.instance, context: context});
    });
};


