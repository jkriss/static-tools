var argv = require('minimist')(process.argv.slice(2));
var cheerio = require('cheerio');
var glob = require("glob")
var fs = require('fs');
var del = require('del');
var path = require('path');

var rewriteHtmlLinks = function(path) {
  var contents = fs.readFileSync(path, 'utf-8');

  var $ = cheerio.load(contents, {
    normalizeWhitespace: true
  });

  var links = $('a');
  links.each(function() {
    var a = $(this);
    var href = a.attr('href');
    // console.log("href was:", href)
    // only rewrite internal links
    if (!href.match(/https?:\/\//)) {
      var newHref = href.replace(/\.html$/,'');
      // console.log("new href:", newHref);
      a.attr('href', newHref);
    }
  })

  return $.html()
}

var processPublicHtmlFiles = function(cb) {
  glob('public/**/*.html', function(err, files) {
    if (err) {
      console.error(err);
      cb(err);
    } else {
      for (var i in files) {
        var file = files[i];
        var newContent = rewriteHtmlLinks(files[i]);
        var newPath = path.basename(file) === 'index.html' ? file : file.replace(/\.html$/, '')
        fs.writeFileSync(newPath, newContent, 'utf-8');
      }
      // remove old .html files
      del.sync(['public/**/*.html', '!public/**/index.html']);
      cb(null);
    }
  })
}

module.exports = processPublicHtmlFiles;
