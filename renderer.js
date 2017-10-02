// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
console.log('load renderer.js');


const shell = require('electron').shell
const clipboard = require('electron').clipboard;
const BrowserWindow = require('electron').remote.BrowserWindow;
const ipcRenderer = require('electron').ipcRenderer;
const http = require('http');
const readline = require('readline');
const path = require('path');
const fs = require('fs');

const { SETTINGS, showSettings, loadSetting, saveSetting } = require('./render/setting');
const baidu = require('./js/baiduTTS');
const Reporter = require('./render/jirareporter');
const $chatTester = require('./render/chatTester');
if ($chatTester) {
  console.log('$chatTester ready.')
}
var conversation = []; //保存聊天记录 [{q:string,a:jsonstring},]
var t1 = -1; //计时器
var userid = uuid(12, 16); //like '012345678999';

var scrollContent = document.querySelector('#jqueryScrollbar');
var text = document.getElementById('text');
const btn_send = document.querySelector('.btn_send');
const editArea = document.querySelector('#editArea');

const selectFileBtn = document.getElementById('selectFileBtn');

selectFileBtn.addEventListener('click', function (event) {
  ipcRenderer.send('open-file-dialog');
})

ipcRenderer.on('selected-files', function (event, files) {
  let filenames = files.map(file => path.parse(file).name);
  document.getElementById('selected-file').innerHTML = `测试脚本: ${filenames}`
    //startBatchTest(files);
  testFiles1by1(files);
})

btn_send.addEventListener('click', function () {
  sendTextMessage();
});

editArea.addEventListener('keydown', function (event) {
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
    console.log(`test file i=${i+1} of ${c}`);
    let file = files[i]
    readLine(file).then(res => {
      $chatTester.doTest(res.lines, res.voiceopen).then(
        d => {
          i += 1;
          if (i < c) {
            testOneFile(i);
          } else {
            console.log("test file over at i=" + i);
          }
        }
      );
    });
  }
  testOneFile(0);
}

function startBatchTest(files) {
  console.log(files);
  let alllines = [];
  let voiceopen = false;
  let promises = files.map(file => {
    return readLine(file);
  });
  Promise.all(promises).then(function (arrOfRes) {
    console.log(arrOfRes);
    //合并成一个arr, 同事判断是否开启语音        
    arrOfRes.forEach(res => {
      alllines = alllines.concat(res.lines);
      //只最后载入的文件开启了就开启
      voiceopen = voiceopen || res.voiceopen;
    });
    $chatTester.doTest(alllines, voiceopen);
  }).catch(function (reason) {
    console.error(reason);
  });
}

function readLine(file) {
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
          case "#voice-open":
            voiceopen = true;
            break;
          case "#voice-close":
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
  })

}

function sendTextMessage() {

  // var url = 'http://121.40.16.14:7070/rsvpbot/general/chat?appid=huawei_sow2&userid=' + userid +
  //     '&token=rsvptest2017&question=';
  var msg = editArea.textContent.trim();
  if (!!!msg) return;
  createUserMessage(msg);
  editArea.innerHTML = '';

  if (!handleClientCommand(msg)) {

    var encodedMsg = encodeURI(msg);
    //url += encodedMsg;

    var url =
      `${SETTINGS.ENDPOINT}?token=${SETTINGS.TOKEN}&appid=${SETTINGS.APPID}&userid=${SETTINGS.USERID}&question=${encodedMsg}`;
    console.log(url);
    http.get(url, function (res) {
      //console.log(`STATUS: ${res.statusCode}`);
      //console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
      //res.setEncoding('utf8');//加了这句后chunk会变成string类型
      var chunks = [];
      res.on('data', function (chunk) {
        chunks.push(chunk);
      });
      res.on("end", () => {
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
  if (!!!msg) return;
  createUserMessage(msg);
  editArea.innerHTML = '';
  let fromIndex = this.fromIndex;

  if (!handleClientCommand(msg)) {

    let encodedMsg = encodeURI(msg);
    //url += encodedMsg;

    let url =
      `${SETTINGS.ENDPOINT}?token=${SETTINGS.TOKEN}&appid=${SETTINGS.APPID}&userid=${SETTINGS.USERID}&question=${encodedMsg}`;
    console.log(url);
    let req = http.get(url, function (res) {
      //console.log(`STATUS: ${res.statusCode}`);
      //console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
      //res.setEncoding('utf8');//加了这句后chunk会变成string类型
      var chunks = [];
      res.on('data', function (chunk) {
        chunks.push(chunk);
      });
      res.on("end", () => {
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
    req.on("error", e => {
      console.error(`problem with request: ${e.message}`);
      handleResponse(JSON.stringify(e));
    });
  }

}

function sendTestMessage(msg, resolve, playVoice) {
  // var url = 'http://121.40.16.14:7070/rsvpbot/general/chat?appid=huawei_sow2&userid=' + userid +
  //     '&token=rsvptest2017&question=';
  //var msg = editArea.textContent.trim();
  if (!!!msg) return;
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
        console.log("user source.onended");

        if (!handleClientCommand(msg)) {

          let encodedMsg = encodeURI(msg);
          //url += encodedMsg;

          let url =
            `${SETTINGS.ENDPOINT}?token=${SETTINGS.TOKEN}&appid=${SETTINGS.APPID}&userid=${SETTINGS.USERID}&question=${encodedMsg}`;
          console.log(url);
          let req = http.get(url, function (res) {
            //console.log(`STATUS: ${res.statusCode}`);
            //console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
            //res.setEncoding('utf8');//加了这句后chunk会变成string类型
            var chunks = [];
            res.on('data', function (chunk) {
              chunks.push(chunk);
            });
            res.on("end", () => {
              var buffer = Buffer.concat(chunks).toString('utf8');
              console.log(buffer);
              let p = handleResponse(buffer);
              p.then(d => {
                console.log(d.result);
                if (playVoice) {
                  if (d.text && d.text.length > 0) {
                    baidu.tts(d.text, {
                      per: 2,
                      spd: 5,
                      onended: () => {
                        console.log("dodo source.onended");
                        if ('function' === typeof resolve) resolve(++fromIndex);
                      }
                    })
                  }
                }
                conversation.push({
                  q: msg,
                  a: buffer
                });
              });
            });
          });
          req.on("error", e => {
            console.error(`problem with request: ${e.message}`);
            handleResponse(JSON.stringify(e));
          });
        }

      }
    })
  }
}

function rollbackNlog(rollbackN) {
  var ds = conversation.slice(-rollbackN);
  return ds.map(v => {
    return `Q: ${v.q}\nA: ${v.a}`
  }).join('\n----------------------------------------------------\n');
}

function handleClientCommand(msg) {
  var result = false;
  if (msg.indexOf('jira') == 0) {
    if (!SETTINGS.JIRA_USERNAME || !SETTINGS.JIRA_PASSWORD || !SETTINGS.JIRA_PROJECTID) {
      createReponseMessage("请先在“设置”中填写你的jira帐号、密码及项目id", 'text');
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
          .report(summary, desc, "3", assignee);
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
    return ["1", s]
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
    return ["", s]
  }
}
let Assignees = {
  "卢春尉": "lcw",
  "娄旭芳": "lxf",
  "吴志勇": "wzy",
  "王智璋": "wzz",
  "刘晓金": "lxj",
  "陈梦域": "cmy",
  "岑咪超": "cmc",
  "黎佳骏": "ljj",
  "何佳莉": "hjl",
  "毛卓予": "mzy",
  "黄燕": "hy",
  "戴良智": "dlz"
}

function mapAssignee(s) {
  let a = Assignees[s];
  if (!a) a = s;
  return a;
}

function isNewMsg() {
  var r = false;
  var t = new Date();
  if (t1 == -1 || (t - t1) > 60000) {
    r = true
  }
  t1 = t;
  return r;
}

function createUserMessage(msg) {
  var isNew = isNewMsg();
  var div = document.createElement('div');
  div.className = "ng-scope";
  //                    <div ng-repeat="message in chatContent" class="ng-scope">
  var chatContent =
    `

                    <div class="clearfix" message-directive="">
                        <div ng-switch="" on="message.MsgType" style="overflow: hidden;" >
                            <div ng-switch-default="" class="message ng-scope me" >
                                <div class="message_system ng-scope" style="display:${!!isNew?'block':'none'}">
                                    <div class="content ng-binding ng-scope">${(new Date()).pattern("HH:mm")}</div>
                                </div>
                                <img class="avatar" src="./img/mengbao.jpg" mm-src="./img/mengbao.jpg" title="宝宝" ng-click="showProfile($event,message.MMActualSender)">
                                <div class="content">
                                    <div class="bubble js_message_bubble ng-scope bubble_primary right">

                                        <!--纯文本消息-->
                                        <div class="bubble_cont ng-scope">
                                            <div class="plain">
                                                <pre class="js_message_plain ng-binding" ng-bind-html="message.MMActualContent">${msg}</pre>
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
  div.className = "ng-scope";
  //                    <div ng-repeat="message in chatContent" class="ng-scope">
  var chatContent =
    `

                    <div class="clearfix" message-directive="">
                                    <div ng-switch="" on="message.MsgType" style="overflow: hidden;">
                                        <div ng-switch-default="" class="message ng-scope you">
                                            <img class="avatar" src="./img/doudou.png" mm-src="./img/doudou.png" title="豆豆" ng-click="showProfile($event,message.MMActualSender)">
                                            <div class="content">
                                                <div class="bubble js_message_bubble ng-scope bubble_default left" >
                                                    <div class="bubble_cont ng-scope">
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
    rs('createReponseMessage done')
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
  })
  win.on('close', function () {
    win = null
  })
  win.once('ready-to-show', () => win.show())
  win.loadURL(url)

  let contents = win.webContents
  let css_close =
    `#close { color: white;background:black; opacity: 0.7;position: absolute;bottom: 20px;left: 50%;transform: translateX(-50%);font-size: 12px;text-decoration: none;}`
  let close_btn = `<a id="close" href="javascript:window.close()">关闭此窗体</a>`
  let scriptx =
    `var s=document.createElement('style');s.innerHTML='${css_close}';document.head.appendChild(s);document.body.innerHTML+='${close_btn}';`
  contents.on('did-finish-load', () => {
    contents.executeJavaScript(
      scriptx,
      (result) => {
        //console.log(result)
      });

  })


}

function handleResponse(response) {
  //console.log(typeof response);
  return new Promise((resolve, reject) => {
    let p = null;
    let res;
    let text = "";
    try {
      res = JSON.parse(response);
    } catch (error) {
      p = createReponseMessage(error, 'error');
    }
    //console.log(res);
    if (!res || !res.stage) {
      p = createReponseMessage(response, 'error');
    } else {
      res.stage.forEach(function (stage) {
        //console.log(stage);
        if (stage.message) {
          p = createReponseMessage(stage.message, 'text');
          text += "。" + stage.message; //加句号是未来增加发音停顿
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
  console.log(url);
  http.get(url, function (res) {
    //console.log(`STATUS: ${res.statusCode}`);
    //console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
    res.setEncoding('utf8');
    res.on('data', function (response) {
      console.log('timeout, ', response);
      if (response.indexOf('"status":-1') == -1) {
        handleResponse(response)
      }
    });
  });
}

function scrollBottom(elm) { //$('.box_bd.scroll-content')
  var $elm = $(elm);
  $elm.scrollTop(elm.scrollHeight - $elm.height())
}

jQuery(document).ready(function () {
  window.dynamicScrollbar = jQuery('.scrollbar-dynamic').scrollbar();
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
