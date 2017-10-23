const winstaller = require('electron-winstaller');

let resultPromise = winstaller.createWindowsInstaller({
  appDirectory: '../dist/chatbot-win32-x64',
  outputDirectory: '../dist/installer/win32-x64',
  authors: 'luchunwei',
  //exe:'chatbot.exe'
});

resultPromise.then(() => { console.log('Create Windows Installer Done.'); }, (err) => console.log(`No dice: ${err.message}`));
