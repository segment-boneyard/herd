
var assert = require('assert');
var test = require('./test');
var Herd = require('../');

/**
 * Create the herd.
 */

var herd = Herd('close')
  .size(4)
  .close(function(fn){ setTimeout(fn, 10); })
  .server(false)
  .run(test.run);

/**
 * Run the tests.
 */

function boot(){
  if (!test.master) return;

  console.log('  it should reload after closing...');

  var workers = test.workers();
  assert(workers.length === herd.size(), 'workers not fully spawned');
  test.reload();

  var reloaded = 0;
  herd.on('worker:close', function(){
    if (++reloaded < herd.size()) return;
    test.online().forEach(function(worker){
      var isNew = workers.indexOf(worker) == -1;
      assert(isNew, worker.state + ' worker found: ' + worker.id);
    });
    test.quit();
  });

  process.on('exit', function(code){
    console.log('    ' + (code === 0 ? 'passed' : 'failed'));
  });
}

/**
 * Boot.
 */

herd.on('ready', boot);
