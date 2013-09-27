
var cluster = require('cluster')
  , herd    = require('../');

if (cluster.isMaster) console.log('The master at work ' + process.pid);

herd.size(10);
herd.run(function () {
  console.log("Help, I'm alive " + process.pid);

  setTimeout(function () {
    throw new Error('Killing the child', process.pid);
  }, 1000);
});