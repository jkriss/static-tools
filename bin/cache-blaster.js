#! /usr/bin/env node
var AWS = require('aws-sdk');
var cloudfront = new AWS.CloudFront({apiVersion: '2015-09-17'});

var distributionId = process.env.DISTRIBUTION_ID

if (!distributionId) {
  var args = process.argv.slice(2)
  distributionId = args[0];  
}

if (!distributionId) throw new Error("Must specific distribution id with the DISTRIBUTION_ID env variable")
// var distributionId = 'EVYCVG8SOJPID';

var params = {
  DistributionId: distributionId,
  InvalidationBatch: { /* required */
    CallerReference: 'cache-blaster-' + new Date().getTime(),
    Paths: {
      Quantity: 1,
      Items: [
        '/*'
      ]
    }
  }
};
cloudfront.createInvalidation(params, function(err, data) {
  if (err) console.log(err, err.stack); // an error occurred
  else     console.log(data);           // successful response
});
