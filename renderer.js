// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
console.log('load renderer.js');


const shell = require('electron').shell;
//const clipboard = require('electron').clipboard
const BrowserWindow = require('electron').remote.BrowserWindow;
const ipcRenderer = require('electron').ipcRenderer;
const http = require('http');
const readline = require('readline');
const path = require('path');
const fs = require('fs');

const AopLog = require('./js/aop.Log');
AopLog.setTargetView('div.cw-logview');
const { SETTINGS, showSettings /* , loadSetting, saveSetting */ } = require('./render/setting');
const jsonFormatter = require('./render/jsonFormatter');
const baidu = require('./js/baiduTTS');
const Reporter = require('./render/jirareporter');
const $chatTester = require('./render/chatTester');
const TaskChatTester = require('./js/task.chattester');

require('./js/imports');
let { debugActionsWidget, tmgr } = require('./render/debug-actions-widget');

/* if ($chatTester) {
  console.log('$chatTester ready.');
} */
var conversation = []; //保存聊天记录 [{q:string,a:jsonstring},]
var t1 = -1; //计时器
//var userid = uuid(12, 16); //like '012345678999';

var scrollContent = document.querySelector('#jqueryScrollbar');
//var text = document.getElementById('text');
const btn_send = document.querySelector('.btn_send');
const editArea = document.querySelector('#editArea');

const topLevelLRSplitPane = $('div.split-pane.fixed-left');
const showRightPanel = document.getElementById('showRightPanel');
const hideRightPanel = document.getElementById('hideRightPanel');
showRightPanel.addEventListener('click', function() {
  topLevelLRSplitPane.splitPane('lastComponentSize', 0);
  topLevelLRSplitPane.splitPane('lastComponentSize', parseInt(topLevelLRSplitPane.data('rightsize')));
  showRightPanel.classList.add('hidden');
});




hideRightPanel.addEventListener('click', function() {
  topLevelLRSplitPane.data('rightsize', topLevelLRSplitPane.children('.split-pane-component:last').css('left'));
  topLevelLRSplitPane.splitPane('lastComponentSize', 0);

  showRightPanel.classList.remove('hidden');
});

const selectFileBtn = document.getElementById('selectFileBtn');

selectFileBtn.addEventListener('click', function() {
  ipcRenderer.send('open-file-dialog');
});
/* const scheduleBtn = document.getElementById('scheduleBtn');

scheduleBtn.addEventListener('click', function() {
  ipcRenderer.send('open-information-dialog');
}); */

const showLogViewCMBtn = document.getElementById('showLogViewCMBtn');

showLogViewCMBtn.addEventListener('click', function() {
  ipcRenderer.send('show-logview-context-menu');
});

ipcRenderer.on('update-message', function(event, text) {
  if (text.indexOf('Error') > -1) {
    console.error(text);
  } else {
    console.log(text);
  }
});

ipcRenderer.on('selected-files', function(event, files, launchAndDebug) {
  debugActionsWidget.classList.remove('hidden');
  let filenames = files.map(file => path.parse(file).name);
  document.getElementById('selected-file').innerHTML = `脚本: ${filenames}`;
  startBatchTest(files, launchAndDebug);
  //$chatTester.testFiles1by1(files);
  //tmgr.setTask(task);
  //tmgr.start();
});

function simulateMouseEvent(elm, etype) {
  var event = new MouseEvent(etype, {
    view: window,
    bubbles: true,
    cancelable: true
  });
  elm.dispatchEvent(event);
}

ipcRenderer.on('start-debugger', function() {
  console.log('start-debugger');
  ipcRenderer.send('open-file-dialog', true);
});
['stop', 'restart', 'continue', 'step-over', 'pause'].forEach(
  (action) => {
    ipcRenderer.on(action + '-debugger', function() {
      let elm = debugActionsWidget.querySelector('.debug-action.' + action);
      simulateMouseEvent(elm, 'mouseup');
    });
  }
);


ipcRenderer.on('show-settings', function() {
  showSettings();
});
ipcRenderer.on('ubcm-start-from-here', function(e, iid) {
  console.log(iid);
  //保留选中句子
  let q = conversation[iid].q;
  //清除对话列表，包括dom和数据
  let messageitem = $('.conversation div[inputid=' + iid + ']').parents('.message_item').first();
  messageitem.nextUntil('.bottom-placeholder').remove(); //  .css({ 'color': 'red', 'border': '2px solid green' });
  messageitem.remove();
  conversation.splice(iid);

  //这句话重发
  sendTestMessageWithoutVoice(q);
});

ipcRenderer.on('ubcm-say-it-again', function(e, iid) {
  console.log(iid);
  let q = conversation[iid].q;
  sendTestMessageWithoutVoice(q);
});

ipcRenderer.on('logcm-clear-log', function(e) {
  AopLog.clear();
});
ipcRenderer.on('logcm-switch-wordwrap', function(e) {
  AopLog.toggleWrap();
});
$('.conversation').on('contextmenu', '.bubble.bubble_primary.right', function() {
  let iid = $(this).attr('inputid');
  console.debug('contextmenu on %s', iid);
  ipcRenderer.send('show-user-bubble-context-menu', iid);
});
//每句对话监听点击
$('.conversation').on('click', '.bubble', function() {
  let rid = $(this).attr('responseid');
  //console.log(rid);
  let qa = conversation[rid];
  if (rid && qa) {
    var json = jsonFormatter.format({ input: qa.q, response: JSON.parse(qa.a) });
    $('.cw-inspectorview-json').html(json);
  } else {
    $('.cw-inspectorview-json').html($(this).text().trim());
  }
});

btn_send.addEventListener('click', function() {
  sendTextMessage();
});

editArea.addEventListener('keydown', function(event) {
  //console.log(event);
  if ( /*event.ctrlKey &&*/ event.keyCode == 13) {
    event.preventDefault();
    sendTextMessage();
  }
  /*             if (event.ctrlKey && event.key == 'v') {
                  event.preventDefault();
                  editArea.textContent += clipboard.readText();
                  editArea.selectionStart = editArea.selectionEnd = 10;
              } */
});

function testFiles1by1(files) {
  let c = files.length;

  function testOneFile(i) {
    console.debug(`test file i=${i+1} of ${c}`);
    let file = files[i];
    readLine(file).then(res => {
      $chatTester.doTest(res.lines, res.voiceopen).then(
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

function startTask(taskInfo) {
  let task = new TaskChatTester();
  task.setTaskInfo(taskInfo);
  //task.setMessages(taskInfo.alllines);
  //task.setBreakPoints(taskInfo.breakpoints)
  task.step = function() {
    let self = task;
    return new Promise((resolve, reject) => {
      let msg = self.messages[self.curStep];
      let voiceopen = taskInfo.voices[self.curStep];
      if (!msg || self.curStep < 0 || self.curStep > self.messages.length - 1) {
        reject('数组越界或msg为空');
      } else {
        sendTestMessage.call({ fromIndex: self.curStep }, msg, resolve, voiceopen);
      }
    });
  };
  tmgr.setTask(task);
  tmgr.start();
}

function startBatchTest(files, launchAndDebug) {
  console.log(files);
  let taskInfo = { lines: [], breakpoints: [], voices: [] };
  let voiceopen = false;
  let promises = files.map(file => {
    return readLine(file);
  });
  Promise.all(promises).then(function(arrOfRes) {
    console.log(arrOfRes);
    //合并成一个arr, 同时判断是否开启语音        
    arrOfRes.forEach(res => {
      ['lines', 'breakpoints', 'voices'].forEach(p => {
        taskInfo[p] = taskInfo[p].concat(res[p]);
      });

      //只最后载入的文件开启了就开启
      voiceopen = voiceopen || res.voiceopen;
    });
    //让任务管理器来接管
    //$chatTester.doTest(alllines, voiceopen);

    if (launchAndDebug) {
      taskInfo.breakpoints[1] = true;
    }

    startTask(taskInfo);
  }).catch(function(reason) {
    console.error(reason);
  });
}

function readLine(file) {
  return new Promise((resolve, reject) => {
    let lines = [];
    let voices = [];
    let breakpoints = [];
    let voiceopen = false;
    let breakpoint = false;

    const rl = readline.createInterface({
      input: fs.createReadStream(file)
    });

    rl.on('line', (line) => {
      let row = line.trim();
      //跳过空行
      if (row.length > 0) {
        //注释和指令
        if (row.indexOf('#') == 0) {
          switch (row) {
            case '#voice-open':
              voiceopen = true;
              break;
            case '#voice-close':
              voiceopen = false;
              break;
            case '#breakpoint':
            case '#debugger':
            case '#pause':
              breakpoint = true;
              break;
            default:
              //comments
          }
        } else {
          lines.push(row);
          voices.push(voiceopen);
          breakpoints.push(breakpoint);
          breakpoint = false;
        }
      }
      console.log(`Line from file: ${line}`);
    });
    rl.on('close', () => {
      resolve({
        lines: lines,
        breakpoints: breakpoints,
        voices: voices,
        voiceopen: voiceopen
      });
    });
  });

}

function sendTextMessage() {

  // var url = 'http://121.40.16.14:7070/rsvpbot/general/chat?appid=huawei_sow2&userid=' + userid +
  //     '&token=rsvptest2017&question=';
  var msg = editArea.textContent.trim();
  if (!msg) return;
  createUserMessage(msg);
  editArea.innerHTML = '';
  showLoadingBubble();
  if (!handleClientCommand(msg)) {

    var encodedMsg = encodeURI(msg);
    //url += encodedMsg;

    var url =
      `${SETTINGS.ENDPOINT}?token=${SETTINGS.TOKEN}&appid=${SETTINGS.APPID}&userid=${SETTINGS.USERID}&question=${encodedMsg}`;
    console.log('GET %s', url);
    http.get(url, function(res) {
      //console.log(`STATUS: ${res.statusCode}`);
      //console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
      //res.setEncoding('utf8');//加了这句后chunk会变成string类型
      var chunks = [];
      res.on('data', function(chunk) {
        chunks.push(chunk);
      });
      res.on('end', () => {
        var buffer = Buffer.concat(chunks).toString('utf8');
        console.log(buffer);
        handleResponse(buffer);
        conversation.push({
          q: msg,
          a: buffer
        });
      });
    });
  }

}

function sendTestMessageWithoutVoice(msg, resolve) {

  // var url = 'http://121.40.16.14:7070/rsvpbot/general/chat?appid=huawei_sow2&userid=' + userid +
  //     '&token=rsvptest2017&question=';
  //var msg = editArea.textContent.trim();
  if (!msg) return;
  createUserMessage(msg);
  editArea.innerHTML = '';
  let fromIndex = this.fromIndex;
  showLoadingBubble();
  if (!handleClientCommand(msg)) {

    let encodedMsg = encodeURI(msg);
    //url += encodedMsg;

    let url =
      `${SETTINGS.ENDPOINT}?token=${SETTINGS.TOKEN}&appid=${SETTINGS.APPID}&userid=${SETTINGS.USERID}&question=${encodedMsg}`;
    console.log('GET %s', url);
    let req = http.get(url, function(res) {
      //console.log(`STATUS: ${res.statusCode}`);
      //console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
      //res.setEncoding('utf8');//加了这句后chunk会变成string类型
      var chunks = [];
      res.on('data', function(chunk) {
        chunks.push(chunk);
      });
      res.on('end', () => {
        var buffer = Buffer.concat(chunks).toString('utf8');
        console.log(buffer);
        let p = handleResponse(buffer);
        p.then(d => {
          console.log(d.result);
          conversation.push({
            q: msg,
            a: buffer
          });
          if ('function' === typeof resolve) resolve(++fromIndex);
        });
      });
    });
    req.on('error', e => {
      console.error(`problem with request: ${e.message}`);
      handleResponse(JSON.stringify(e));
    });
  }

}

function showLoadingBubble() {
  //start a loading bubble
  createReponseMessage('', 'loading');
}

function deleteLoadingBubble() {
  //console.log('deleteLoadingBubble');
  var loadingBubble = document.querySelector('.bottom-placeholder').previousElementSibling;
  if (loadingBubble.querySelector('.loading-bubble')) {
    loadingBubble.remove();
  }
}

function sendTestMessage(msg, resolve, playVoice) {
  // var url = 'http://121.40.16.14:7070/rsvpbot/general/chat?appid=huawei_sow2&userid=' + userid +
  //     '&token=rsvptest2017&question=';
  //var msg = editArea.textContent.trim();
  if (!msg) return;
  if (!playVoice) {
    sendTestMessageWithoutVoice.call(this, msg, resolve);
    return;
  }
  createUserMessage(msg);
  editArea.innerHTML = '';
  let fromIndex = this.fromIndex;

  if (playVoice) {
    baidu.tts(msg, {
      per: 0,
      spd: 7,
      onended: () => {
        console.log('user voice.onended');
        showLoadingBubble();
        if (!handleClientCommand(msg)) {

          let encodedMsg = encodeURI(msg);
          //url += encodedMsg;

          let url =
            `${SETTINGS.ENDPOINT}?token=${SETTINGS.TOKEN}&appid=${SETTINGS.APPID}&userid=${SETTINGS.USERID}&question=${encodedMsg}`;
          console.log('GET %s', url);
          let req = http.get(url, function(res) {
            //console.log(`STATUS: ${res.statusCode}`);
            //console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
            //res.setEncoding('utf8');//加了这句后chunk会变成string类型
            var chunks = [];
            res.on('data', function(chunk) {
              chunks.push(chunk);
            });
            res.on('end', () => {
              var buffer = Buffer.concat(chunks).toString('utf8');
              console.log(buffer);
              //deleteLoadingBubble();//move into handleResponse() function
              let p = handleResponse(buffer);
              p.then(d => {
                console.log(d.result);
                if (playVoice) {
                  if (d.text && d.text.length > 0) {
                    baidu.tts(d.text, {
                      per: 4,
                      spd: 5,
                      onended: () => {
                        console.log('dodo voice.onended');
                        if ('function' === typeof resolve) resolve(++fromIndex);
                      }
                    });
                  }
                }
                conversation.push({
                  q: msg,
                  a: buffer
                });
              });
            });
          });
          req.on('error', e => {
            console.error(`problem with request: ${e.message}`);
            handleResponse(JSON.stringify(e));
          });
        }

      }
    });
  }
}

function rollbackNlog(rollbackN) {
  var ds = conversation.slice(-rollbackN);
  return ds.map(v => {
    return `Q: ${v.q}\nA: ${v.a}`;
  }).join('\n----------------------------------------------------\n');
}

function handleClientCommand(msg) {
  var result = false;
  if (msg.indexOf('jira') == 0) {
    if (!SETTINGS.JIRA_USERNAME || !SETTINGS.JIRA_PASSWORD || !SETTINGS.JIRA_PROJECTID) {
      createReponseMessage('请先在“设置”中填写你的jira帐号、密码及项目id', 'text');
      return true;
    }
    let ss1 = splitAssignee(msg.substring(4).trim());
    let assignee = mapAssignee(ss1[0]);
    ss = splitNS(ss1[1]);
    if (ss) {
      rollbackN = ss[0]; //多少组上下文
      summary = ss[1];
      if (summary.trim().length > 0) {
        var desc = rollbackNlog(rollbackN);
        new Reporter(SETTINGS.JIRA_USERNAME, SETTINGS.JIRA_PASSWORD, SETTINGS.JIRA_PROJECTID)
          .report(summary, desc, '3', assignee);
      }
      result = true;
    }

  } else if (msg.indexOf('test') == 0) {
    var mymsg = msg.substring(4).trim();
    handleResponse(mymsg);
    result = true;
  }
  return result;
}
/**
 * 分离数字指令和描述，如：-9 xxxx，分为r[1]=9和r[2]=xxxx
 * @param s
 * @return String[] 
 */
function splitNS(s) {
  var r = s.match(/^-(\d+)((\D)(.*))/);
  if (r) {
    return [r[1], r[2]];
  } else {
    return ['1', s];
  }
}
/**
 * 分离出<>中的内容和<>之后的内容，如：<lcw> xxxx，分为r[1]=lcw和r[2]=xxxx
 * @param s
 * @return String[] 
 */
function splitAssignee(s) {
  var r = s.match(/^<(.+)>\s*(.*)/);
  if (r) {
    return [r[1], r[2]];
  } else {
    return ['', s];
  }
}
let Assignees = {
  '卢春尉': 'lcw',
  '娄旭芳': 'lxf',
  '吴志勇': 'wzy',
  '王智璋': 'wzz',
  '刘晓金': 'lxj',
  '陈梦域': 'cmy',
  '岑咪超': 'cmc',
  '黎佳骏': 'ljj',
  '何佳莉': 'hjl',
  '毛卓予': 'mzy',
  '黄燕': 'hy',
  '戴良智': 'dlz'
};

function mapAssignee(s) {
  let a = Assignees[s];
  if (!a) a = s;
  return a;
}

function isNewMsg() {
  var r = false;
  var t = new Date();
  if (t1 == -1 || (t - t1) > 60000) {
    r = true;
  }
  t1 = t;
  return r;
}

function createUserMessage(msg) {
  var isNew = isNewMsg();
  var div = document.createElement('div');
  div.className = 'message_item';
  var chatContent =
    `

                    <div class="clearfix">
                        <div style="overflow: hidden;">
                            <div class="message me" >
                                <div class="message_system" style="display:${isNew?'block':'none'}">
                                    <div class="content">${(new Date()).pattern('HH:mm')}</div>
                                </div>
                                <img class="avatar" src="./img/mengbao.jpg" title="宝宝">
                                <div class="content">
                                    <div class="bubble js_message_bubble bubble_primary right" inputid=${conversation.length}>
                                        <!--纯文本消息-->
                                        <div class="bubble_cont">
                                            <div class="plain">
                                                <pre class="js_message_plain">${msg}</pre>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

        `;
  div.innerHTML = chatContent;
  var ph = document.querySelector('.bottom-placeholder');
  ph.parentNode.insertBefore(div, ph);
  scrollBottom(scrollContent);
}

function buildMessageByType(msg, type, options) {
  var res;
  switch (type) {
    case 'image':
      res =
        `
                    <div class="picture">
                        <img class="msg-img" onclick="previewImg('${msg}')" src="${msg}">
                        <i class="arrow"></i>
                    </div>
                    `;
      break;
    case 'voice':
      res =
        `
                    <div class="voice" style="width: 300px;padding: 5px;">
                        <audio src="${msg}" controls style="display: block;">
                    </div>
                `;
      break;
    case 'video':
      res =
        `
                    <div class="video" ng-click="showVideo(message.MsgId)">
                        <video src="${msg}" controls  style="display:block;max-width:500px;">
                    </div>
                `;
      break;
    case 'link':
      res =
        `
                    <a href="javascript:void(0);" onclick="openExternal('${msg}')" class="app">
                        <h4 class="title">${options.title}</h4>
                        <p class="desc">${options.description} </p>
                    </a>
                    </div>
                `;
      break;
    case 'loading': //text
      res =
        `
                    <div class="plain loading-bubble">
                        <div class="loader loader-3"><div class="dot dot1"></div><div class="dot dot2"></div><div class="dot dot3"></div></div>
                    </div>
                    `;
      break;
    case 'error': //text
      res =
        `
                    <div class="plain">
                        <pre class="js_message_plain error">${msg}</pre>
                    </div>
                    `;
      break;
    default: //text
      res =
        `
                    <div class="plain">
                        <pre class="js_message_plain ng-binding">${msg}</pre>
                    </div>
                    `;

  }
  return res;
}

function openExternal(url) {
  shell.openExternal(url);
}

function createReponseMessage(msg, type, options) {
  var type = type || 'text';
  var typedMessage = buildMessageByType(msg, type, options);
  var div = document.createElement('div');
  div.className = 'message_item';
  var chatContent =
    `

                    <div class="clearfix">
                                    <div style="overflow: hidden;">
                                        <div class="message you">
                                            <img class="avatar" src="./img/doudou.png" mm-src="./img/doudou.png" title="豆豆">
                                            <div class="content">
                                                <div class="bubble js_message_bubble bubble_default left" responseid=${conversation.length}>
                                                    <div class="bubble_cont">
                                                        ${typedMessage}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

        `;
  div.innerHTML = chatContent;
  var ph = document.querySelector('.bottom-placeholder');
  ph.parentNode.insertBefore(div, ph);
  scrollBottom(scrollContent);
  return new Promise((rs, rj) => {
    rs('createReponseMessage done');
  });
}
/**
 * 获取后缀名
 */
function getExt(url) {
  url = url.trim();
  if (!url) return '';
  var suffix = '';
  var lastDotPos = url.lastIndexOf('.');
  if (lastDotPos > -1) {
    suffix = url.substring(lastDotPos + 1, url.length); //后缀名
  }
  return suffix;
}
/**
 * 图片预览
 */
function previewImg(url) {
  let win = new BrowserWindow({
    //frame: false,
  });
  win.on('close', function() {
    win = null;
  });
  win.once('ready-to-show', () => win.show());
  win.loadURL(url);

  let contents = win.webContents;
  let css_close =
    '#close { color: white;background:black; opacity: 0.7;position: absolute;bottom: 20px;left: 50%;transform: translateX(-50%);font-size: 12px;text-decoration: none;}';
  let close_btn = '<a id="close" href="javascript:window.close()">关闭此窗体</a>';
  let scriptx =
    `var s=document.createElement('style');s.innerHTML='${css_close}';document.head.appendChild(s);document.body.innerHTML+='${close_btn}';`;
  contents.on('did-finish-load', () => {
    contents.executeJavaScript(
      scriptx,
      (result) => {
        //console.log(result)
      });

  });


}

function handleResponse(response) {
  //if there is a loading bubble, delete it before create new response bubble
  deleteLoadingBubble();
  //console.log(typeof response);
  return new Promise((resolve, reject) => {
    let p = null;
    let res;
    let text = '';
    try {
      res = JSON.parse(response);
    } catch (error) {
      p = createReponseMessage(error, 'error');
    }
    //console.log(res);
    if (!res || !res.stage) {
      p = createReponseMessage(response, 'error');
    } else {
      res.stage.forEach(function(stage) {
        //console.log(stage);
        if (stage.message) {
          p = createReponseMessage(stage.message, 'text');
          text += '。' + stage.message; //加句号是未来增加发音停顿
        }
        if (stage.image) {
          p = createReponseMessage(stage.image, 'image');
        }
        if (stage.url) {
          let suffix = getExt(stage.url);
          let type = 'link';
          if (suffix.match(/mp3|m4a|amr|ogg|wav|aac/i)) {
            type = 'voice';
          } else if (suffix.match(/mp4|avi|webm/i)) {
            type = 'video';
          }
          p = createReponseMessage(stage.url, type, {
            title: stage.title || '链接',
            description: stage.description || '点击打开'
          });
        }
      });
    }
    p.then(d => {
      console.log(d);
      updateTimeout();
      resolve({
        result: 'handleResponse done',
        text: text
      });
    });

  });
}
var userIdleTimeout = null;

function updateTimeout() {
  if (userIdleTimeout) {
    clearTimeout(userIdleTimeout);
  }
  userIdleTimeout = setTimeout(timeout, 60000);
}
//用户发呆超过10秒时触发
function timeout() {
  var s = SETTINGS.ENDPOINT;
  var timeoutEndPoint = s.substring(0, s.lastIndexOf('/')) + '/timeout';
  var url =
    `${timeoutEndPoint}?token=${SETTINGS.TOKEN}&appid=${SETTINGS.APPID}&userid=${SETTINGS.USERID}`;
  console.log('GET %s', url);
  http.get(url, function(res) {
    //console.log(`STATUS: ${res.statusCode}`);
    //console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
    res.setEncoding('utf8');
    res.on('data', function(response) {
      if (response.indexOf('"status":-1') == -1) {
        console.log('timeout triggered, ', response);
        handleResponse(response);
      } else {
        console.error('timeout triggered, service not implement ', response);
      }
    });
  });
}

function scrollBottom(elm) { //$('.box_bd.scroll-content')
  var $elm = $(elm);
  $elm.scrollTop(elm.scrollHeight - $elm.height());
}

jQuery(document).ready(function() {
  window.dynamicScrollbar = jQuery('.scrollbar-dynamic').scrollbar();

  console.log('app ready');

  var p = new Promise((rv, rj) => {
    //const jsonFormatter = require('./render/jsonFormatter');
    //var json = jsonFormatter.format({ a: "good", b: 1, c: true, d: false, e: { obj: "obj", array: [1, 2, 3] } });
    //let my_settings = window.localStorage.getItem('SETTINGS');
    if (SETTINGS) {
      var json = jsonFormatter.format(SETTINGS);
      $('.cw-inspectorview-json').html(json);
      rv('done');
    }
  });
  p.then(d => {
    $('.cw-inspectorview-json').prepend('<p>点菜单 编辑 -> 设置 (快捷键ctrl+s) 配置服务 </p><p>当前配置如下：</p>');
  });

});

function handleWindowKeyEvent(event) {
  //console.log(`${event.ctrlKey} && ${event.shiftKey} && ${event.key}`);
  if (event.ctrlKey && event.shiftKey && event.key == 'I') {
    //const ipcRenderer = require('electron').ipcRenderer;
    ipcRenderer.send('toggleDevTools', 'toggleDevTools');
  }
}
window.addEventListener('keydown', handleWindowKeyEvent, true);

exports.sendTestMessage = sendTestMessage;
exports.createReponseMessage = createReponseMessage;
exports.openExternal = openExternal;
exports.previewImg = previewImg;
exports.conversation = conversation;
exports.$chatTester = $chatTester;
