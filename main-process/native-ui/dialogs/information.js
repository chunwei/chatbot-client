const ipc = require('electron').ipcMain
const dialog = require('electron').dialog

ipc.on('open-information-dialog', function(event) {
  const options = {
    type: 'info',
    title: '信息',
    message: "这个功能还没实现\n下次再来？",
    buttons: ['好吧', '只能👌']
  }
  dialog.showMessageBox(options, function(index) {
    event.sender.send('information-dialog-selection', index)
  })
})
