class TaskManager {
  constructor(task) {
    //双向绑定
    if (task) {
      this.task = task /* || function task() { return Promise.resolve(console.log('empty function')); } */ ;
      this.task.setManager(this);
    } else {
      //console.warn('create a TaskManager instance but without a task being set!');
    }
    this.autorepeat = false;
    this.state = 'pending';
    this.listeners = {};
    this.setDefaultListeners();
  }
  setAutoRepeat(repeat) {
    this.autorepeat = repeat;
  }
  getTask() {
    return this.task;
  }
  setTask(task) {
    if (!task) return false;
    if (this.task) {
      this.stop();
      // TODO: 思考是否需要去除绑定
      //this.task.setManager(null);
    }
    this.task = task;
    this.task.setManager(this);
    this.state = 'pending';
    this.recieve('changetask', 'task has been changed');
  }
  /**
    设置监听接口
    Listens to channel, when a new message arrives listener would be called with listener(event, args...).
    @param listener(event,...args) 时间处理器
  */
  on(channel, listener) {
    let cls = this.listeners[channel] || [];
    if (typeof listener === 'function') {
      cls.push(listener);
    }
    this.listeners[channel] = cls;
  }
  recieve(channel, event, ...args) {
    console.log('recieve channel: %s', channel);
    let cls = this.listeners[channel] || [];
    cls.forEach(listener => {
      listener(event, ...args);
    });
  }
  start() {
    console.debug('call start()');
    if (!this.task) {
      console.log('task is not been set');
      return false;
    }
    if (this.state == 'running') {
      console.log('task is already running');
      return false;
    }
    let p = this.task.run();
    p.then(
      done => {
        this.message = done;
        console.log(done);
        this.stop();
      }, reason => {
        this.message = reason;
        console.log('task is not finish : %s', reason);
      }
    ).catch(reason => {
      this.message = reason;
      console.log('task is not finish : %s', reason);
      //this.stop();
      //this.state = 'paused';
    });
    this.state = 'running';
  }
  pause() {
    console.debug('call pause()');
    if (this.state !== 'running') {
      console.log('task is ' + this.state + ' not running');
    } else {
      this.task.pause = true;
      this.state = 'paused';
      console.log('task will be paused');
    }

  }
  continue () {
    console.debug('call continue()');
    if (this.state == 'paused') {
      this.task.pause = false;
      this.start();
      //this.task.resume().next();
      this.state = 'running';
    } else {
      console.log('task is ' + this.state + ' not paused');
    }
  }
  stepover() {
    console.debug('call stepover()');
    if (this.state == 'paused') {
      this.task.stepover = true;
      this.continue();
    } else {
      console.log('task is ' + this.state + ' not paused');
    }
  }
  restart() {
    console.debug('call restart()');
    console.log('task will be restarted');
    this.task.curStep = 0;
    this.state = 'paused';
    this.continue();
    this.state = 'running';
    this.recieve('restart', 'task will be restarted');
  }
  stop() {
    console.debug('call stop()');
    console.log('task will be stopped');
    this.task.stop = true;
    this.state = 'stopped';
  }
  finish() {
    console.debug('call finish()');
    this.state = 'finished';
  }
  setDefaultListeners() {
    let self = this;
    this.on('finish', function(event) {
      self.state = 'finished';
      console.log('on finish : %s', event);
      if (self.autorepeat) {
        console.log('will start auto-repeat in 10 seconds');
        setTimeout(() => { self.restart(); }, 10000);
      }
    });
    this.on('stop', function(event) {
      console.log('on stop : %s', event);
    });
    this.on('breakpoint', function(event) {
      console.log('on breakpoint : %s', event);
    });
    this.on('stepover', function(event) {
      console.log('on stepover : %s', event);
    });
    this.on('pause', function(event) {
      console.log('on pause listener1: %s', event);
    });
    this.on('pause', function(event) {
      console.log('on pause listener2 : %s', event);
    });
    this.on('stepdone', function(event, i) {
      console.log('on stepdone %d : %s ', i, event);
    });
  }
}

module.exports = TaskManager;
