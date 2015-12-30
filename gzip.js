var glob = require('glob');
var fs = require('fs');
var zlib = require("zlib");
var readChunk = require('read-chunk');
var GzipMagic = new Buffer([0x1f, 0x8b]); // gzip files start with this

module.exports = function() {
  glob('public/**/*', function(err, files) {
    if (err) {
      console.error(err);
    } else {
      for (i in files) {
        var file = files[i];
        // if it's already a gzip file (based on magic number) then skip
        var magicNumber = readChunk.sync(file, 0, 2);
        if (!magicNumber.equals(GzipMagic)) {
          // console.log("gzipping", file);
          var contents = fs.readFileSync(file, 'utf-8');
          fs.writeFileSync(file, zlib.gzipSync(contents), 'utf-8');
        }
      }
    }
  })
}
