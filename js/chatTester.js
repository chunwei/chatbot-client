class ChatTester {
  log(x) { console.log(x) }
  send(msg) { sendTestMessage(msg) }
  doTest(msgs, playVoice) {
    //outter Promise
    return new Promise((rs, rj) => {
      let c = msgs.length;
      //inner Promise
      function talk(i) {
        console.debug(`test i=${i+1} of ${c}`);
        let p = new Promise((resolve, reject) => {
          if (i < c) {
            sendTestMessage.call({ fromIndex: i }, msgs[i], resolve, playVoice);
          } else {
            reject("test over at i=" + i);
          }
        });
        p.then(d => talk(d)).catch(e => {
          console.error(e);
          rs(e)
        });
      }
      talk(0);
    });
  }
}
module.exports = new ChatTester();
