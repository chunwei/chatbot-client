const ipc = require('electron').ipcMain
const dialog = require('electron').dialog

ipc.on('open-file-dialog', function(event, launchAndDebug) {
  dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [{
      name: '测试脚本',
      extensions: ['txt'],
    },
    {
      name: 'All Files',
      extensions: ['*'],
    }, ],
  }, function(files) {
    if (files) event.sender.send('selected-files', files, launchAndDebug);
  })
})
