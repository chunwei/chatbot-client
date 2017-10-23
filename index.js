const electron = require('electron')
const {
  app, BrowserWindow, ipcMain, dialog,
} = electron
const path = require('path')
const url = require('url')

ipcMain.on('toggleDevTools', function() {
  win.webContents.toggleDevTools()
})
ipcMain.on('open-file-dialog', function(event) {
  dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [{
      name: '测试脚本',
      extensions: ['txt'],
    },
    {
      name: 'All Files',
      extensions: ['*'],
    },
    ],
  }, function(files) {
    if (files) event.sender.send('selected-files', files)
  })
})

// init win
let win

/**
 * 
 */
function createWindow() {
  const screenSize = electron.screen.getPrimaryDisplay().workAreaSize
  // console.log(electron.screen.getPrimaryDisplay());
  // Create browser window
  win = new BrowserWindow({
    width: 580,
    height: screenSize.height,
    icon: path.join(__dirname, 'img/icon.png'),
  })
  // Load index.html
  win.loadURL(
    url.format({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file',
      slashes: true,
    })
  )

  // Open devtools
  // win.webContents.openDevTools();

  win.on('closed', () => {
    win = null
  })
}

app.setPath('userData', path.join(__dirname, 'appData'))

app.on('ready', function() {
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
