#! /usr/bin/env node

var fs = require('fs');
var uploader = require('../uploader');

var args = process.argv.slice(2)
var bucket = args[0];

if (!bucket) {
  // check the value in the local project's package.json
  if (fs.statSync('package.json').isFile()) {
    var packageInfo = JSON.parse(fs.readFileSync('package.json'));
    bucket = packageInfo._s3BucketName
  }
}

if (bucket) {
  console.log("uploading to", bucket);
  uploader({ bucket : bucket })
} else {
  console.error("Please specify the bucket name as the first argument (e.g. static-tools-upload my-bucket)")
}
