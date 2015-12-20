var prettyUrls = require('./pretty-urls');
var gzip = require('./gzip');

prettyUrls(function(err, cb) {
  if (err) {
    console.error(err);
  } else {
    gzip();  
  }
});
