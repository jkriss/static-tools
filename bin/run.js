#! /usr/bin/env node

var async = require('async');
var prettyUrls = require('../pretty-urls');
var fingerprinter = require('../fingerprinter');
var gzip = require('../gzip');

async.series([fingerprinter, prettyUrls, gzip]);

console.log("running static-tools");
