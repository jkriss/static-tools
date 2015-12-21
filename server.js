
var express = require('express')
var serveStatic = require('serve-static')
var app = express()
var Path = require('path');

var port = 3000;

app.use(serveStatic('public', {
  index : 'index', // since we're stripping .html
  setHeaders: setHeaders,
  etag : false,
  lastModified : false
}))

function setHeaders(res, path) {
  console.log("serving", path)
  // TODO if path matches a fingerprint, then send far future expires
  // TODO also use as etag?
  if (Path.extname(path) === '') {
    res.setHeader('Content-Type', 'text/html')
  }
  res.setHeader('Content-Encoding', 'gzip')
}

app.listen(port);
console.log("listening at http://localhost:"+port);
