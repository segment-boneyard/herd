
var cluster = require('cluster')
  , herd    = require('../');

setTimeout(function () {
  //throw new Error('BLAAGGGH');
}, 1000);

if (cluster.isMaster) console.log('The master at work ' + process.pid);

herd.numWorkers(10);
herd.run(function () {
  console.log("Help, I'm alive " + process.pid);
});