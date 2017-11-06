// @ts-nocheck
const electron = require('electron');
const path = require('path');
const BrowserWindow = electron.BrowserWindow;
const Menu = electron.Menu;
const app = electron.app;
const autoUpdater = require('electron-updater').autoUpdater;

let template = [{
  label: '编辑',
  submenu: [{
    label: '撤销',
    accelerator: 'CmdOrCtrl+Z',
    role: 'undo',
  }, {
    label: '重做',
    accelerator: 'Shift+CmdOrCtrl+Z',
    role: 'redo',
  }, {
    type: 'separator',
  }, {
    label: '剪切',
    accelerator: 'CmdOrCtrl+X',
    role: 'cut',
  }, {
    label: '复制',
    accelerator: 'CmdOrCtrl+C',
    role: 'copy',
  }, {
    label: '粘贴',
    accelerator: 'CmdOrCtrl+V',
    role: 'paste',
  }, {
    label: '全选',
    accelerator: 'CmdOrCtrl+A',
    role: 'selectall',
  }, {
    type: 'separator',
  }, {
    label: '设置',
    accelerator: 'CmdOrCtrl+S',
    click: function(item, focusedWindow) {
      if (focusedWindow) {
        focusedWindow.send('show-settings');
      }
    },
  }],
}, {
  label: '查看',
  submenu: [{
    label: '重载',
    accelerator: 'CmdOrCtrl+R',
    click: function(item, focusedWindow) {
      if (focusedWindow) {
        // 重载之后, 刷新并关闭所有的次要窗体
        if (focusedWindow.id === 1) {
          BrowserWindow.getAllWindows().forEach(function(win) {
            if (win.id > 1) {
              win.close();
            }
          });
        }
        focusedWindow.reload();
      }
    },
  }, {
    label: '切换全屏',
    accelerator: (function() {
      if (process.platform === 'darwin') {
        return 'Ctrl+Command+F';
      } else {
        return 'F11';
      }
    })(),
    click: function(item, focusedWindow) {
      if (focusedWindow) {
        focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
      }
    },
  }, {
    label: '切换开发者工具',
    accelerator: (function() {
      if (process.platform === 'darwin') {
        return 'Alt+Command+I';
      } else {
        return 'Ctrl+Shift+I';
      }
    })(),
    click: function(item, focusedWindow) {
      if (focusedWindow) {
        focusedWindow.toggleDevTools();
      }
    },
  }, {
    type: 'separator',
  }, {
    label: '应用程序菜单演示',
    click: function(item, focusedWindow) {
      if (focusedWindow) {
        const options = {
          type: 'info',
          title: '应用程序菜单演示',
          buttons: ['好的'],
          message: '此演示用于 "菜单" 部分, 展示如何在应用程序菜单中创建可点击的菜单项.',
        };
        electron.dialog.showMessageBox(focusedWindow, options, function() {});
      }
    },
  }],
}, {
  label: '窗口',
  role: 'window',
  submenu: [{
    label: '最小化',
    accelerator: 'CmdOrCtrl+M',
    role: 'minimize',
  }, {
    label: '关闭',
    accelerator: 'CmdOrCtrl+W',
    role: 'close',
  }, {
    type: 'separator',
  }, {
    label: '重新打开窗口',
    accelerator: 'CmdOrCtrl+Shift+T',
    enabled: false,
    key: 'reopenMenuItem',
    click: function() {
      app.emit('activate');
    },
  }],
}, {
  label: '调试',
  submenu: [{
    label: '开启调试',
    accelerator: 'CmdOrCtrl+F5',
    click: function(item, win) {
      win.send('start-debugger');
    }
  }, {
    label: '结束调试',
    accelerator: 'Shift+F5',
    click: function(item, win) {
      win.send('stop-debugger');
    }
  }, {
    type: 'separator',
  }, {
    label: '暂停',
    accelerator: 'F6',
    click: function(item, win) {
      win.send('pause-debugger');
    }
  },
  {
    label: '继续',
    accelerator: 'F5',
    click: function(item, win) {
      win.send('continue-debugger');
    }
  },
  {
    label: '逐句调试',
    accelerator: 'F10',
    click: function(item, win) {
      win.send('step-over-debugger');
    }
  },
  {
    label: '重启',
    accelerator: 'CmdOrCtrl+Shift+F5',
    click: function(item, win) {
      win.send('restart-debugger');
    }
  }],
},
{
  label: '帮助',
  role: 'help',
  submenu: [{
    label: '学习更多',
    click: function() {
      //electron.shell.openExternal('http://rsvp.ai/chatbot/help');
      const modalPath = path.join('file://', __dirname, '../../pages/learnmore.html');
      let win = new BrowserWindow({ width: 400, height: 320 });
      win.on('close', function() { win = null; });
      win.loadURL(modalPath);
      win.show();
    },
  }],
}];
/**
 *
 * @param {*} items
 * @param {*} position
 */
function addUpdateMenuItems(items, position) {
  if (process.mas) return;

  const version = electron.app.getVersion();
  let updateItems = [{
    label: `版本 ${version}`,
    enabled: false,
  }, {
    label: '正在检查更新...',
    enabled: false,
    visible: false,
    key: 'checkingForUpdate',
  }, {
    label: '正在下载更新...',
    enabled: false,
    visible: false,
    key: 'downloadingUpdate',
  }, {
    label: '检查更新',
    /*     visible: false, */
    key: 'checkForUpdate',
    click: function() {
      autoUpdater.checkForUpdates();
    },
  }, {
    label: '重启并安装更新',
    enabled: true,
    visible: false,
    key: 'restartToUpdate',
    click: function() {
      autoUpdater.quitAndInstall();
    },
  }];

  items.splice(...[position, 0].concat(updateItems));
}

/**
 * @return {*}  reopenMenuItem
 */
function findReopenMenuItem() {
  const menu = Menu.getApplicationMenu();
  if (!menu) return;

  let reopenMenuItem;
  menu.items.forEach(function(item) {
    if (item.submenu) {
      item.submenu.items.forEach(function(item) {
        if (item.key === 'reopenMenuItem') {
          reopenMenuItem = item;
        }
      });
    }
  });
  return reopenMenuItem;
}

if (process.platform === 'darwin') {
  const name = electron.app.getName();
  template.unshift({
    label: name,
    submenu: [{
      label: `关于 ${name}`,
      role: 'about',
    }, {
      type: 'separator',
    }, {
      label: '服务',
      role: 'services',
      submenu: [],
    }, {
      type: 'separator',
    }, {
      label: `隐藏 ${name}`,
      accelerator: 'Command+H',
      role: 'hide',
    }, {
      label: '隐藏其它',
      accelerator: 'Command+Alt+H',
      role: 'hideothers',
    }, {
      label: '显示全部',
      role: 'unhide',
    }, {
      type: 'separator',
    }, {
      label: '退出',
      accelerator: 'Command+Q',
      click: function() {
        app.quit();
      },
    }],
  });

  // 窗口菜单.
  template[3].submenu.push({
    type: 'separator',
  }, {
    label: '前置所有',
    role: 'front',
  });

  addUpdateMenuItems(template[0].submenu, 1);
}

if (process.platform === 'win32') {
  const helpMenu = template[template.length - 1].submenu;
  addUpdateMenuItems(helpMenu, 0);
}

app.on('ready', function() {
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
});

app.on('browser-window-created', function() {
  let reopenMenuItem = findReopenMenuItem();
  if (reopenMenuItem) reopenMenuItem.enabled = false;
});

app.on('window-all-closed', function() {
  let reopenMenuItem = findReopenMenuItem();
  if (reopenMenuItem) reopenMenuItem.enabled = true;
});
