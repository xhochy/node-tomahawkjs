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

var http = require('http');
var https = require('https');
var url = require('url');

// Proxy to emit album-result event
exports.addAlbumResults = function (args) {
    this.events.emit('album-results', args.qid, args.artist, args.albums);
};

// Proxy to emit albumtrack-results event
exports.addAlbumTrackResults = function (args) {
    this.event.emit('albumtrack-results', args.qid, args.artist, args.album, args.results);
};

// Proxy to emit artists-result event
exports.addArtistResults = function (args) {
    this.events.emit('artist-results', args.qid, args.artists);
};

exports.addCustomUrlHandler = function (prefix, funcname, async) {
    this.hasCustomUrlHandler = true;
    this.customUrlHandlerName = funcname;
    this.customUrlPrefix = prefix;
    this.isCustomUrlHandlerAsync = async;
};

exports.getStreamUrl = function (qid, url) {
    this.Tomahawk.resolver.instance[this.Tomahawk.customUrlHandlerName](qid, url);
};

exports.reportStreamUrl = function(qid, url) {
    this.events.emit('stream-url', qid, url);
};

exports.addTrackResults = function (args) {
    var that = this;
    (args.results || []).forEach(function (result) {
        that.events.emit('track-result', args.qid, result);
    });
};

exports.addUrlResult = function (url, result) {
    this.events.emit('url-result', url, result);
};

var handleHttpRequest = function (params, callback) {
    var requestHandler = function (res) {
        if (res.statusCode > 300 && res.statusCode < 400 && res.headers.location) {
            // redirect detected
            var parsedUrl = url.parse(res.headers.location);
            for (var attr in parsedUrl) {
                if (parsedUrl.hasOwnProperty(attr))
                    params[attr] = parsedUrl[attr];
            }
            var req = handleHttpRequest(params, callback);
            req.end();
        } else {
            var data = '';
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                data += chunk;
            }).on('end', function () {
                callback({responseText: data});
            });
        }
    };
    if (params.protocol == 'https:') {
        return https.request(params, requestHandler);
    }
    return http.request(params, requestHandler);
};

exports.asyncRequest = function (_url, callback, extraHeaders, options) {
    // unpack options
    var opt = options || {};
    var method = opt.method || 'GET';

    var params = url.parse(_url);
    params.agent = false;
    params.method = method;
    params.headers = extraHeaders;
    if (opt.hasOwnProperty('username') && opt.hasOwnProperty('password')) {
        params.auth = opt.username + ':' + opt.password;
    }
    var req = handleHttpRequest(params, callback);
    if (method.toLowerCase() == "post") {
        req.write(options.data);
    }
    req.on('error', function () {
        if (opt.hasOwnProperty('errorHandler')) {
            opt.errorHandler({});
        }
    });
    req.end();
};

exports.onceRedirect = function (event, listener) {
    this.Tomahawk.events.once(event, listener);
};

exports.onRedirect = function (event, listener) {
    this.Tomahawk.events.on(event, listener);
};

exports.reportCapabilities = function (capabilities) {
    this.capabilities = [];
    if ((1 & capabilities) !== 0) {
        this.capabilities.push('browsable');
    }
    if ((2 & capabilities) !== 0) {
        this.capabilities.push('playlistsync');
    }
    if ((4 & capabilities) !== 0) {
        this.capabilities.push('accountfactory');
    }
    if ((8 & capabilities) !== 0) {
        this.capabilities.push('urllookup');
    }
};

exports.hasCapability = function (capability) {
    return (this.Tomahawk.capabilities.indexOf(capability) >= 0);
};

exports.base64Encode = function (text) {
    return new Buffer(text).toString('base64');
};

exports.base64Decode = function (text) {
    return new Buffer(text, "base64").toString();
};
