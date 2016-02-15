var glob = require('glob');
var fs = require('fs');
var zlib = require('zlib');
var isGzip = require('is-gzip-file');
var mime = require('mime');

module.exports = function() {
  glob('public/**/*', function(err, files) {
    if (err) {
      console.error(err);
    } else {
      for (i in files) {
        var file = files[i];
        // if it's already a gzip file then skip
        if (!isGzip(file)) {
          // console.log("gzipping", file);
          var contents = fs.readFileSync(file);
          fs.writeFileSync(file, zlib.gzipSync(contents, { level : 9 }));
        }
      }
    }
  })
}
