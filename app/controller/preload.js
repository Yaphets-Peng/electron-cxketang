window.AgoraRtcEngine = null;
window.InjectRtcAudioVideoScreenUtil = null;
window.minBtnForWindowFunction = null;
window.maxBtnForWindowFunction = null;
window.unMaxBtnForWindowFunction = null;
window.closeBtnForWindowFunction = null;
if (require('electron').remote) {
    if (!window.location.href.startsWith("https://k.chaoxing.com/pc/meet/meeting") && !window.location.href.startsWith("file://")) {
        window.nodeRequire = require;
        delete window.require;
        delete window.exports;
        delete window.module;
    } else {
        // 工具栏
        const remote = require("electron").remote;
        // 最小化
        window.minBtnForWindowFunction = function () {
            remote.getCurrentWindow().minimize();
        }
        // 最大化
        window.maxBtnForWindowFunction = function () {
            remote.getCurrentWindow().maximize();
        }
        // 取消最大化
        window.unMaxBtnForWindowFunction = function () {
            remote.getCurrentWindow().unmaximize();
        }
        // 关闭
        window.closeBtnForWindowFunction = function () {
            remote.getCurrentWindow().close();
        }
        // 退出全屏
        document.addEventListener("keydown", event => {
            switch (event.key) {
                case "Escape":
                    if (remote.getCurrentWindow().isFullScreen()) {
                        remote.getCurrentWindow().setFullScreen(false);
                    }
                    break;
            }
        });
        // 会议相关
        const path = require("path");
        let logger = require("../common/Logger");
        let rendererProcessHelper = require("../process/RendererProcessHelper");
        console.log(logger.getLogPath());
        window.AgoraRtcEngine = require("agora-electron-sdk").default;
        window.InjectRtcAudioVideoScreenUtil = require('../static/js/agaro/InjectRtcAudioVideoScreenUtil');
        // 获取日志路径后存放
        window.InjectRtcAudioVideoScreenUtil.sdkLogPath = path.join(path.resolve(logger.getLogPath(), ".."), "./agora/agoraAudioVideoScreenSdk.log");
        // ipc通信
        window.InjectRtcAudioVideoScreenUtil.RendererProcessHelper = rendererProcessHelper;
    }
}