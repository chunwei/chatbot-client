const autoUpdater = require('electron-updater').autoUpdater;
const ChildProcess = require('child_process');
const Menu = require('electron').Menu;
const path = require('path');
const { bytesToSize, secondsFriendly } = require('./js/utils');

let win;

exports.setWin = function setWin(bw) {
  win = bw;
}

function sendStatusToWindow(text) {
  //log.info(text);
  win.webContents.send('update-message', text);
}


let state = 'no-update';

exports.initialize = function() {
  if (process.mas) return;

  autoUpdater.on('checking-for-update', function() {
    state = 'checking';
    exports.updateMenu();
    sendStatusToWindow('Checking for update...');
  });

  autoUpdater.on('update-available', function(updateInfo) {
    state = 'checking';
    exports.updateMenu();
    sendStatusToWindow('有可用更新，最新版本号 ' + updateInfo.version);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    state = 'downloading';
    exports.updateMenu();
    //0 B/s - 510 KB，共 50.3 MB
    let log_message = '下载中: ' + bytesToSize(progressObj.bytesPerSecond) + '/s';
    log_message = log_message + ' - ' + progressObj.percent.toPrecision(3) + '%';
    log_message = log_message + ' (' + bytesToSize(progressObj.transferred) + '，共' + bytesToSize(progressObj.total) + ')';
    log_message = log_message + ' - 还需' + secondsFriendly((progressObj.total - progressObj.transferred) / progressObj.bytesPerSecond);
    sendStatusToWindow(log_message);
  });

  autoUpdater.on('update-downloaded', function() {
    state = 'installed';
    exports.updateMenu();
    sendStatusToWindow('更新包下载完成，将在应用重启后更新。');
  });

  autoUpdater.on('update-not-available', function() {
    state = 'no-update';
    exports.updateMenu();
    sendStatusToWindow('你安装的已经是最新版了。');
  });

  autoUpdater.on('error', function(err) {
    state = 'no-update';
    exports.updateMenu();
    sendStatusToWindow('Error in auto-updater. ' + err);
  });

  autoUpdater.checkForUpdates();
};

exports.updateMenu = function() {
  if (process.mas) return;

  let menu = Menu.getApplicationMenu();
  if (!menu) return;

  menu.items.forEach(function(item) {
    if (item.submenu) {
      item.submenu.items.forEach(function(item) {
        switch (item.key) {
          case 'checkForUpdate':
            item.visible = state === 'no-update';
            break;
          case 'checkingForUpdate':
            item.visible = state === 'checking';
            break;
          case 'downloadingUpdate':
            item.visible = state === 'downloading';
            break;
          case 'restartToUpdate':
            item.visible = state === 'installed';
            break;
        }
      });
    }
  });
};

exports.createShortcut = function(callback) {
  spawnUpdate([
    '--createShortcut',
    path.basename(process.execPath),
    '--shortcut-locations',
    'StartMenu',
  ], callback);
};

exports.removeShortcut = function(callback) {
  spawnUpdate([
    '--removeShortcut',
    path.basename(process.execPath),
  ], callback);
};
/**
 * 
 * @param {Array} args 
 * @param {function} callback 
 */
function spawnUpdate(args, callback) {
  let updateExe =
    path.resolve(path.dirname(process.execPath), '..', 'Update.exe');
  let stdout = '';
  let spawned = null;

  try {
    spawned = ChildProcess.spawn(updateExe, args);
  } catch (error) {
    if (error && error.stdout == null) error.stdout = stdout;
    process.nextTick(function() {
      callback(error);
    });
    return;
  }

  let error = null;

  spawned.stdout.on('data', function(data) {
    stdout += data;
  });

  spawned.on('error', function(processError) {
    if (!error) error = processError;
  });

  spawned.on('close', function(code, signal) {
    if (!error && code !== 0) {
      error = new Error('Command failed: ' + code + ' ' + signal);
    }
    if (error && error.code == null) error.code = code;
    if (error && error.stdout == null) error.stdout = stdout;
    callback(error);
  });
}
