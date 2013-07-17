var fs = require('fs');
var PullStream = require('pullstream');
var unzip = require('unzip');
var vm = require('vm');

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
                ps.pull(function (err, data) {
                    axe.sourcecode += data.toString();
                });
            } else {
                entry.autodrain();
            }
        }).on('close', function () {
            // We're done, return the loaded axe
            cb(axe);
        });
    });
};
