
var cluster = require('cluster');
var herd = require('../');
var ps = require('ps-tree');
var assert = require('assert');


if (cluster.isMaster) {
  setInterval(function () {
    process.kill(process.pid, 'SIGHUP');
  }, 163);

  setInterval(function () {
    console.log('\n\nWorkers:');
    for (var id in cluster.workers) {
      var worker = cluster.workers[id];
      console.log('  %d: %s', id, worker.state);
    }

    ps(process.pid, function (err, children) {
      console.log('  Total processes: %d', children.length);
      assert(children.length < 70);
    });

  }, 1000);
}


herd
  .size(4)
  .timeout(10000)
  .boot(1000)
  .run(function () {
    var worker = cluster.worker;
    setInterval(function () {}, 1000);
  });