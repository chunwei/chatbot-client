const Task = require('./task');

class TaskChatTester extends Task {
  constructor() {
    super();
    this.messages = [];
  }
  setTaskInfo(taskInfo) {
    this.taskInfo = taskInfo;
    this.setMessages(taskInfo.lines);
    this.setBreakPoints(taskInfo.breakpoints);
  }
  setBreakPoints(breakpoints) {
    if (Array.isArray(breakpoints)) {
      this.breakpoints = breakpoints;
    } else {
      console.warn('breakpoints should be an array');
    }
  }
  setMessages(messages) {
    if (Array.isArray(messages)) {
      this.messages = messages;
      this.MaxStep = messages.length - 1;
    } else {
      console.warn('messages should be an array');
    }
  }
  prepare() {
    /*     console.time('pause clicked');
        console.time('continue clicked');
        for (let x = 0; x < 10; x++) {
          console.time('step ' + x + ' start');
          console.time('step ' + x + ' end');
        } */
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

    return new Promise((resolve, reject) => {
      resolve(1 + self.curStep);
    });
  }

  AopStep() {
    let self = this;
    console.log('step ' + this.curStep + ' start');
    return this.step().then(function(d) {
      self.curStep = d; //已经+1
      console.log('step ' + (self.curStep - 1) + ' end');
      //检查是否需要停下来
      return self.checkStopPoint();
    }).catch(reason => {
      console.error('some error happend when execute step ' + this.curStep + '. reason: ' + reason);
      return self.checkStopPoint();
    });

  }
  stopJob() {
    clearInterval(this.job);
  }
  isAllDone() {
    return this.curStep > this.MaxStep;
  }
  isBreakPoint() {
    return this.breakpoints ? this.breakpoints[this.curStep] : false; //this.curStep == 7;
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
    else if (this.isBreakPoint()) {
      this.stopJob();
      this.taskManager.pause();
      this.send('breakpoint', 'task meet a breakpoint and has been paused');
      return true;
    }
    //单步
    else if (this.stepover) {
      this.stopJob();
      this.stepover = false;

      if (this.isAllDone()) {
        this.send('finish', 'task is finished');
      } else {
        this.taskManager.pause();
        this.send('stepover', 'task has been paused in stepover model');
      }
      return true;
    }
    //正常执行到结束
    else if (this.isAllDone()) {
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
      (function doJob() {
        self.AopStep().then(
          isStop => {
            //单步执行完成
            if (isStop) { //停下来了
              console.log('停下来了');
            } else { //完成了
              self.send('stepdone', '此步骤完成了', self.curStep - 1);
              //进入下一步
              doJob();
            }
          }, reason => {
            //单步执行失败
            rj(reason);
          });
      })();
    });
  }

}

module.exports = TaskChatTester;
