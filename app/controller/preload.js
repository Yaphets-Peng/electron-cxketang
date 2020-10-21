window.AgoraRtcEngine = null;
window.InjectRtcScreenUtil = null;
if (require('electron').remote) {
    console.log("remote world");
    console.log(window.location.href);
    if (!window.location.href.startsWith("https://k.chaoxing.com/pc/meet/meeting")) {
        window.nodeRequire = require;
        delete window.require;
        delete window.exports;
        delete window.module;
    } else {
        window.AgoraRtcEngine = require("agora-electron-sdk").default;
        window.InjectRtcScreenUtil = require('../static/js/agaro/InjectRtcScreenUtil');
    }
}