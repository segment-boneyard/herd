
var debug = require('debug')('herd:worker:' + process.pid);
var Emitter = require('events').EventEmitter;
var inherits = require('util').inherits;

/**
 * Noop.
 */

function noop(){}

/**
 * Module `exports`.
 */

module.exports = Worker;

/**
 * Create a worker to execute `fn`, exit gracefully with `exit`
 * or terminate after `timeout`.
 *
 * @param {Function} fn
 * @param {Function} exit
 * @param {Number} timeout
 */

function Worker(fn, exit, timeout){
  // Add the default reload handler
  if (!exit && !timeout) exit = reload;
  if (!exit) exit = noop;
  this.fn = fn;
  this.exit = exit;
  this.timeout = timeout;
  process.on('message', this.handle.bind(this));
}

/**
 * Inherit from `Emitter`.
 */

inherits(Worker, Emitter);

/**
 * Handle the `msg` from the master process.
 *
 */

Worker.prototype.handle = function(msg){
  debug('received message: %s', msg);
  if (msg === 'close') return this.close();
};

/**
 * Runs the worker.
 *
 */

Worker.prototype.run = function(){
  debug('running');
  this.fn();
  this.emit('ready');
}

/**
 * Gracefully shutdown the worker using the exit function
 * and timeout.
 *
 */

Worker.prototype.close = function(){
  if (this.closing) return;

  this.closing = true;

  if (this.timeout) setTimeout(exit, this.timeout);
  var isAsync = this.exit.length > 0;
  if (isAsync) return this.exit(exit);
  this.exit();
  exit();
}

/**
 * Default gradeful reload handler, reloads after 1 second.
 *
 * @param {Function} done
 */

function reload(done){
  setTimeout(done, 1000);
}

/**
 * Exits the process with code 0.
 *
 */

function exit(){
  process.exit(0);
}