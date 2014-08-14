
var Emitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var cpus = require('os').cpus().length;
var fwd = require('forward-events');
var cluster = require('cluster');
var Master = require('./master');
var Worker = require('./worker');

/**
 * Module `exports`.
 */

module.exports = Herd;

/**
 * Create a new herd running `fn`.
 *
 */

function Herd(name){
  if (!(this instanceof Herd)) return new Herd(name);
  this.size(cpus);
  this.server(true);
  process.title = cluster.isMaster ? name : name + '-worker';
}

/**
 * Inherit from Emitter.
 */

inherits(Herd, Emitter);

/**
 * Get/Set the `num` of child processes to spawn.
 *
 * @param {Number} num
 * @return {Number} num
 */

Herd.prototype.size = function(num){
  if (!arguments.length) return this._size;
  this._size = num;
  return this;
};

/**
 * Run the herd, sets up a master or worker depending on where
 * we are running.
 *
 */

Herd.prototype.run = function(fn){
  var herd = cluster.isMaster
    ? new Master(this.size(), this.server())
    : new Worker(fn, this.close(), this.timeout());

  herd.run();
  fwd(herd, this);
  return this;
};

/**
 * Get/Set the graceful reload handler.
 *
 * @param {Function} fn
 * @return {Function} fn
 */

Herd.prototype.close = function(fn){
  if (!arguments.length) return this._close;
  this._close = fn;
  return this;
};

/**
 * Get/Set the `timeout` to wait before killing a process.
 *
 * @param {Number} timeout
 * @return {Number} timeout
 */

Herd.prototype.timeout = function(timeout){
  if (!arguments.length) return this._timeout;
  this._timeout = timeout;
  return this;
};

/**
 * Mark the herd as a herd of workers rather than servers.
 */

Herd.prototype.worker = function(){
  this.server(false);
  return this;
};

/**
 * Gets/sets whether the workers are `net` servers.
 *
 * @param {Boolean} isServer
 * @return {Boolean}
 */

Herd.prototype.server = function(isServer){
  if (!arguments.length) return this._server;
  this._server = isServer;
  return this;
};