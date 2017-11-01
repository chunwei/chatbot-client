let Task = (function Task() {
  Task.curStep = Task.curStep || 0;
  let job = 0;

  function step() {
    return new Promise((rs, rj) => {
      setTimeout(function() {
        console.log('step ' + Task.curStep);
        rs('step ' + Task.curStep + ' done');
        Task.curStep++;
      }, 500);
    });
  }

  function AopStep(job, rs, rj) {
    console.timeEnd('step ' + Task.curStep + ' start');
    step().then(function(d) {
      console.timeEnd('step ' + (Task.curStep - 1) + ' end');
      console.log(d);
      //真正停下来的地方
      shouldStop(job, rs, rj);
    });

  }

  function shouldStop(job, rs, rj) {
    //手动结束
    if (Task.stop) {
      clearInterval(job);
      Task.curStep = 0;
      rs('task is stopped');
    }
    //手动暂停
    else if (Task.pause) {
      clearInterval(job);
      saveFieldState();
      rj('task has been paused by manually calling mgr.pause()');
      Task.send('paused', 'task has been paused by manually calling mgr.pause()');
    }
    //碰到断点
    else if (Task.curStep == 7) {
      clearInterval(job);
      saveFieldState();
      Task.mgr.pause();
      rj('task meet a breakpoint and has been paused');
    }
    //单步
    else if (Task.stepover) {
      clearInterval(job);
      saveFieldState();
      Task.stepover = false;
      Task.mgr.pause();
      rj('task has been paused in stepover model');
    }
    //正常执行到结束
    else if (Task.curStep >= 10) {
      clearInterval(job);
      rs('task is finished');
    }

  }

  function saveFieldState() {
    Task.fieldState = {
      nextStep: Task.curStep
    };
  }

  Task.resume = function resume() {
    console.log(JSON.stringify(Task.fieldState));
    return Task;
  };
  Task.next = function next() {
    console.log('get next step = ' + Task.fieldState.nextStep);
    let next = function() { console.log('and do next step'); };
    return next.call(Task);
  };

  function prepare() {
    console.time('pause clicked');
    console.time('continue clicked');
    for (let x = 0; x < 10; x++) {
      console.time('step ' + x + ' start');
      console.time('step ' + x + ' end');
    }
  }
  Task.send = function send(channel, event, ...args) {
    if (Task.mgr && 'function' == typeof Task.mgr.recieve) {
      Task.mgr.recieve(channel, event, ...args);
    }
  };
  Task.run = function run() {
    if (Task.curStep) {
      console.log('Task continue');
    } else {
      prepare();
      console.log('Task start');
    }

    return new Promise((rs, rj) => {
      job = setInterval(() => { AopStep(job, rs, rj); }, 1000);
    });
  };

  return Task;
})();

module.exports = Task;
