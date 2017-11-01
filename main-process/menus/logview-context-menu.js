const electron = require('electron');
const BrowserWindow = electron.BrowserWindow;
const Menu = electron.Menu;
const ipc = electron.ipcMain;

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


let onclick = function(item, win) {
  //console.log(item.key);
  if (win) win.send(item.key);
};

let template = [
  { label: '清空记录', key: 'logcm-clear-log', click: onclick },
  { label: '自动换行', key: 'logcm-switch-wordwrap', type: 'checkbox', checked: false, click: onclick },
];

const menu = Menu.buildFromTemplate(template);


ipc.on('show-logview-context-menu', function(event) {
  const win = BrowserWindow.fromWebContents(event.sender);
  menu.popup(win);
});
