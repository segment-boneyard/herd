
var debug = require('debug')('herd:master:' + process.pid);
var Emitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var cluster = require('cluster');

/**
 * Module `exports`.
 */

module.exports = Master;

/**
 * Create a new Master of the given `size`, and decide whether to
 * wait for `listening` or `online` events of the child processes
 * if `isServer` is true.
 *
 * @param {Number} size
 * @param {Boolean} isServer
 */

function Master(size, isServer){
  this.size = size;
  this.server = isServer;

  /**
   * Set up reloading for crashed processes
   */

  cluster.on('exit', function(worker, code, signal){
    self.emit('worker:close', worker, code, signal);
    var pid = worker.process.pid;
    debug('worker %d exited with code: %d', pid, code);
    if (code !== 0) cluster.fork();
  });

  var self = this;
  cluster.on(this.signal(), function(worker){
    self.emit('worker:ready', worker);
  });

  /**
   * Set up handlers for graceful reloads
   */

  process
    .on('SIGHUP', this.reload.bind(this))
    .on('SIGTERM', this.close.bind(this))
    .on('SIGINT', this.close.bind(this))
    .on('SIGQUIT', this.close.bind(this));
}

/**
 * Inherit from `Emitter`.
 */

inherits(Master, Emitter);

/**
 * Fork the process for the first time
 */

Master.prototype.run = function(){
  var signal = this.signal();
  var waiting = this.size;
  var self = this;

  cluster.on(signal, ready);

  function ready(){
    if (--waiting > 0) return;
    self.emit('ready');
    cluster.removeListener(signal, ready);
  };

  for (var i = 0; i < this.size; i++) cluster.fork();
};

/**
 * Reload all the workers
 */

Master.prototype.reload = function(){
  if (this.closing) return debug('shutdown already in progress');
  if (this.reloading) return debug('reload already in progress');

  this.reloading = true;

  debug('reloading the workers');
  var reloaded = 0;
  var size = this.size;
  var workers = currentWorkers();

  var signal = this.signal();
  cluster.on(signal, reload);
  for (var i = 0; i < size; i++) cluster.fork();

  var self = this;
  function reload(worker){
    if (++reloaded < size) return;
    self.reloading = false;
    debug('finished reloading, killing workers');
    workers.forEach(kill);
    cluster.removeListener(signal, reload);
  }
};

Master.prototype.signal = function(){
  return this.server ? 'listening' : 'online';
}

/**
 * Shut down the master gracefully.
 */

Master.prototype.close = function(){
  if (this.closing) return debug('shutdown already in progress');

  debug('shutting down!');
  var alive = this.size;
  this.closing = true;

  cluster.on('exit', function(){
    alive--;
    debug('%d workers remaining', alive);
    if (!alive) process.exit(0);
  });

  currentWorkers().forEach(kill);
};

/**
 * Returns an array of the current workers.
 *
 * @return {Array[Worker]} workers
 */

function currentWorkers(){
  var ret = [];
  for (var id in cluster.workers) ret.push(cluster.workers[id]);
  return ret;
}

/**
 * Attempts to kill a worker, catches the exception in case
 * the worker is already dead.
 *
 * @param {Worker} worker
 */

function kill(worker){
  debug('sending `close` message: %d', worker.id);
  try {
    worker.send('close');
  } catch(err) {
    debug('worker %d is already dead', worker.id);
  }
}