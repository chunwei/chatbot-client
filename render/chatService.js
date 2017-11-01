const http = require('http');
const debug = require('debug')('ChatBot');
const uuid = require('../js/utils').uuid;

var ChatBot = ChatBot || function(opts) {
  if (!(this instanceof ChatBot)) {
    throw new Error(ChatBot.messages.get('mustnew'));
  }
  this.options = opts;
  this.id = opts && opts.id ? opts.id : opts && opts.USERID ? opts.USERID : uuid(12, 16);
  let SETTINGS = opts && opts.SETTINGS ? opts.SETTINGS : {};
  this.url =
    `${SETTINGS.ENDPOINT}?token=${SETTINGS.TOKEN}&appid=${SETTINGS.APPID}&userid=${SETTINGS.USERID}`;
  this.listeners = [];

  debug(`bot ${this.id} created`);
};

module.exports = ChatBot;

ChatBot.messages = (function() {
  let messages = {
    mustnew: 'This object must be created with new',
    couldnotbenull: 'message could not be null'
  };
  return {
    get: function(name) {
      return messages[name];
    }
  };
})();
ChatBot.prototype.getId = function() { return this.id; };
ChatBot.prototype.send = function(msg) {
  if (!msg) return Promise.reject(ChatBot.messages.get('couldnotbenull'));
  let encodedMsg = encodeURI(msg);
  let url = this.url + `&question=${encodedMsg}`;
  return new Promise(function(resolve, reject) {
    let req = http.get(url, function(res) {
      var chunks = [];
      res.on('data', function(chunk) {
        chunks.push(chunk);
      });
      res.on('end', function() {
        var buffer = Buffer.concat(chunks).toString('utf8');
        debug(buffer);
        resolve(buffer);
      });
    });
    req.on('error', e => {
      console.error(`problem with request: ${e.message}`);
      reject(e);
    });
  });
};
/**
 * 注册听众
 */
ChatBot.prototype.addListener = function(sb) {
  this.listeners.push(sb);
};

ChatBot.prototype.heard = function(sth) {
  debug(`${this.getId()} heard ${sth}`);
  this.think(sth);
};


ChatBot.prototype.think = function(sth) {
  debug('thinking ... ');
  let thinker = this.send(sth);
  thinker.then(data => {
    let ret = JSON.parse(data);
    let stages = ret.stage;
    if (ret && stages) {
      stages.forEach(stage => {
        this.talk(stage.message);
      });
    }
  }).catch(reason => {
    console.error(reason);
  });
};

ChatBot.prototype.talk = function(sth) {
  console.trace(this.getId() + ' : ' + sth);
  this.listeners.forEach(function(bot) { bot.heard(sth); });
};
ChatBot.prototype.talkTo = function(sb, sth) {
  sb.heard(sth);
};
