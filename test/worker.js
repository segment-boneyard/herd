
var assert = require('assert');
var test = require('./test');
var Herd = require('../');

/**
 * Create the herd.
 */

var herd = Herd('worker')
  .size(4)
  .server(false)
  .timeout(200)
  .run(test.run);

/**
 * Verify that enough workers are being properly reloaded.
 */

function check(){
  var online = test.online().length;
  var size = herd.size();
  assert(online >= size, 'not enough workers online: ' + online);
  assert(online <= size * 2, 'too many workers are spawned: ' + online);
}

/**
 * Run the tests.
 */

function boot(){
  if (!test.master) return;

  console.log('  it should reload workers...');
  check();

  var reloaded = 0;
  var workers = test.online();
  herd.on('worker:close', function(){
    if (++reloaded < herd.size()) return;
    test.online().forEach(function(worker){
      var isNew = workers.indexOf(worker) == -1;
      assert(isNew, worker.state + ' worker found: ' + worker.id);
    });
    test.quit();
  });

  test.reload();

  process.on('exit', function(code){
    console.log('    ' + (code === 0 ? 'passed' : 'failed'));
  });
}

/**
 * Boot.
 */

herd.on('ready', boot);
