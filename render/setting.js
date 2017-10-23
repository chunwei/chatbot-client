const uuid = require('../js/utils').uuid;
var SETTINGS;

function saveSetting(settings) {
  window.localStorage.setItem('SETTINGS',
    JSON.stringify(settings));
}

function loadSetting() {
  if (!window.localStorage.getItem('SETTINGS')) {
    var defaultSETTINGS = {
      ENDPOINT: 'http://121.40.16.14:7070/rsvpbot/general/chat',
      TOKEN: 'rsvptest2017',
      USERID: uuid(12, 16),
      APPID: 'huawei_sow2',
      JIRA_USERNAME: '',
      JIRA_PASSWORD: '',
      JIRA_PROJECTID: '11206'
    };
    saveSetting(defaultSETTINGS);
  }
  SETTINGS = JSON.parse(window.localStorage.getItem('SETTINGS'));
  //token是后期独立出来的，早期本可能没有保存
  //ENDPOINT旧格式中需去掉token
  if (!SETTINGS.TOKEN) {
    SETTINGS.TOKEN = 'rsvptest2017';
    SETTINGS.ENDPOINT = SETTINGS.ENDPOINT.substring(0, SETTINGS.ENDPOINT.lastIndexOf('?'));
  }
  SETTINGS.JIRA_USERNAME = SETTINGS.JIRA_USERNAME || '';
  SETTINGS.JIRA_PASSWORD = SETTINGS.JIRA_PASSWORD || '';
  SETTINGS.JIRA_PROJECTID = SETTINGS.JIRA_PROJECTID || '11206';
}
loadSetting();

function showSettings() {
  if (document.getElementById('settings_panel').style.display == 'block') {
    SETTINGS.ENDPOINT = document.getElementById('settings_endpoint').value;
    SETTINGS.TOKEN = document.getElementById('settings_token').value;
    SETTINGS.APPID = document.getElementById('settings_appid').value;
    SETTINGS.USERID = document.getElementById('settings_userid').value;
    SETTINGS.JIRA_PROJECTID = document.getElementById('settings_jira_projectid').value;
    SETTINGS.JIRA_USERNAME = document.getElementById('settings_jira_username').value;
    SETTINGS.JIRA_PASSWORD = document.getElementById('settings_jira_password').value;
    Object.keys(SETTINGS).forEach(key => {
      SETTINGS[key] = SETTINGS[key].trim();
    });
    saveSetting(SETTINGS);
    document.getElementById('settings_panel').style.display = 'none';
  } else {
    document.getElementById('settings_endpoint').value = SETTINGS.ENDPOINT;
    document.getElementById('settings_token').value = SETTINGS.TOKEN;
    document.getElementById('settings_appid').value = SETTINGS.APPID;
    document.getElementById('settings_userid').value = SETTINGS.USERID;
    document.getElementById('settings_jira_projectid').value = SETTINGS.JIRA_PROJECTID;
    document.getElementById('settings_jira_username').value = SETTINGS.JIRA_USERNAME;
    document.getElementById('settings_jira_password').value = SETTINGS.JIRA_PASSWORD;
    document.getElementById('settings_panel').style.display = 'block';
  }
}
document.body.querySelectorAll('.showSettings').forEach((el) => {
  el.addEventListener('click', showSettings);
});
module.exports = { SETTINGS, showSettings, loadSetting, saveSetting };
