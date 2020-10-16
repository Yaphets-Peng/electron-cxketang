const logger = require("../common/Logger");
const config = require("../common/Config");
const urlHelper = require("../common/UrlHelper");
const httpService = require("../service/HttpService");
const os = require("os");
const path = require("path");
const sdkLogPath = path.resolve(os.homedir(), "./agoramainsdk.log");
const baseController = require("../controller/BaseController");
const AgoraRtcEngine = require('agora-electron-sdk').default;

logger.info("meetingController-初始化");

// 用户id区间标识
const userIdLimit = 1000000000;

//获取url中的参数
let meetUUID = urlHelper.getQueryString("uuid");
let meetAudioStatus = urlHelper.getQueryString("audioStatus");
let meetVideoStatus = urlHelper.getQueryString("videoStatus");
let meetQrcord = null;
let meetTokens = JSON.parse(decodeURIComponent(urlHelper.getQueryString("tokens")));
let userInfo = baseController.getUserInfo();
let userId = userInfo.UID;
let isMyMeet = false;


// 获取真实用户id用于通用处理puid
function getRealPuid(id) {
    try {
        if (id) {
            var tempId = parseInt(id);
            if (tempId > userIdLimit) {
                tempId = tempId - userIdLimit;
                return tempId + "";
            }
        }
    } catch (e) {
    }
    return id + "";
}

// 判断是否是音视频流id
function isVideoId(id) {
    try {
        if (id) {
            var tempId = parseInt(id);
            //大于userIdLimit则不是
            if (tempId <= userIdLimit) {
                return true;
            }
        }
    } catch (e) {
    }
    return false;
}

// 判断是否是投屏流id
function isScreenId(id) {
    try {
        if (id) {
            var tempId = parseInt(id);
            //小于userIdLimit则不是
            if (tempId > userIdLimit) {
                return true;
            }
        }
    } catch (e) {
    }
    return false;
}

// 获取投屏用户id用于投屏处理id
function getScreenPuid(puid) {
    try {
        if (puid) {
            var tempPuid = parseInt(puid);
            tempPuid = tempPuid + userIdLimit;
            return tempPuid + "";
        }
    } catch (e) {
    }
    return puid + "";
}

// 全局是否存在,释放
if (global.rtcEngine) {
    global.rtcEngine.release();
}

function refreshTokens(callback, errorBack) {
    httpService.post(config.getConfigVal("meet_tokens_url"), {"channelName": meetQrcord}, function (response) {
        console.log(response);
        if (response.result === 1) {
            meetTokens = response.data;
            if (callback) {
                callback(response);
            }
        }
    }, function (error) {
        console.log(error);
        if (errorBack) {
            errorBack(error);
        }
    });
}

httpService.post(config.getConfigVal("meet_info_url"), {"uuid": meetUUID}, function (response) {
    console.log(response);
    if (response.result === 1) {
        let datas = response.data;
        // 会议码
        meetQrcord = datas.qrcode;
        // 判断是否自己直播间
        if (datas.puid == userId) {
            isMyMeet = true;
        }
        // 开始加入频道
        let rtcEngine = new AgoraRtcEngine()
        rtcEngine.initialize(config.getConfigVal("AGORA_APPID"));

        // 加入频道回调
        rtcEngine.on('joinedChannel', (channel, uid, elapsed) => {
            console.log(`joined channel ${channel} with uid ${uid}, elapsed ${elapsed}ms`);
            //设置本地视频渲染位置
            //rtcEngine.setupLocalVideo(localVideoContainer);
        });
        // 重新加入频道回调
        rtcEngine.on('rejoinedChannel', (channel, uid, elapsed) => {
            console.log(`rejoined channel ${channel} with uid ${uid}, elapsed ${elapsed}ms`);
            //设置本地视频渲染位置
            //rtcEngine.setupLocalVideo(localVideoContainer);
        });
        // 他人加入频道回调
        rtcEngine.on('userJoined', (uid, elapsed) => {
            // 设置视窗内容显示模式
            rtcEngine.setupViewContentMode(uid, 1);
            // 订阅该远端用户流
            //rtcEngine.subscribe(uid, remoteVideoContainer)
        });
        // 异常回调
        rtcEngine.on('error', (err, msg) => {
            consoleContainer.innerHTML = `error: code ${err} - ${msg}`
        });

        // 设置频道场景, 0: 通信, 1: 直播
        rtcEngine.setChannelProfile(1);

        if (isMyMeet) {
            //设置直播场景下的用户角色, 1：主播, 2：（默认）观众
            rtcEngine.setClientRole(1);
        }

        // 开启音频功能
        let audioCode = rtcEngine.enableAudio();
        console.log(audioCode);
        // 关闭音频功能
        //rtcEngine.disableAudio();
        // 开启视频功能
        //rtcEngine.enableVideo();
        // 关闭视频功能
        //rtcEngine.disableVideo();
        // 停止视频预览
        //rtcEngine.stopPreview();

        // 设置日志文件
        rtcEngine.setLogFile(sdkLogPath)

        // 加入频道
        let joinChannelCode = rtcEngine.joinChannel(meetTokens.rtc_video_token, meetQrcord, null, parseInt(userId));
        console.log(joinChannelCode);
        global.rtcEngine = rtcEngine;
    } else {
        console.log(response.msg);
    }
}, function (error) {
    console.log(error);
});




