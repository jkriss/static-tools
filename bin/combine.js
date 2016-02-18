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

var concatStream = concat(transform)
process.stdin.setEncoding('utf8')
process.stdin.on('error', function(err){
  console.error("whoops!", err)
  process.exit(1)
})
process.stdin.pipe(concatStream)

var base = argv.base || `${process.cwd()}/`
var outputDir = argv.output || base
var extrasPath = 'static'
var skipExternal = !argv.external
mkdirp.sync(path.join(outputDir, extrasPath))

function combine(tags) {
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
  console.error('sources', data)
  var content = ""
  data.forEach(function(d) {
    // relative links only, for now
    if (d.source) {
      if (!d.source.match(/https?:\/\//)) {
        content += fs.readFileSync(base+d.source, 'utf-8')
      } else {
        try {
          content += request('GET', d.source).getBody()
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
      content += d.content
    }
  })
  return content
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

function tranformType($, selector, extension, tagBuilder, filter) {
  var groups = findGroups($, selector)
  groups.forEach(function(els) {
    if (filter) els = els.filter(filter)
    var combined = combine(els)
    var newSrc = write(combined, extension)
    var newTag = tagBuilder(newSrc)
    els.eq(0).replaceWith(newTag)
    els.remove()
  })
}

function skipExternalUrls(i, el) {
  var source = el.attribs.src || el.attribs.href
  return !source || !source.match(/^https?:/)
}

function transform(string) {
  var $ = cheerio.load(string)

  var filter = skipExternal ? skipExternalUrls : null
  tranformType($, 'script', 'js', newSrc => `<script src="${newSrc}">`, filter)
  tranformType($, 'link[rel=stylesheet], style', 'css', newSrc => `<link rel="stylesheet" href="${newSrc}">`, filter)

  process.stdout.write($.html())
}
