const ChatBot = require('./chatService');

let SETTINGS = {
  ENDPOINT: 'http://www.faxiaobot.cn/rsvpbot/general/chat',
  TOKEN: 'rsvptest2017',
  USERID: 'thisismyname',
  APPID: 'huawei_sow2',
  JIRA_USERNAME: '',
  JIRA_PASSWORD: '',
  JIRA_PROJECTID: '11206'
};


let bot1 = new ChatBot({ SETTINGS, id: 'bot1' });
let bot2 = new ChatBot({ SETTINGS, id: 'bot2' });
//let bot3 = new ChatBot({ SETTINGS, id: 'bot3' });

bot1.addListener(bot2);
bot2.addListener(bot1);
//bot2.addListener(bot3);
bot2.talk('你好');
//bot1.talk('我们来玩老师和学生的游戏吧');
//bot2.talk('明天天气怎么样');
//bot2.talkTo(bot3, 'good morning');
