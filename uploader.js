var glob = require('glob');
var AWS = require('aws-sdk');
var s3 = new AWS.S3({apiVersion: '2006-03-01'});
var path = require('path');
var fs = require('fs');
var mime = require('mime');

// TODO make this a configuration / argument thing
var bucket = 'modelterms.com';

glob('public/**/*', function(err, files) {
  if (err) {
    console.error(err)
  } else {
    for (var i in files) {
      var file = files[i];
      var relativePath = path.relative('public', file);
      console.log("relative path:", relativePath);
      var params = {
        Bucket : bucket,
        Key : relativePath,
        ContentEncoding : 'gzip'
      }
      if (path.basename(relativePath).match(/[0-9a-f]{32}-/)) {
        var hash = path.basename(relativePath).split('-')[0];
        params.CacheControl = 'public, max-age=2592000',
        // TODO set etag?
        // params.ContentMD5 = hash,
        params.Expires = new Date().getTime()+2592000000 // 1 month from now
      }
      if (path.extname(relativePath) === '') {
        params.ContentType = 'text/html'
      } else {
        params.ContentType = mime.lookup(relativePath);
      }
      console.log(params);
      params.Body = fs.readFileSync(file);
      s3.putObject(params, function(err, res) {
        if (err) {
          console.error(err);
        } else {
          console.log(res);
        }
      })
    }
  }
})
