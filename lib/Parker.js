
var definition = (function () {
  'use strict';
  var EventEmitter = require('events').EventEmitter;

  var copy = function (obj) {
    var type = jsType(obj);
    var out;
    var i;
    var len = 0;
    if (type === 'Array' || type === 'Arguments') {
      out = [];
      i = 0;
      len = obj.length;
      for (; i < len; i++) {
        out[i] = copy(obj[i]);
      }
      return out;
    }
    if (type === 'Object') {
      out = {};
      for (i in obj) {
        out[i] = copy(obj[i]);
      }
      return out;
    }
    return obj;
  };

  var jsType = function (fn) {
    if (typeof fn === 'undefined') {
      return 'undefined';
    }
    return ({}).toString.call(fn).match(/\s([a-z|A-Z]+)/)[1];
  };

  var checkArguments = function (args) {
    var len = args.length;
    var i = 0;
    var type;
    // Arguments should contain at least one entry
    if (len < 1) {
      throw new Error('No jobs detected');
    }
    // Check arguments of type Function
    for (; i < len; i++) {
      // 0 or 1 could be string or number
      type = typeof args[i];
      if (i < 2) {
        if (!(type === 'function' || type === 'string' || type === 'number')) {
          throw new Error('Only to allow functions as arguments in a promise');
        }
      } else {
        if (type !== 'function') {
          throw new Error('Only to allow functions as arguments in a promise');
        }
      }
    }
  };

  class Parker extends EventEmitter {
    do () {
      checkArguments(arguments);
      var self = this;
      this.reset();
      this.once('prun', function registerPrun () {
        self.execute();
      });
      return this.thenDo.apply(this, arguments);
    };

    thenDo () {
      checkArguments(arguments);
      // Raise the block-level
      this.pOptions.eLevel++;
      this._registerPTasks(arguments);
      return this;
    };

    orDo () {
      checkArguments(arguments);
      this._registerPTasks(arguments);
      return this;
    };

    thenWait (ms) {
      if (typeof ms !== 'number') {
        throw new Error('argument of wrong type');
      }
      this.pOptions.eLevel++;
      var args = ['wait:' + ms, function (parker) {
        setTimeout(function () {
          parker.done();
        }, ms);
      }];
      this._registerPTasks(args);
      return this;
    };

    whenDone (fn) {
      this.once('pdone', fn);
      return this;
    };

    whenException (fn) {
      this.on('pexception', fn);
      return this;
    };

    whenFail (fn) {
      // We start executing when a error handle is registered
      // best practice to register this handle last in line.
      this.once('pfail', fn);
      this.emit('prun', this);
      return this;
    };
    // ----- PRIVATE -----
    _registerPTasks (args) {
      var nArgs = copy(args);
      var level = this.pOptions.eLevel;
      var description = '';
      var tVal;
      var timeout = -1;

      // The idea is good
      // But the script sucks
      var fArg = typeof nArgs[0];
      var sArg = typeof nArgs[1];
      if (fArg === 'string' || fArg === 'number') {
        tVal = nArgs.shift();
        if (fArg === 'string') {
          description = tVal;
        }
        if (fArg === 'number') {
          timeout = tVal;
        }
      }
      if (sArg === 'string' || sArg === 'number') {
        tVal = nArgs.shift();
        if (sArg === 'string' && description !== '') {
          description = tVal;
        }
        if (sArg === 'number' && timeout < 0) {
          timeout = tVal;
        }
      }
      if (description === '') {
        description = 'Level:' + level;
      }

      if (!this.pOptions._status[level]) {
        this.pOptions._status[level] = [];
      }

      this.pOptions._status[level].push({
        fuctions: nArgs.length,
        timeout: timeout,
        description: description,
        success: 0,
        errors: 0,
        done: false,
        tasks: nArgs
      });
      return this;
    };

    reset () {
      var d = new Date();
      this.removeAllListeners('pdone');
      this.removeAllListeners('pfail');
      this.removeAllListeners('pexception');
      this.removeAllListeners('prun');
      this.pOptions = {};
      this.pOptions.timeout = -1;
      // This time-stamp is for invalidating the callback object
      this.pOptions.ts = d.getTime();
      this.pOptions.eLevel = -1;
      this.pOptions.currentLevel = -1;
      this.pOptions._status = [];
    };
    execute () {
      this.pOptions.currentLevel++;
      var currentLevel = this.pOptions.currentLevel;
      var levelLength = this.pOptions._status.length;
      var tsCheck = this.pOptions.ts;
      var self = this;
      var blockLength;
      var blockIndex;
      var taskLength;
      var taskIndex;
      var active = function () {
        return (self.pOptions.ts === tsCheck) || (currentLevel === this.pOptions.currentLevel);
      };

      // Check if there is a level to execute
      if (currentLevel > (levelLength - 1) || this.pOptions._status.length === 0) {
        return;
      }

      blockLength = this.pOptions._status[currentLevel].length;
      blockIndex = 0;
      for (; blockIndex < blockLength; blockIndex++) {
        if (!active()) {
          // The promise is reset (due to an error or a complete success)
          // no need to fulfill the rest of the blocks.
          // this can happen when applied on a fast or non-async task when still more
          // 'or' blocks are added in a user case where promises are being added
          // nested. (the promise object is already 'running')
          return;
        }
        taskLength = this.pOptions._status[currentLevel][blockIndex].tasks.length;
        taskIndex = 0;
        for (; taskIndex < taskLength; taskIndex++) {
          if (!active()) {
            return;
          }
          // ----------------------
          // ### Promise Callback Argument
          //
          // ### lightPromise
          // This object is passed as argument to every promise.
          // It holds essential information about it's task,
          // it's execution level and references to the 'original' promise object.
          // In the async world it's very well possible that a concurrent block is flagged
          // 'ready' and there is no reason to complete this task. However, it is still running but
          // it makes no sense to do any reporting.
          //
          // #### Note:
          // It is very important to call 'done()' or 'fail()' on every promise callback
          // because it will destruct this callback object (needed for garbage collection)
          //
          // #### Examples:
          //
          //    function(promise){
          //      .... your code
          //      promise.done() || promise.fail()
          //    }
          //
          // Lets fake a long running async task (2s)
          // The main promise could be reset-ted (due to an error or completion).
          // That's where the check comes in ( promise.active() )
          // This is only an issue when you dynamically add more tasks from an already running promise
          // in combination with concurrent code blocks.
          //
          //    function(promise){
          //      setTimeout(function(){
          //        if(promise.active()){
          //          promise.thenDo(
          //            function(promise){
          //              .. do nested stuff
          //              promise.done();
          //            }
          //          )
          //          promise.done()
          //        }
          //      },2000)
          //
          //    }
          var lightPromise = {
            timer: undefined,
            ts: this.pOptions.ts,
            taskIndex: taskIndex,
            currentLevel: currentLevel,
            block_level: blockIndex,
            // ### promiseCallback.active()
            // A promise callback is active when:
            //
            // * The main promise object is not being reset-ted (by a ready or an error)
            //
            // So every promise is active as long as the main promise is
            active: function () {
              if (this.ts === self.pOptions.ts) {
                return (this.currentLevel >= self.pOptions.currentLevel);
              } else {
                return false;
              }
            },
            // ### promiseCallback.ready()
            // Flag this task as a success
            done: function () {
              if (this.active()) {
                self._PromiseReport('pdone', this.taskIndex, this.currentLevel, this.block_level);
              }
              this.__destroy();
            },
            // ### promiseCallback.error()
            // Flag this task as an error (the entire block will error
            // unless a concurrent block will success)
            fail: function () {
              if (this.active()) {
                // console.log('report fail:'+taskIndex);
                self._PromiseReport('pfail', this.taskIndex, this.currentLevel, this.block_level);
              }
              this.__destroy();
            },
            // ### promiseCallback.__destroy()
            // Private method for destroying this promissCallback
            __destroy: function () {
              if (this.timer) {
                clearTimeout(this.timer);
              }
              var i;
              for (i in this) {
                delete this[i];
              }

              // We need to delete this?
              // The object should be destroyed
              // But maybe still triggered from a promise
              // That is why we provide this fake interface
              // Still need to know if this object is garbage collected
              this.done = function () { };
              this.fail = function () { };
              this.active = function () {
                return false;
              };
            },

            __setTimeOut: function (to) {
              var self = this;
              this.timer = setTimeout(function () {
                self.fail();
              }, to);
            }

          };

          // If there is a timeout set in the main object
          // we 'r going to use an auto-destroy timer
          // But when the promise is still active
          // and reporting done 'later' it will throw
          // so we  need a different destroy
          // TODO: find a way to keep some methods active
          // because a promise throws when done or fail are triggered
          // more then once (the object is destructed after the first time)
          if (this.pOptions._status[currentLevel][blockIndex].timeout > 0) {
            lightPromise.__setTimeOut(this.pOptions._status[currentLevel][blockIndex].timeout);
          }
          // W 'r gonna wrap with a try catch statement
          // when we have a listener for exceptions.
          // Report an exception when they occur.
          // But not ending the promise because
          // it still can be fulfilled,
          // and error the current light-promise
          if (this.listeners('pexception').length === 0) {
            this.pOptions._status[currentLevel][blockIndex].tasks[taskIndex].apply(null, [lightPromise]);
          } else {
            try {
              this.pOptions._status[currentLevel][blockIndex].tasks[taskIndex].apply(null, [lightPromise]);
            } catch (e) {
              this.emit('pexception', e);
              lightPromise.fail();
            }
          }
          // ----------------------
        }
      }
    }

    _PromiseReport (status, fnIndex, thenLevel, orLevel) {
      if (thenLevel < this.pOptions.currentLevel) {
        // Level is already satisfied
        // no need for checks
        return;
      }

      var statusObject = this.pOptions._status[thenLevel][orLevel];

      if (status === 'pdone') {
        statusObject.success++;
      } else {
        statusObject.errors++;
      }

      if (statusObject.success === statusObject.fuctions) {
        // This level is fulfilled
        if (this.pOptions._status.length - 1 === this.pOptions.currentLevel) {
          this.emit('pdone');
          this.reset();
        } else {
          // Go to the next level
          this.execute();
        }
        return;
      }

      if (statusObject.success + statusObject.errors === statusObject.fuctions) {
        statusObject.done = true;
        // We see only this or block
        // But we need to know the status of the whole level block
        this._checkCurrentPLevel();
      }
    };

    _checkCurrentPLevel () {
      if (this.pOptions.currentLevel > (this.pOptions._status.length - 1)) {
        throw new Error('Execution level out of range');
      }
      var orLength = this.pOptions._status[this.pOptions.currentLevel].length;
      var thenLevel = this.pOptions.currentLevel;
      var orCounter = 0;
      var errorA = [];
      var doneCounter = 0;

      for (; orCounter < orLength; orCounter++) {
        if (this.pOptions._status[thenLevel][orCounter].done === true) {
          errorA.push(this.pOptions._status[thenLevel][orCounter].description);
          doneCounter++;
        }
      }
      if (doneCounter === orLength) {
        // This level can not be satisfied.
        // and emit a fail.
        this.emit('pfail', {
          blocks: errorA
        });
        this.reset();
      }
    };
  }

  return Parker;
})();
module.exports = definition;
// vim: set ts=2 sw=2 et :
