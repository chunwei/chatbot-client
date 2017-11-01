const TaskManager = require('./taskmanager');
const Task = require('./task');
//const Task1 = require('./task.1');


//////// test //////////////

//let tmgr = new TaskManager(Task1);
let task = new Task();
let tmgr = new TaskManager(task);
//console.log(tmgr);
//console.log(task);
/* tmgr.on('finish', function(event) {
  console.log('on finish : %s', event);
});
tmgr.on('stop', function(event) {
  console.log('on stop : %s', event);
});
tmgr.on('breakpoint', function(event) {
  console.log('on breakpoint : %s', event);
});
tmgr.on('stepover', function(event) {
  console.log('on stepover : %s', event);
});
tmgr.on('pause', function(event) {
  console.log('on pause listener1: %s', event);
});
tmgr.on('pause', function(event) {
  console.log('on pause listener2 : %s', event);
}); */

tmgr.start();

console.log(tmgr.state);
tmgr.start();
setTimeout(() => {
  console.timeEnd('pause clicked');
  tmgr.pause();
}, 5300);
setTimeout(() => {
  console.timeEnd('continue clicked');
  tmgr.continue();
}, 8500);
setTimeout(() => {
  tmgr.stepover();
}, 12000);
setTimeout(() => {
  tmgr.stepover();
}, 15000);
setTimeout(() => {
  tmgr.restart();
}, 18000);
setTimeout(() => {
  tmgr.continue();
}, 28000);
setTimeout(() => {
  tmgr.stop();
}, 33000);
