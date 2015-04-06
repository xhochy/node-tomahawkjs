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

var async = require('async');
var fs = require('fs');
var path = require('path');
var PullStream = require('pullstream');
var unzip = require('unzip');

// Load internal modules
var axehelper = require('./axehelper.js');

exports.loadAxe = function (filepath, cb) {
    var axe = {};
    // We need to read the axe twice, first for the metadata, then the scripts
    fs.createReadStream(filepath).pipe(unzip.Parse()).on('entry', function (entry) {
        if (entry.path == 'content/metadata.json') {
            var ps = new PullStream();
            entry.pipe(ps);
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
            axe.getInstance = axehelper.getInstance;
            // We're done, return the loaded axe
            cb(null, axe);
        });
    });
};

exports.loadDirectory = function (dirpath, cb) {
    var metadataPath = path.join(dirpath, 'content', 'metadata.json');
    fs.readFile(metadataPath, function (err, data) {
        if (err) {
            cb(err, null);
        } else {
            axe = JSON.parse(data.toString());
            axe.axePath = dirpath;
            axe.manifest.scripts = axe.manifest.scripts || [];
            axe.manifest.scripts.push(axe.manifest.main);
            axe.manifest.scripts = axe.manifest.scripts.map(function (item) { return path.join(dirpath, 'content', item); });
            async.map(axe.manifest.scripts, fs.readFile, function (err, scripts) {
                axe.sourcecode = scripts.map(function (item) {
                    return item.toString();
                }).join('\n');
                axe.getInstance = axehelper.getInstance;
                cb(null, axe);
            });
        }
    });
};
