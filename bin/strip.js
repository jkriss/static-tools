#! /usr/bin/env node

var argv = require('minimist')(process.argv.slice(2));
var concat = require('concat-stream')
var cheerio = require('cheerio')
var concatStream = concat(transform)

process.stdin.setEncoding('utf8')
process.stdin.on('error', function(err){
  console.error("whoops!", err)
  process.exit(1)
})
process.stdin.pipe(concatStream)

var selector = argv._[0]

function transform(string) {
  var $ = cheerio.load(string)

  console.error("Stripping ", selector)
  $(selector).remove()

  process.stdout.write($.html())
}
