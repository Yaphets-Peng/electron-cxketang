const logger = require("../common/Logger");
const config = require("../common/Config");
const urlHelper = require("../common/UrlHelper");
const httpService = require("../service/HttpService");
const os = require("os");
const path = require("path");
const sdkLogPath = path.resolve(os.homedir(), "./agoramainsdk.log");
const sessionCookie = require("../common/SessionCookie");
const baseController = require("../controller/BaseController");
const AgoraRtcEngine = require('agora-electron-sdk').default

logger.info("meetingController-初始化");

//获取url中的参数
let meetUUID = urlHelper.getQueryString("uuid");
let meetAudioStatus = urlHelper.getQueryString("audioStatus");
let meetVideoStatus = urlHelper.getQueryString("videoStatus");
let meetQrcord = null;
let meetTokens = urlHelper.getQueryString("tokens");
let userId = sessionCookie.getCookieUserId();
let isMyMeet = false;

// 全局是否存在,释放
if (global.rtcEngine) {
    global.rtcEngine.release();
}

function refreshTokens() {
    httpService.post(config.getConfigVal("meet_info_url"), {"uuid": meetUUID}, function (response) {
        console.log(response);
        if (response.result === 1) {
            meetTokens = response.data;
        }
    }, function (error) {
        console.log(error);
    });
}

httpService.post(config.getConfigVal("meet_info_url"), {"uuid": meetUUID}, function (response) {
    console.log(response);
    if (response.result === 1) {
        let datas = response.data;

        // 判断是否自己直播间
        if (datas.puid == userId) {
            isMyMeet = true;
        }
        // 开始加入频道
        /*let rtcEngine = new AgoraRtcEngine()
        rtcEngine.initialize(config.getConfigVal("AGORA_APPID"));


        // listen to events
        rtcEngine.on('joinedChannel', (channel, uid, elapsed) => {
            consoleContainer.innerHTML = `joined channel ${channel} with uid ${uid}, elapsed ${elapsed}ms`
            //setup render area for local user
            rtcEngine.setupLocalVideo(localVideoContainer)
        })
        rtcEngine.on('error', (err, msg) => {
            consoleContainer.innerHTML = `error: code ${err} - ${msg}`
        })
        rtcEngine.on('userJoined', (uid) => {
            //setup render area for joined user
            rtcEngine.setupViewContentMode(uid, 1);
            rtcEngine.subscribe(uid, remoteVideoContainer)
        })

        // set channel profile, 0: video call, 1: live broadcasting
        rtcEngine.setChannelProfile(1)
        rtcEngine.setClientRole(1)

        // enable video, call disableVideo() is you don't need video at all
        rtcEngine.enableVideo()

        // set where log file should be put for problem diagnostic
        rtcEngine.setLogFile(sdkLogPath)

        // join channel to rock!
        rtcEngine.joinChannel(null, "demoChannel", null, Math.floor(new Date().getTime() / 1000))

        global.rtcEngine = rtcEngine*/
    } else {
        console.log(response.msg);
    }
}, function (error) {
    console.log(error);
});

