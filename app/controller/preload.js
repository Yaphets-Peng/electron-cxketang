window.AgoraRtcEngine = null;
window.InjectRtcAudioVideoScreenUtil = null;
window.minBtnForWindowFunction = null;
window.maxBtnForWindowFunction = null;
window.unMaxBtnForWindowFunction = null;
window.fullScreenBtnForWindowFunction = null;
window.unFullScreenBtnForWindowFunction = null;
window.closeBtnForWindowFunction = null;
if (require('electron').remote) {
    const configFile = require("../common/Config");
    const meet_url_temp = configFile.getUrlPathConfigVal("open_meet_url");
    if (!window.location.href.startsWith(meet_url_temp) && !window.location.href.startsWith("file:")) {
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
        // 全屏
        window.fullScreenBtnForWindowFunction = function () {
            remote.getCurrentWindow().setFullScreen(true);
        }
        // 取消全屏
        window.unFullScreenBtnForWindowFunction = function () {
            remote.getCurrentWindow().setFullScreen(false);
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
        // 画布工具
        window.InjectRtcAudioVideoScreenUtil.canvasFrame = require("canvas-to-buffer");
        // 获取日志路径后存放
        window.InjectRtcAudioVideoScreenUtil.sdkLogPath = path.join(path.resolve(logger.getLogPath(), ".."), "./agora/agoraAudioVideoScreenSdk.log");
        // ipc通信
        window.InjectRtcAudioVideoScreenUtil.RendererProcessHelper = rendererProcessHelper;
        // 调试
        window.InjectRtcAudioVideoScreenUtil.debug = configFile.getUrlPathConfigVal("debug");
        window.InjectRtcAudioVideoScreenUtil.meet_debug = configFile.getUrlPathConfigVal("meet_debug");
    }
}