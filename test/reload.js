
var assert = require('assert');
var test = require('./test');
var Herd = require('../');

/**
 * Create the herd.
 */

var herd = Herd('reload')
  .size(4)
  .server(false)
  .run(run);

/**
 * Die after a random interval.
 */

function run(){
  var ttl = 400;
  setTimeout(function(){
    process.exit(1);
  }, ttl);
}

/**
 * Verify that enough workers are being properly reloaded.
 */

function check(){
  var online = test.online().length;
  var states = test.states();
  var size = herd.size();
  assert(online >= 1, 'not enough workers online: ' + states);
  assert(online <= size * 2, 'too many workers are spawned: ' + states);
}

/**
 * Run the tests.
 */

function boot(){
  if (!test.master) return;

  console.log('  it should reload errored processes...');

  herd.on('worker:ready', function(){
    check();
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
