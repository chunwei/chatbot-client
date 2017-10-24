const ChatBot = require('../../render/chatService');
describe('ChatBot', function() {
  describe('ChatBot(opts)', function() {
    it('throws a error if call this function without new',
      function() {
        expect(function() { ChatBot(); }).toThrowError(ChatBot.messages.get('mustnew'));
      });
  });
  describe('send(msg)', function() {
    let chatbot;
    let emptyMsgs = [null, undefined, '', 0];
    let SETTINGS = {
      ENDPOINT: 'http://121.40.16.14:7070/rsvpbot/general/chat',
      TOKEN: 'rsvptest2017',
      USERID: 'thisismyname',
      APPID: 'huawei_sow2',
      JIRA_USERNAME: '',
      JIRA_PASSWORD: '',
      JIRA_PROJECTID: '11206'
    };
    beforeEach(function() {
      chatbot = new ChatBot({ SETTINGS: SETTINGS });
    });
    it('return a rejected Promise if msg is not supplied or is empty',
      function(done) {
        emptyMsgs.forEach(function(msg) {
          chatbot.send(msg)
            .then(
              function onSuccess() {
                expect('onSuccess').toBe(false);
                done();
              },
              function onFailed(reason) {
                expect(reason).toEqual('message could not be null');
                done();
              }
            );
        });
      });
    it(`return a resolved promise with string response from chat server if success, 
        or a reject promise with an Error if failed`,
      function(done) {
        chatbot.send('你好')
          .then(
            function onSuccess(data) {
              expect(data).not.toBeUndefined();
              done();
            },
            function onFailed(reason) {
              console.log(reason);
              expect(reason instanceof Error).toBe(true);
              done();
            }
          );
      });
  });
});
