
var async   = require('async')
  , debug   = require('debug')('herd')
  , cluster = require('cluster')
  , os      = require('os')
  , ms      = require('ms');


/**
 * Defaults
 */

var signal     = 'SIGHUP'
  , timeout    = ms('3s')
  , numWorkers = os.cpus().length
  , handler    = function () {};


/**
 * Get/Set the restart signal
 */

exports.signal = function (newSignal) {
  if (arguments.length === 0) return signal;
  signal = newSignal;
};


/**
 * Get/Set the timeout
 */

exports.timeout = function (newTimeout) {
  if (arguments.length === 0) return timeout;
  timeout = newTimeout;
};


/**
 * Get/Set the number of workers, defaults to number of cpus
 */

exports.numWorkers = function (workers) {
  if (arguments.length === 0) return numWorkers;
  numWorkers = workers || os.cpus().length;
};


/**
 * Get/Set the child handler
 */

exports.handler = function (newHandler) {
  if (arguments.length === 0) return handler;
  handler = newHandler;
};


/**
 * Set up the master handler
 */

function master () {
  process.on(signal, reload);

  for (var i = 0; i < numWorkers; i++) {
    spawn();
  }

  return cluster;
}


/**
 * Called whenever a worker exits, reboots the worker.
 */

function onExit (code, exitSignal) {

  if (!code) debug('Successfully rebooting worker');
  else debug('The worker exited incorrectly. code: ' + code);

  spawn();
}


/**
 *
 */

function reload () {
  var workers = [];
  for (var id in cluster.workers) {
    workers.push(cluster.workers[id]);
  }

  async.eachSeries(workers, reloadWorker, function (err) {
    if (err) {
      debug('Error reloading worker: ' + err.toString());
    } else {
      // Boot up the remainder
      for (var i = 0; i < numWorkers - workers.length; i++) {
        spawn();
      }
    }
  });
}


function reloadWorker (worker, callback) {
  worker.removeAllListeners('exit');
  worker.once('exit', function (code) {
    var newWorker = cluster.fork();

    var aliveCheck = setTimeout(function () {
      newWorker.removeAllListeners('exit');
      newWorker.on('exit', onExit);
      callback();
    }, timeout);

    newWorker.on('exit', function () {
      clearTimeout(aliveCheck);
      return callback(new Error('Error reloading script.'));
    });
  });

  kill(worker);
}


function spawn() {
  var worker = cluster.fork();
  worker.on('exit', onExit);
}


/**
 * Gracefully kill a worker.
 * @param  {Object}   worker
 */
function kill (worker, callback) {
  var killTimeout = setTimeout(function () { worker.destroy(); }, timeout);
  worker.on('exit', function () { clearTimeout(killTimeout); });
  worker.disconnect();
}


/**
 * Runs the function before adding the child event handlers.
 */
function fork () {
  handler();

  var worker = cluster.worker;
  process.on(signal, function () {
    kill(worker);
  });

  return worker;
}


exports.run = function (fn) {
  if (fn) handler = fn;

  if (cluster.isMaster) master();
  else fork();
};
