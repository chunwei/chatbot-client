const AipSpeechClient = require("baidu-aip-sdk").speech;
class BaiduTTS {
  constructor() {

    // 设置APPID/AK/SK
    const APP_ID = "10200989";
    const API_KEY = "12PfbGXfE82zTqIdNDKnatbx";
    const SECRET_KEY = "OjYGhXqQObCU5CwCo7yiN47xjoUAO8Si";
    //200000次/天免费, 不保证并发
    this.client = new AipSpeechClient(APP_ID, API_KEY, SECRET_KEY);
    this.audioCtx = new(window.AudioContext || window.webkitAudioContext)();
  }
  play(audioData, option) {
    let audioCtx = this.audioCtx;
    // Get an AudioBufferSourceNode.
    // This is the AudioNode to use when we want to play an AudioBuffer
    let source = audioCtx.createBufferSource();
    source.onended = function (event) {
      if (option && 'function' === typeof option.onended) {
        option.onended();
      }
    };
    // decodeAudioData to decode audioData and stick it in a buffer.
    // Then we put the buffer into the source
    audioCtx.decodeAudioData(audioData).then(function (decodedData) {
      // use the decoded data here
      // set the buffer in the AudioBufferSourceNode
      source.buffer = decodedData;
      // connect the AudioBufferSourceNode to the
      // destination so we can hear the sound
      source.connect(audioCtx.destination);
      // start the source playing
      source.start();
    })
  }
  tts(text, option) {
    let play = this.play.bind(this);
    // 语音合成, 附带合成参数
    this.client.text2audio(text, option).then(function (result) {
      //console.log(result);
      let b = result.data;
      //to ArrayBuffer
      let ab = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
      play(ab, option);
      //console.log('<text2audio>: ' + JSON.stringify(result));
      // 把data数据写入到文件
      //fs.writeFileSync('tts.mpVoice.mp3', result.data);
    })
  }

}

module.exports = new BaiduTTS();
