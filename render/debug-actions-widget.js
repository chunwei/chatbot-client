//const Task = require('../js/task.chattester');
const TaskManager = require('../js/taskmanager');
//let task = new Task();

let debugActionsWidget = document.querySelector('.debug-actions-widget');
let pauseBtn = debugActionsWidget.querySelector('.debug-action.pause');
let stopBtn = debugActionsWidget.querySelector('.debug-action.stop');
let continueBtn = debugActionsWidget.querySelector('.debug-action.continue');
let stepoverBtn = debugActionsWidget.querySelector('.debug-action.step-over');
let repeatBtn = debugActionsWidget.querySelector('.debug-action.repeat');
let norepeatBtn = debugActionsWidget.querySelector('.debug-action.norepeat');
let isDraging = false;
let prePoint = { top: 0, left: 0 };

let tmgr = new TaskManager( /* task */ );
tmgr.on('finish', function(event) {
  disableBtn(pauseBtn);
  disableBtn(stopBtn);
  disableBtn(continueBtn);
  disableBtn(stepoverBtn);
});
tmgr.on('changetask', function(event) {
  enableBtn(pauseBtn);
  enableBtn(stopBtn);
});
tmgr.on('restart', function(event) {
  enableBtn(pauseBtn);
  enableBtn(continueBtn);
  enableBtn(stopBtn);
});
tmgr.on('breakpoint', function(event) {
  enableBtn(stepoverBtn);
  enableBtn(continueBtn);
  switchBtns(pauseBtn, continueBtn);
});

debugActionsWidget.addEventListener('mousedown', function(event) {
  event.preventDefault();
  let btn = event.target.classList;
  if (btn.contains('disabled')) return false;

  if (btn.contains('drag-area')) {
    //drag and move
    isDraging = true;
    prePoint.y = event.clientY;
    prePoint.x = event.clientX;
  } else if (btn.contains('debug-action') && event.button == 0) {
    event.target.parentElement.classList.add('active');
  }
});
document.addEventListener('mousemove', function(event) {
  event.preventDefault();
  let btn = event.target.classList;
  if (btn.contains('disabled')) return false;

  if ( /* btn.contains('drag-area') && */ isDraging) {
    let dx = event.clientX - prePoint.x;
    let dy = event.clientY - prePoint.y;
    debugActionsWidget.style.left = (parseInt(debugActionsWidget.style.left) + dx) + 'px';
    debugActionsWidget.style.top = (parseInt(debugActionsWidget.style.top) + dy) + 'px';
    prePoint.y = event.clientY;
    prePoint.x = event.clientX;
  }
});
debugActionsWidget.addEventListener('mouseout', function(event) {
  event.preventDefault();
  let btn = event.target.classList;
  if (btn.contains('disabled')) return false;
  if (btn.contains('drag-area')) {
    //isDraging = false;
  } else if (btn.contains('debug-action')) {
    event.target.parentElement.classList.remove('active');
  }
});

function disableBtn(btn) {
  btn.parentElement.classList.add('disabled');
  btn.classList.add('disabled');
}

function enableBtn(btn) {
  btn.parentElement.classList.remove('disabled');
  btn.classList.remove('disabled');
}

function hideBtn(btn) {
  btn.parentElement.classList.add('hidden');
}

function showBtn(btn) {
  btn.parentElement.classList.remove('hidden');
}

function switchBtns(btn2Hide, btn2Show) {
  hideBtn(btn2Hide);
  showBtn(btn2Show);
}
debugActionsWidget.addEventListener('mouseup', function(event) {
  event.preventDefault();
  let btn = event.target.classList;
  if (btn.contains('disabled')) return false;
  if (btn.contains('drag-area')) {
    isDraging = false;
  } else if (btn.contains('debug-action') && event.button == 0) {
    event.target.parentElement.classList.remove('active');
    //actions    

    let action = event.target.className.match(/continue|pause|restart|stop|step-over|step-into|step-out|repeat|norepeat/g);
    console.log('debug-action %s', action);
    action = action ? action[0] : '';
    switch (action) {
      case 'continue':
        tmgr.continue();
        switchBtns(continueBtn, pauseBtn);
        disableBtn(stepoverBtn);
        break;
      case 'pause':
        tmgr.pause();
        switchBtns(pauseBtn, continueBtn);
        enableBtn(stepoverBtn);
        break;
      case 'restart':
        tmgr.restart();
        switchBtns(continueBtn, pauseBtn);
        enableBtn(continueBtn);
        enableBtn(pauseBtn);
        enableBtn(stopBtn);
        break;
      case 'stop':
        tmgr.stop();
        disableBtn(stepoverBtn);
        disableBtn(continueBtn);
        disableBtn(pauseBtn);
        disableBtn(stopBtn);
        break;
      case 'step-over':
        tmgr.stepover();
        break;
      case 'repeat':
        tmgr.setAutoRepeat(true);
        switchBtns(repeatBtn, norepeatBtn);
        break;
      case 'norepeat':
        tmgr.setAutoRepeat(false);
        switchBtns(norepeatBtn, repeatBtn);
        break;
    }
  }
});


module.exports = { debugActionsWidget, tmgr };
