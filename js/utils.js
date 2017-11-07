/**
 * 
 * @param {*} len 
 * @param {*} radix 
 * 
 *    // 8 character ID (base=2)
 *    uuid(8, 2)  //  "01001010"
 *    // 8 character ID (base=10)
 *    uuid(8, 10) // "47473046"
 *    // 8 character ID (base=16)
 *    uuid(8, 16) // "098F4D35"
 */
function uuid(len, radix) {
  var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
  var uuid = [],
    i;
  radix = radix || chars.length;

  if (len) {
    // Compact form
    for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix];
  } else {
    // rfc4122, version 4 form
    var r;

    // rfc4122 requires these characters
    uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
    uuid[14] = '4';

    // Fill in random data.  At i==19 set the high bits of clock sequence as
    // per rfc4122, sec. 4.1.5
    for (i = 0; i < 36; i++) {
      if (!uuid[i]) {
        r = 0 | Math.random() * 16;
        uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
      }
    }
  }

  return uuid.join('');
}

module.exports.uuid = uuid;

module.exports.bytesToSize = function bytesToSize(bytes) {
  if (bytes === 0) return '0 B';
  let k = 1024;
  let sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  let i = Math.floor(Math.log(bytes) / Math.log(k));

  return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
};

module.exports.secondsFriendly = function secondsFriendly(seconds) {
  let time = seconds + '秒';
  if (seconds > 59) {
    let second = parseInt(seconds % 60);
    let min = parseInt(seconds / 60);
    time = min + '分' + (second == 0 ? '' : second + '秒');

    if (min > 59) {
      min = parseInt(seconds / 60) % 60;
      let hour = parseInt(seconds / 60 / 60);
      time = hour + '小时';
      if (min > 0) { time += (min + '分'); }
      //else if (min == 0) { time += (second == 0 ? '' : '零'); }
      //if (second > 0) { time += (second + '秒'); }
      if (hour > 23) {
        hour = parseInt(seconds / 60 / 60) % 24;
        let day = parseInt(parseInt(seconds / 60 / 60) / 24);
        time = day + '天' + hour + '小时'; // + min + '分' + second + '秒';
      }
    }
  }
  return time;
};
