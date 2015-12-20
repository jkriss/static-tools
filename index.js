
var express = require('express')
var serveStatic = require('serve-static')
var app = express()
var Path = require('path');

app.use(serveStatic('public', {
  setHeaders: setHeaders,
  etag : false
}))

function setHeaders(res, path) {
  console.log("serving", path)
  if (Path.extname(path) === '') {
    res.setHeader('Content-Type', 'text/html')
  }
  res.setHeader('Content-Encoding', 'gzip')
}

app.listen(3000)
