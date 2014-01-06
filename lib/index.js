
var async = require('async');
var debug = require('debug')('herd');
var cluster = require('cluster');
var os = require('os');
var ms = require('ms');


/**
 * Default restart signal
 */

var restartSignal = 'SIGHUP';


/**
 * Default shutdown signal
 */

var shutdownSignal = 'SIGQUIT';


/**
 * Default kill timeout
 */

var timeout = ms('3s');


/**
 * Default time to wait for booting
 */

var boot = ms('3s');


/**
 * Default number of workers
 */

var size = os.cpus().length;


/**
 * Default handler function
 */

var handler = function () {};


/**
 * Export herd and the runner function
 */

module.exports = herd;
herd.run = herd;


/**
 * Run the main function to be forked
 *
 * @param {Function} fn  child
 */

function herd (fn) {
  if (fn) herd.handler(fn);
  if (cluster.isMaster) master();
  else handler();
}


/**
 * Get/Set the restart signal
 *
 * @param {String} newSignal  ('SIGHUP')
 */

herd.signal = function (newSignal) {
  if (arguments.length === 0) return restartSignal;
  restartSignal = newSignal;
  return this;
};


/**
 * Get/Set the timeout before a running process is killed off
 *
 * @param {Number} newTimeout  time in ms to wait
 */

herd.timeout = function (newTimeout) {
  if (arguments.length === 0) return timeout;
  timeout = newTimeout;
  return this;
};


/**
 * Get/Set the time required before booting
 *
 * @param {Number} bootTime  time in ms to wait
 */

herd.boot = function (bootTime) {
  if (arguments.length === 0) return boot;
  boot = bootTime;
  return this;
};


/**
 * Get/Set the number of workers, defaults to number of cpus
 *
 * @param {Number} workers
 */

herd.size = function (workers) {
  if (arguments.length === 0) return size;
  size = workers || os.cpus().length;
  return this;
};


/**
 * Get/Set the child handler
 *
 * @param {Function} fn
 */

herd.handler = function (fn) {
  if (arguments.length === 0) return handler;
  handler = fn;
  return this;
};


/**
 * Set up the master handler
 */

function master () {
  process.on(shutdownSignal, shutdown);
  process.on(restartSignal, reload);
  for (var i = 0; i < size; i++) spawn();
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
 * Reload all of our workers processes
 */

function reload () {
  console.log('%s: restarting', restartSignal);

  var workers = [];
  for (var id in cluster.workers) workers.push(cluster.workers[id]);
  debug('reloading %d workers', workers.length);
  async.eachSeries(workers, reloadWorker, function (err) {
    if (err) debug('Error reloading worker: ' + err.toString());
  });
}


/**
 * Graceful shutdown with timeout.
 */

function shutdown() {
  console.log('%s: shutting down', shutdownSignal);

  for (var id in cluster.workers) {
    var worker = cluster.workers[id];
    kill(worker);
  }
}


/**
 * Reload our workers one at a time after waiting for them to boot
 *
 * @param {cluster.Worker} worker
 */

function reloadWorker (worker, callback) {
  debug('reloading worker: %d', worker.id);
  if (worker.state !== 'online') {
    debug('not reloading %s worker: %d', worker.state, worker.id);
    return process.nextTick(callback);
  }

  kill(worker);
  spawn();
  setTimeout(callback, herd.boot());
}


/**
 * Spawns a fresh worker and sets up its error handler
 *
 * @return {cluster.Worker} worker
 */

function spawn() {
  var worker = cluster.fork();
  worker.on('exit', onExit);
  debug('spawned new worker %d', worker.id);
  return worker;
}


/**
 * Gracefully kill a worker, disconnects first and then forcefully kills it
 * after the timeout
 *
 * @param  {cluster.Worker} worker
 */

function kill (worker) {
  debug('disconnecting worker %d', worker.id);
  worker.removeAllListeners();

  var killTimeout = setTimeout(function () {
    debug('killing worker %d', worker.id);
    worker.destroy();
  }, herd.timeout());
  worker.on('exit', function () { clearTimeout(killTimeout); });

  worker.disconnect();
}