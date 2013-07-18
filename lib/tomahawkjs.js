var crypto = require('crypto');
var EventEmitter = require('events').EventEmitter;
var http = require('http');
var https = require('https');
var fs = require('fs');
var path = require('path');
var PullStream = require('pullstream');
var unzip = require('unzip');
var url = require('url');
var vm = require('vm');

var _addTrackResults = function (args) {
    var that = this;
    (args.results || []).forEach(function (result) {
        that.events.emit('track-result', args.qid, result);
    });
};

var _addUrlResult = function (url, result) {
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

var _asyncRequest = function (_url, callback, extraHeaders, options) {
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

var _getInstance = function (cb) {
    var that = this;
    fs.readFile(path.resolve(__dirname, 'tomahawk-desktop', 'tomahawk.js'), 'UTF-8', function (err, data) {
        var context = vm.createContext({
            Tomahawk: {
                addTrackResults: _addTrackResults,
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
            }
        });

        // Load standard Tomahawk API
        vm.runInContext(data, context, "tomahawk.js");

        // Sugar Tomahawk object with our interfaces.
        context.Tomahawk.addTrackResults = _addTrackResults;
        context.Tomahawk.addUrlResult = _addUrlResult;
        context.Tomahawk.asyncRequest = _asyncRequest;
        context.on = _onRedirect;

        // Load the resolver
        vm.runInContext(that.sourcecode, context, that.manifest.main);

        // We're done, hand out our fresh instance.
        cb(null, {instance: context.Tomahawk.resolver.instance, context: context});
    });
};

var _onRedirect = function (event, listener) {
    this.Tomahawk.events.on(event, listener);
}

exports.loadAxe = function (filepath, cb) {
    var axe = {};
    // We need to read the axe twice, first for the metadata, then the scripts
    fs.createReadStream(filepath).pipe(unzip.Parse()).on('entry', function (entry) {
        if (entry.path == 'content/metadata.json') {
            var ps = new PullStream();
            entry.pipe(ps)
            ps.pull(function (err, data) {
                axe = JSON.parse(data.toString());
            });
        } else {
            entry.autodrain();
        }
    }).on('close', function () {
        axe.axePath = filepath;
        axe.manifest.scripts = axe.manifest.scripts || [];
        axe.manifest.scripts.push(axe.manifest.main);
        axe.manifest.scripts = axe.manifest.scripts.map(function (item) { return 'content/' + item; });
        // Now parse the sourcecode
        axe.sourcecode = '';
        fs.createReadStream(filepath).pipe(unzip.Parse()).on('entry', function (entry) {
            if (axe.manifest.scripts.indexOf(entry.path) >= 0) {
                var ps = new PullStream();
                entry.pipe(ps);
                entry.on('end', function () {
                    ps.pull(function (err, data) {
                        axe.sourcecode += data.toString();
                    });
                });
            } else {
                entry.autodrain();
            }
        }).on('close', function () {
            axe.getInstance = _getInstance;
            // We're done, return the loaded axe
            cb(null, axe);
        });
    });
};
