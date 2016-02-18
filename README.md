Totally undocumented tools for making a high performance static site and uploading it to S3.

`cp -r examples/ public/ && cat examples/index.html | node bin/combine.js --base examples/ > public/index.html`

`cat index.html | static-tools-combine --external > index.fast.html`

`static-tools-strip "#bootloader, script[src^='http://assets.tumblr.com/client/prod/standalone/tumblelog/index.js']"`
