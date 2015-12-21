var crypto = require('crypto');
var cheerio = require('cheerio');
var glob = require("glob")
var fs = require('fs');
var mv = require('mv');
var path = require('path');
var KEY = 'static-fingerprinter';

var mapping = {}

var rewriteLinks = function(path) {
  var contents = fs.readFileSync(path, 'utf-8');

  var $ = cheerio.load(contents, {
    normalizeWhitespace: true
  });

  // handle link and script tags

  var links = $('link, script');
  links.each(function() {
    var tag = $(this);
    var urlAttr = this.name === 'link' ? 'href' : 'src';
    console.log("looking for attribute", urlAttr, "for", this.name)
    var url = tag.attr(urlAttr);
    if (url) {
      console.log("url was:", url);
      var newUrl = mapping[url];
      // only rewrite internal links
      if (!url.match(/https?:\/\//)) {
        tag.attr(urlAttr, newUrl);
      }      
    }
  })

  return $.html()
}

var generateFingerprints = function() {
  glob('public/**/*.?(js|css)', function(err, files) {
    if (err) {
      console.error(err);
    } else {
      for (var i in files) {
        var file = files[i];
        var fingerprint = crypto.createHmac('md5', KEY).update(fs.readFileSync(file)).digest('hex')
        var newFilename = file.replace(path.basename(file), fingerprint+'-'+path.basename(file));
        // TODO this needs to be a relative path
        mapping[file.replace('public/','')] = newFilename.replace('public/','');
        // console.log(file, newFilename);
        // this is async
        mv(file, newFilename, {}, function(err) {
          if (err) console.error(err);
        });
      }
      console.log("mappings:", mapping);
    }
  })
}

module.exports = function(cb) {

  generateFingerprints();

  glob('public/**/*.html', function(err, files) {
    if (err) {
      console.error(err);
      cb(err);
    } else {
      for (var i in files) {
        var file = files[i];
        console.log(file)
        var newContent = rewriteLinks(files[i]);
        // console.log(newContent)
        fs.writeFileSync(file, newContent, 'utf-8');
      }
      if (cb) cb(null);
    }
  })
}
