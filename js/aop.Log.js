const util = require('util');
const Aop = require('./AOP/Aop');

const number2 = (n) => {
  return ('0' + n).slice(-2);
};
const timestamp = (entry) => {
  const hours = number2(entry.timestamp.getHours());
  const minutes = number2(entry.timestamp.getMinutes());
  const seconds = number2(entry.timestamp.getSeconds());
  return `<span class = 'cw-logview-timestamp' > [${hours}:${minutes}:${seconds}] &nbsp; </span>`;
};
var AopLog = {
  targetView: null,
  logs: [],
  setTargetView: function(element) { this.targetView = $(element); },
  add: function(entry) {
    AopLog.logs.push(entry);
    AopLog.printToLogView(entry);
  },
  clear: function() {
    let tv = this.targetView;
    if (tv) {
      tv.html('');
      this.logs = [];
    }
  },
  toggleWrap: function() {
    let tv = this.targetView;
    if (tv) {
      tv.toggleClass('wordwrap');
    }
  },
  printToLogView: function(entry) {
    //update dom
    return new Promise((resolve, reject) => {
      let tv = this.targetView;
      if (tv) {
        tv.append(`<div class='emu-log-entry'>
                  ${timestamp(entry)}
                  <span class='cw-logview-${entry.type}'>${entry.message}</span>
                  </div>`);
        tv.scrollTop(tv[0].scrollHeight - tv.height());
        resolve('done');
      }
      reject('target log view haven\'t been set');
    });
  }
};

//var logs = [];
[
  'log', 'info', 'trace', 'debug', 'warn', 'error'
].forEach(serverity => {
  Aop.before(serverity, function() {
    //相当于获取log(strtemplate,...args)的结果
    let a0 = util.format.apply(null, arguments);
    let entry = { message: a0, args: arguments, type: serverity, timestamp: new Date() };
    AopLog.add(entry);
  }, console);
});

module.exports = AopLog;

/* console.log();
console.log('hello');
console.log('hi');
console.log('one', 'two');
console.log('hi %s %d', 'linda', 2);
//console.log(logs);
console.log('hi after circular');

console.log(logs[4].message);
console.warn('warn');
console.error('error');
var logsstr = JSON.stringify(logs);
console.log(logsstr); */
