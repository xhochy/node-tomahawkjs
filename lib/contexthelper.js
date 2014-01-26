var http = require('http');
var https = require('https');
var url = require('url');

// Proxy to emit artists-result event
exports.addArtistResults = function (args) {
    this.events.emit('artists-result', args.qid, args.artists);
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
        var req = https.request(params, requestHandler);
    } else {
        var req = http.request(params, requestHandler);
    }
    return req;
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
    req.on('error', function () {
        if (opt.hasOwnProperty('errorHandler')) {
            opt.errorHandler({});
        };
    });
    req.end();
};

exports.onRedirect = function (event, listener) {
    this.Tomahawk.events.on(event, listener);
}

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
    return (this.Tomahawk.capabilities.indexOf(capability) >= 0)
};

