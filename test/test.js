var cluster = require('cluster');

/**
 * Return whether we are running in the master.
 */

exports.master = cluster.isMaster;

/**
 * Export `workers`.
 */

exports.workers = workers;

/**
 * Export `state` filter.
 */

exports.state = state;

/**
 * Returns the array of existing workers.
 *
 * @return {Array[Worker]} workers
 */

function workers(){
  var workers = [];
  for (var id in cluster.workers){
    workers.push(cluster.workers[id]);
  }
  return workers;
};

/**
 * Returns all workers given the current `state`.
 *
 * @return {Array[Worker]}
 */

function state(state){
  return workers().filter(function(worker){ return worker.state === state; });
}

/**
 * Return a list of the current worker states.
 *
 * @return {Array[String]}
 */

exports.states = function(){
  return workers().map(function(worker){ return worker.state; });
};

/**
 * Returns all 'online' workers.
 *
 * @return {Array[Worker]}
 */

exports.online = function(){
  return state('online');
};

/**
 * Returns all 'listening' workers.
 *
 * @return {Array[Worker]}
 */

exports.listening = function(){
  return state('listening');
};

/**
 * Return the dead workers.
 *
 * @return {Array[Worker]}
 */

exports.dead = function(){
  return workers().filter(function(worker){
    return worker.state !== 'online' && worker.state !== 'listening';
  });
};

/**
 * Dummy runner function for our workers.
 */

exports.run = function(){
  setInterval(function(){}, 1000);
};

/**
 * Tell the master process to reload.
 */

exports.reload = function(){
  process.kill(process.pid, 'SIGHUP');
}

/**
 * Tell the master process to exit.
 */

exports.quit = function(){
  process.kill(process.pid, 'SIGQUIT');
}