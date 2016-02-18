// cp -r examples/ public/ && cat examples/index.html | node cmd/combine.js --base examples/ > public/index.html

var argv = require('minimist')(process.argv.slice(2));
var concat = require('concat-stream')
var cheerio = require('cheerio')
var fs = require('fs')
var path = require('path')
var mkdirp = require('mkdirp')
var crypto = require('crypto')
var KEY = 'static-fingerprinter'

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
mkdirp.sync(path.join(outputDir, extrasPath))

function combine(tags) {
  var sources = []
  tags.each((i, el) => sources.push(el.attribs.src || el.attribs.href))
  console.error('sources', sources)
  var content = ""
  sources.forEach(function(source) {
    // relative links only, for now
    if (source && !source.match(/https?:\/\//)) {
      content += fs.readFileSync(base+source, 'utf-8')
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

function transform(string) {
  // combine all head tags, then all body tags
  var $ = cheerio.load(string)
  ;['head', 'body'].forEach(function(el) {
    $el = $(el)
    // handle css
    var combinedCSS = combine($el.find('link[rel=stylesheet]'))
    var newSrc = write(combinedCSS, 'css')
    $el.find('link[rel=stylesheet]').remove()
    $el.append(`<link rel="stylesheet" href="${newSrc}">`)
    // handle js
    var combinedJS = combine($el.find('script[src]'))
    var newSrc = write(combinedJS, 'js')
    $el.find('script[src]').remove()
    $el.append(`<script src="${newSrc}">`)
  })
  process.stdout.write($.html())
}
