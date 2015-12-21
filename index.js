var async = require('async');
var prettyUrls = require('./pretty-urls');
var fingerprinter = require('./fingerprinter');
var gzip = require('./gzip');

async.series([fingerprinter, prettyUrls, gzip]);
