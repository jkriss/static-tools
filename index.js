var async = require('async');
var prettyUrls = require('./pretty-urls');
var fingerprinter = require('./fingerprinter');
var gzip = require('./gzip');

module.exports = function() {
  // TODO respect different public folder
  async.series([fingerprinter, prettyUrls, gzip]);
}
