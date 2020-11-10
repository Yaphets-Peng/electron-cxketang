window.AgoraRtcEngine = null;
window.InjectRtcAudioVideoScreenUtil = null;
if (require('electron').remote) {
    if (!window.location.href.startsWith("https://k.chaoxing.com/pc/meet/meeting") && !window.location.href.startsWith("file://")) {
        window.nodeRequire = require;
        delete window.require;
        delete window.exports;
        delete window.module;
    } else {
        const path = require("path");
        let logger = require("../common/Logger");
        console.log(logger.getLogPath());
        window.AgoraRtcEngine = require("agora-electron-sdk").default;
        window.InjectRtcAudioVideoScreenUtil = require('../static/js/agaro/InjectRtcAudioVideoScreenUtil');
        // 获取日志路径后存放
        window.InjectRtcAudioVideoScreenUtil.sdkLogPath = path.join(path.resolve(logger.getLogPath(), ".."), "./agora/agoraAudioVideoScreenSdk.log");

        // 会议退出全屏
        const remote = require("electron").remote;
        document.addEventListener("keydown", event => {
            switch (event.key) {
                case "Escape":
                    if (remote.getCurrentWindow().isFullScreen()) {
                        remote.getCurrentWindow().setFullScreen(false);
                    }
                    break;
            }
        });
    }
}