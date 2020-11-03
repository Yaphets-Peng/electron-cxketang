window.AgoraRtcEngine = null;
window.InjectRtcScreenUtil = null;
if (require('electron').remote) {
    if (!window.location.href.startsWith("https://k.chaoxing.com/pc/meet/meeting")) {
        window.nodeRequire = require;
        delete window.require;
        delete window.exports;
        delete window.module;
    } else {
        const path = require("path");
        let logger = require("../common/Logger");
        console.log(logger.getLogPath());
        window.AgoraRtcEngine = require("agora-electron-sdk").default;
        window.InjectRtcScreenUtil = require('../static/js/agaro/InjectRtcScreenUtil');
        // 获取日志路径后存放
        window.InjectRtcScreenUtil.sdkLogPath = path.join(path.resolve(logger.getLogPath(), ".."), "./agora/agoramainsdk.log");

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