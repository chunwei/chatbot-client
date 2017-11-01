const electron = require('electron');
const {
  app,
  BrowserWindow,
  ipcMain,
} = electron;
const path = require('path');
const glob = require('glob');
const url = require('url');
const autoUpdater = require('./auto-updater');

const debug = /--debug/.test(process.argv[2]);

if (process.mas) app.setName('ChatBot');

ipcMain.on('toggleDevTools', function() {
  win.webContents.toggleDevTools();
});

//open-file.js

// init win
let win;
/**
 * initialize app
 */
function initialize() {
  loadMainModule();

  /**
   * creante main windows
   */
  function createWindow() {
    const screenSize = electron.screen.getPrimaryDisplay().workAreaSize;
    // console.log(electron.screen.getPrimaryDisplay());
    // Create browser window
    win = new BrowserWindow({
      show: false,
      width: 1024,
      height: 800, //screenSize.height,
      icon: path.join(__dirname, 'img/icon.png'),
    });
    win.on('ready-to-show', function() {
      win.show();
      win.focus();
    });
    // Load index.html
    win.loadURL(
      url.format({
        pathname: path.join(__dirname, 'main.html'),
        protocol: 'file',
        slashes: true,
      })
    );

    // Launch fullscreen with DevTools open, usage: npm run debug
    if (debug) {
      win.webContents.openDevTools();
      win.maximize();
      require('devtron').install();
    }

    win.on('closed', () => {
      win = null;
    });
  }

  //app.setPath('userData', path.join(__dirname, 'appData'));

  app.on('ready', function() {
    createWindow();
    autoUpdater.initialize();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}

/**
 * Require each JS file in the main-process dir
 */
function loadMainModule() {
  let files = glob.sync(path.join(__dirname, 'main-process/**/*.js'));
  files.forEach(function(file) {
    require(file);
  });
  autoUpdater.updateMenu();
}

// Handle Squirrel on Windows startup events
switch (process.argv[1]) {
  case '--squirrel-install':
    autoUpdater.createShortcut(function() {
      app.quit();
    });
    break;
  case '--squirrel-uninstall':
    autoUpdater.removeShortcut(function() {
      app.quit();
    });
    break;
  case '--squirrel-obsolete':
  case '--squirrel-updated':
    app.quit();
    break;
  default:
    initialize();
}
