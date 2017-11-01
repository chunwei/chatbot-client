const readline = require('readline');
const fs = require('fs');
//刚载入的时候renderer没完成初始化，所以myR={}，后面会动态加上
const myR = require('../renderer');

class ChatTester {
  constructor() {
    //console.log(typeof myR.sendTestMessage);
  }
  //log(x) { console.log(x); }
  //send(msg) { myR.sendTestMessage(msg); }
  doTest(msgs, playVoice) {
    //outter Promise
    return new Promise((rs, rj) => {
      let c = msgs.length;
      //inner Promise
      function talk(i) {
        console.debug(`test i=${i+1} of ${c}`);
        let p = new Promise((resolve, reject) => {
          if (i < c) {
            myR.sendTestMessage.call({ fromIndex: i }, msgs[i], resolve, playVoice);
          } else {
            reject('test over at i=' + i);
          }
        });
        p.then(d => talk(d)).catch(e => {
          console.trace(e);
          rs(e);
        }).catch((err) => {
          rj(err);
          console.error(err);
        });
      }
      talk(0);
    });
  }

  testFiles1by1(files) {
    let self = this;
    let c = files.length;

    function testOneFile(i) {
      console.debug(`test file i=${i+1} of ${c}`);
      let file = files[i];
      self.readLine(file).then(res => {
        self.doTest(res.lines, res.voiceopen).then(
          d => {
            i += 1;
            if (i < c) {
              testOneFile(i);
            } else {
              console.trace('test file over at i=' + i);
            }
          }
        );
      });
    }
    testOneFile(0);
  }

  readLine(file) {
    return new Promise((resolve, reject) => {
      const rl = readline.createInterface({
        input: fs.createReadStream(file)
      });
      let lines = [];
      let voiceopen = false;
      rl.on('line', (line) => {
        let row = line.trim();
        if (row.length > 0) {
          switch (row) {
            case '#voice-open':
              voiceopen = true;
              break;
            case '#voice-close':
              voiceopen = false;
              break;
            default:
              lines.push(row);
          }
        }
        console.log(`Line from file: ${line}`);
      });
      rl.on('close', () => {
        resolve({
          lines: lines,
          voiceopen: voiceopen
        });
      });
    });

  }
}
module.exports = new ChatTester();
