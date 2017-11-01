class Task {
  constructor() {
    this.curStep = 0;
    this.MaxStep = 10;
    this.job = 0;
    this.taskManager = null;
  }
  setManager(taskManager) {
    this.taskManager = taskManager;
  }
  prepare() {
    console.time('pause clicked');
    console.time('continue clicked');
    for (let x = 0; x < 10; x++) {
      console.time('step ' + x + ' start');
      console.time('step ' + x + ' end');
    }
  }
  send(channel, event, ...args) {
    if (this.taskManager && 'function' === typeof this.taskManager.recieve) {
      this.taskManager.recieve(channel, event, ...args);
    } else {
      console.log('taskManager is not set');
    }
  }

  step() {
    let self = this;
    return new Promise((rs, rj) => {
      setTimeout(function() {
        rs('step ' + self.curStep + ' done');
        self.curStep++;
      }, 500);
    });
  }

  AopStep() {
    let self = this;
    console.timeEnd('step ' + this.curStep + ' start');
    return this.step().then(function(d) {
      console.log(d);
      console.timeEnd('step ' + (self.curStep - 1) + ' end');
      //检查是否需要停下来
      return self.checkStopPoint();
    });

  }
  stopJob() {
    clearInterval(this.job);
  }
  checkStopPoint() {
    //手动结束
    if (this.stop) {
      this.stopJob();
      this.curStep = 0;
      this.send('stop', 'task is stopped');
      return true;
    }
    //手动暂停
    else if (this.pause) {
      this.stopJob();
      this.send('pause', 'task has been paused by manually calling mgr.pause()');
      return true;
    }
    //碰到断点
    else if (this.curStep == 7) {
      this.stopJob();
      this.taskManager.pause();
      this.send('breakpoint', 'task meet a breakpoint and has been paused');
      return true;
    }
    //单步
    else if (this.stepover) {
      this.stopJob();
      this.stepover = false;
      this.taskManager.pause();
      this.send('stepover', 'task has been paused in stepover model');
      return true;
    }
    //正常执行到结束
    else if (this.curStep >= 10) {
      this.stopJob();
      this.send('finish', 'task is finished');
      return true;
    }
    return false;
  }
  run() {
    if (this.curStep) {
      console.log('Task continue');
    } else {
      this.prepare();
      console.log('Task start');
    }
    if (this.stop) { this.stop = false; }
    let self = this;
    return new Promise((rs, rj) => {
      self.job = setInterval(() => {
        self.AopStep().then(
          isStop => {
            //单步执行完成
            if (isStop) { //停下来了
              console.log('停下来了');
            } else { //完成了
              self.send('stepdone', '此步骤完成了', self.curStep - 1);
              //rs(isStop);
            }
          }, reason => {
            //单步执行失败
            rj(reason);
          });
      }, 1000);
    });
  }

}

module.exports = Task;
