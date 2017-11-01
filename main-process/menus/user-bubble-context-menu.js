const electron = require('electron');
const BrowserWindow = electron.BrowserWindow;
const Menu = electron.Menu;
const MenuItem = electron.MenuItem;
const ipc = electron.ipcMain;
const app = electron.app;

/* const menu = new Menu()
menu.append(new MenuItem({ label: '从这里开始重新来' }))
menu.append(new MenuItem({ type: 'separator' }))
menu.append(new MenuItem({ label: 'Electron', type: 'checkbox', checked: true })) */


/* app.on('browser-window-created', function(event, win) {
  win.webContents.on('context-menu', function(e, params) {
    menu.popup(win, params.x, params.y)
  })
})

ipc.on('show-context-menu', function(event) {
  const win = BrowserWindow.fromWebContents(event.sender)
  menu.popup(win)
}) */

let iid = null;

let onclick = function(item, win) {
  //console.log(item.key);
  if (win) win.send(item.key, iid);
};

let template = [
  { label: '从这句开始调试', key: 'ubcm-start-from-here', click: onclick },
  //{ label: '清空后面的对话', key: 'ubcm-clear-dialog-behind', click: onclick },
  { label: '这句再说一次', key: 'ubcm-say-it-again', click: onclick },
];

const menu = Menu.buildFromTemplate(template);


ipc.on('show-user-bubble-context-menu', function(event, id) {
  iid = id;
  const win = BrowserWindow.fromWebContents(event.sender);
  menu.popup(win);
});
