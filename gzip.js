var glob = require('glob');
var fs = require('fs');
var zlib = require("zlib");

module.exports = function() {
  glob('public/**/*', function(err, files) {
    if (err) {
      console.error(err);
    } else {
      for (i in files) {
        var file = files[i];
        console.log(file);
        var contents = fs.readFileSync(file, 'utf-8');
        fs.writeFileSync(file, zlib.gzipSync(contents), 'utf-8');
      }
    }
  })
}
