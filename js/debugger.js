const TaskManager = require('./taskmanager');
const Task = require('./task.chattester');
//const Task1 = require('./task.1');


//////// test //////////////

//let tmgr = new TaskManager(Task1);
let task = new Task();
task.setMessages(['m1', 'm2', 'm2']);
task.step = function() {
  let self = task;

  return new Promise((resolve, reject) => {
    console.log(self.messages[self.curStep]);
    resolve(1 + self.curStep);
    // myR.sendTestMessage.call({ fromIndex: self.curStep }, msgs[self.curStep], resolve, playVoice);
  });
};
let tmgr = new TaskManager(task);


tmgr.start();

console.log(tmgr.state);
tmgr.start();
setTimeout(() => {
  console.timeEnd('pause clicked');
  tmgr.pause();
}, 2000);
/* setTimeout(() => {
  tmgr.stop();
}, 3000); */
setTimeout(() => {
  console.timeEnd('continue clicked');
  tmgr.continue();
}, 5000);
setTimeout(() => {
  tmgr.restart();
}, 6000);
setTimeout(() => {
  tmgr.pause();
}, 6005);
setTimeout(() => {
  tmgr.stepover();
}, 8000);
setTimeout(() => {
  tmgr.stepover();
}, 9000);
setTimeout(() => {
  tmgr.restart();
}, 12000);
setTimeout(() => {
  tmgr.stop();
}, 13000);
