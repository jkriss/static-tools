var AWS = require('aws-sdk');
var cloudfront = new AWS.CloudFront({apiVersion: '2015-09-17'});

var distributionId = 'E3KERAIBR2J6DM';

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
