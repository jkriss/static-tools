#! /usr/bin/env node
// cp -r examples/ public/ && cat examples/index.html | node cmd/combine.js --base examples/ > public/index.html
// cp -r examples/ public/ && cat examples/index.html | node cmd/combine.js --external --base examples/ > public/index.html

var argv = require('minimist')(process.argv.slice(2));
var concat = require('concat-stream')
var cheerio = require('cheerio')
var fs = require('fs')
var path = require('path')
var mkdirp = require('mkdirp')
var crypto = require('crypto')
var KEY = 'static-fingerprinter'
var request = require('sync-request');
var glob = require("glob")
var async = require('async')
var UglifyJS = require('uglify-js')
var CleanCSS = require('clean-css')
var minifyCss = new CleanCSS()

var base = argv.base || `${process.cwd()}/`
var strip = argv.strip
var skipInlineJs = argv['skip-inline-js']
var outputDir = argv.output || base
var extrasPath = 'static'
var skipExternal = !argv.external
mkdirp.sync(path.join(outputDir, extrasPath))
var inputFiles = argv._[0]

var cache = {}
function get(url) {
  if (cache[url]) {
    var result = cache[url]
    if (result.err) throw result.err
    return result.body
  } else {
    try {
      var body = request('GET', url).getBody()
      cache[url] = { body : body }
      return body
    } catch (err) {
      cache[url] = { err : err }
      throw err
    }
  }
}

if (inputFiles) {
  glob(inputFiles, function(err, files) {
    if (err) {
      console.err(err)
      process.exit(1)
    } else {
      console.error("processing files:", files)
      files.forEach(function(f) {
        // TODO skip dirs
        transform(fs.readFileSync(f, 'utf-8'), function(err, transformed) {
          if (err) throw err
          var writePath = path.join(outputDir, path.basename(f));
          // console.error("writing to", writePath, transformed)
          fs.writeFile(writePath, transformed, 'utf-8');
        })
      })
    }
  })
} else {
  var concatStream = concat(transform)
  process.stdin.setEncoding('utf8')
  process.stdin.on('error', function(err){
    console.error("whoops!", err)
    process.exit(1)
  })
  process.stdin.pipe(concatStream)
}


function combine(tags, cb) {
  var data = []
  // tags.each((i,el) => console.error('el:', el.attribs))
  // tags.each((i,el) => sources.push(el.attribs.src || el.attribs.href))
  tags.each(function(i,el) {
    if (el.attribs.src || el.attribs.href) {
      data.push({ source : el.attribs.src || el.attribs.href })
    } else {
      // console.error("el is:", el)
      data.push({ content : el.children[0].data })
    }
  })
  console.error('sources', data.map(d => d.source ? d.source : '<inline content>'))
  var content = []
  data.forEach(function(d) {
    if (d.source) {
      if (!d.source.match(/https?:\/\//)) {
        content.push(fs.readFileSync(base+d.source, 'utf-8'))
      } else {
        try {
          // content += request('GET', d.source).getBody()
          content.push(get(d.source))
        } catch (err) {
          if (err.statusCode === 404) {
            console.error(`!!! warning: could not get ${d.source}, skipping !!!`)
          } else {
            console.error("error:", JSON.stringify(err))
            throw err
          }
        }
      }
    } else if (d.content) {
      content.push(d.content)
    }
  })
  cb(null, content.join("\n"))
}

function write(content, extension) {
  var fingerprint = crypto.createHmac('md5', KEY).update(content).digest('hex')
  var filename = `${fingerprint}.${extension}`
  var src = `${extrasPath}/${filename}`
  fs.writeFileSync(path.join(outputDir, src), content, 'utf-8')
  return src
}

function findGroups($, tag) {
  var groups = []
  var els = $(tag)
  while (els.length > 0) {
    // console.error("-- group started --")
    var $el = els.eq(0)
    els = els.slice(1)
    var group = $el
    // console.error("current:", $el.toString())
    // console.error("next:", $el.next().toString())
    // FIXME not sure why we need to grab the last one here
    while (els.length > 0 && $el.last().next().is(tag)) {
      // console.error("  $el before", $el.toString())
      // console.error("  next:", $el.last().next().toString())
      // $el = $(els.shift())
      $el = els.first()
      // console.error("about to add", $el.toString())
      els = els.slice(1)
      // console.error("remaining:", els.toString())
      // console.error("  added " + $el.toString())
      group = group.add($el)
      // console.error("group now", group.toString())
      // console.error("    $el now", $el.toString())
    }
    groups.push(group)
    // console.error("-- group ended --")
    // console.error("group:", group.toString())
    // console.error("group:", groups[groups.length-1])
  }
  return groups
}

var processedContent = {};

function tranformType($, selector, extension, tagBuilder, filter, cb) {
  var groups = findGroups($, selector)
  async.map(groups,

    function(els, cb) {
      if (filter) els = els.filter(filter)
      combine(els, function(err, combined) {
        if (err) return cb(err)
        if (combined.length > 0) {
          // skip if we've done this exact block already
          var originalContent = combined
          var newSrc = processedContent[combined]
          if (!newSrc) {
            if (extension === 'js') {
              combined = UglifyJS.minify(combined, {fromString: true}).code
            } else if (extension === 'css') {
              combined = minifyCss.minify(combined).styles
            }
            newSrc = write(combined, extension)
            processedContent[originalContent] = newSrc;
          }
          var newTag = tagBuilder(newSrc)
          els.eq(0).replaceWith(newTag)
        }
        els.remove()
        cb(null)
      })
    },

  cb)
}

function skipExternalUrls(i, el) {
  var source = el.attribs.src || el.attribs.href
  return !source || !source.match(/^https?:/)
}

function transform(string, cb) {
  var $ = cheerio.load(string)

  var filter = skipExternal ? skipExternalUrls : null

  var scriptSelector = skipInlineJs ? 'script[src]' : 'script'

  async.parallel([

    function(cb) {
      tranformType($, scriptSelector, 'js', newSrc => `<script src="${newSrc}">`, filter, cb)
    },

    function(cb) {
      tranformType($, 'link[rel=stylesheet], style', 'css', newSrc => `<link rel="stylesheet" href="${newSrc}">`, filter, cb)
    }

  ], function(err) {
    if (err) throw err;
    if (strip) $(strip).remove()
    inputFiles ? cb(null, $.html()) : process.stdout.write($.html())
  })
}
