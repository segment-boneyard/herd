
var request = require('superagent');
var assert = require('assert');
var test = require('./test');
var http = require('http');
var Herd = require('../');

/**
 * Create the herd.
 */

var herd = Herd('server')
  .size(4)
  .timeout(200)
  .run(run);

/**
 * Run each worker and create a server to listen with.
 */

function run(){
  var server = http.createServer(function(req, res){
    res.writeHead(200);
    res.end();
  });
  server.listen(8034);
}

/**
 * Verify that enough workers are being properly reloaded.
 */

function check(fn){
  var alive = test.listening().length;
  var size = herd.size();
  assert(alive >= size, 'not enough workers online: ' + alive);
  assert(alive <= size * 2, 'too many workers are spawned: ' + alive);
  request
    .get('localhost:8034')
    .end(function(err, res){
      if (err) throw err;
      assert(res.ok);
      fn();
    });
}

/**
 * Run the tests.
 */

function boot(){
  if (!test.master) return;

  console.log('  it should reload server processes...');
  test.reload();

  herd.on('worker:ready', function(){
    check(test.quit);
  });

  process.on('exit', function(code){
    console.log('    ' + (!code ? 'passed' : 'failed'));
  });
}

/**
 * Boot.
 */

herd.on('ready', boot);
