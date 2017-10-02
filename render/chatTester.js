//刚载入的时候renderer没完成初始化，所以myR={}，后面会动态加上
const myR = require('../renderer');

class ChatTester {
  constructor() {
    console.log(typeof myR.sendTestMessage);
  }
  log(x) { console.log(x) }
  send(msg) { myR.sendTestMessage(msg) }
  doTest(msgs, playVoice) {
    //outter Promise
    return new Promise((rs, rj) => {
      let c = msgs.length;
      //inner Promise
      function talk(i) {
        console.log(`test i=${i+1} of ${c}`);
        let p = new Promise((resolve, reject) => {
          if (i < c) {
            myR.sendTestMessage.call({ fromIndex: i }, msgs[i], resolve, playVoice);
          } else {
            reject("test over at i=" + i);
          }
        });
        p.then(d => talk(d)).catch(e => {
          console.log(e);
          rs(e)
        });
      }
      talk(0);
    });
  }
}
module.exports = new ChatTester();
