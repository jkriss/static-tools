
var express = require('express')
var serveStatic = require('serve-static')
var app = express()
var Path = require('path');

var port = 3000;

app.use(serveStatic('public', {
  setHeaders: setHeaders
}))

function setHeaders(res, path) {
  console.log("serving", path)
  if (Path.extname(path) === '') {
    res.setHeader('Content-Type', 'text/html')
  }
  // if it's fingerprinted, use that as the etag
  if (Path.basename(path).match(/[0-9a-f]{32}-/)) {
    var hash = Path.basename(path).split('-')[0];
    res.setHeader('Etag', '"'+hash+'"');
    res.setHeader('Cache-Control', 'public, max-age=2592000'); // 1 month
  }
  res.setHeader('Content-Encoding', 'gzip')
}

app.listen(port);
console.log("listening at http://localhost:"+port);
