const logger = require("../common/Logger");
const config = require("../common/Config");
const urlHelper = require("../common/UrlHelper");
const httpService = require("../service/HttpService");
const os = require("os");
const path = require("path");
const sdkLogPath = path.resolve(os.homedir(), "./agoramainsdk.log");
const baseController = require("../controller/BaseController");
const AgoraRtcEngine = require("agora-electron-sdk").default;
const AgoraRTM = require("agora-rtm-sdk");

const AgaroUserUtil = require('../static/js/agaro/AgaroUserUtil');
const MeetInfoUtil = require('../static/js/agaro/MeetInfoUtil');
const RtmUtil = require('../static/js/agaro/RtmUtil');
const RtcScreenUtil = require('../static/js/agaro/RtcScreenUtil');
const RtcAudioVideoUtil = require('../static/js/agaro/RtcAudioVideoUtil');
const RtcAudioVideoScreenUtil = require('../static/js/agaro/RtcAudioVideoScreenUtil');


logger.info("meetingController-初始化");

//获取url中的参数
MeetInfoUtil.meetUUID = urlHelper.getQueryString("uuid");
MeetInfoUtil.meetAudioStatus = urlHelper.getQueryString("audioStatus");
MeetInfoUtil.meetVideoStatus = urlHelper.getQueryString("videoStatus");
MeetInfoUtil.meetTokens = JSON.parse(decodeURIComponent(urlHelper.getQueryString("tokens")));
AgaroUserUtil.userId = baseController.getUserInfo().UID;

function refreshTokens(callback, errorBack) {
    httpService.post(config.getConfigVal("meet_tokens_url"), {"channelName": MeetInfoUtil.meetQrcord}, function (response) {
        console.log(response);
        if (response.result === 1) {
            MeetInfoUtil.meetTokens = response.data;
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

function init() {
    RtmUtil.joinRTM();
    // RtcAudioVideoUtil.joinAudioVideo(sdkLogPath);
    // RtcScreenUtil.joinScreen(sdkLogPath);
    RtcAudioVideoScreenUtil.joinAudioVideoScreen(sdkLogPath);
}

httpService.post(config.getConfigVal("meet_info_url"), {"uuid": MeetInfoUtil.meetUUID}, function (response) {
    console.log(response);
    if (response.result === 1) {
        let datas = response.data;
        // 会议码
        MeetInfoUtil.meetQrcord = datas.qrcode;
        // 判断是否自己直播间
        if (datas.puid == AgaroUserUtil.userId) {
            MeetInfoUtil.isMyMeet = true;
        }
        init();
    } else {
        console.log(response.msg);
    }
}, function (error) {
    console.log(error);
});






