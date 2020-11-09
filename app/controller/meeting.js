const logger = require("../common/Logger");
const config = require("../common/Config");
const urlHelper = require("../common/UrlHelper");
const baseController = require("../controller/BaseController");
const path = require("path");
const AgoraRtcEngine = require("agora-electron-sdk").default;
const AgoraRTM = require("agora-rtm-sdk");

const AgaroUserUtil = require('../static/js/agaro/AgaroUserUtil');
const MeetInfoUtil = require('../static/js/agaro/MeetInfoUtil');
const RtmUtil = require('../static/js/agaro/RtmUtil');
const RtcAudioVideoScreenUtil = require('../static/js/agaro/RtcAudioVideoScreenUtil');

logger.info("meetingController-初始化");

// 获取日志路径后存放
RtcAudioVideoScreenUtil.sdkLogPath = path.join(path.resolve(logger.getLogPath(), ".."), "./agora/agoramainsdk.log");

//获取url中的参数
MeetInfoUtil.isMyMeet = true;
MeetInfoUtil.meetUUID = urlHelper.getQueryString("uuid");
MeetInfoUtil.meetQrcord = urlHelper.getQueryString("meetQrcode");
//isTestDemo
urlIsTestDemo = urlHelper.getQueryString("isTestDemo") || "";
let urlTokens = urlHelper.getQueryString("tokens");
if (urlTokens) {
    MeetInfoUtil.meetTokens = JSON.parse(decodeURIComponent(urlTokens));
}
// 设置用户id
AgaroUserUtil.userId = baseController.getUserInfo().UID;

// 需要查询会议信息
if (urlIsTestDemo == "1") {
    $.ajax({
        type: "post",
        url: config.getConfigVal("meet_info_url"),
        data: {"uuid": MeetInfoUtil.meetUUID},
        async: false,
        success: function (data) {
            if (data.result === 1) {
                let datas = data.data;
                // 会议码
                MeetInfoUtil.meetQrcord = datas.qrcode;
            }
        }
    });
    $.ajax({
        type: "post",
        url: config.getConfigVal("meet_tokens_url"),
        data: {"channelName": MeetInfoUtil.meetQrcord},
        async: false,
        success: function (data) {
            if (data.result === 1) {
                MeetInfoUtil.meetTokens = data.data;
            }
        }
    });
}

//判断是否初始化
if (MeetInfoUtil.meetQrcord && MeetInfoUtil.meetTokens) {
    // 初始化
    RtmUtil.joinRTM();
    RtcAudioVideoScreenUtil.init();
}

function beforeWindowClose() {
    //销毁RTM和RTC
    RtmUtil.leaveRTM();
    RtcAudioVideoScreenUtil.closeAll();
    return "0";
}

//绑定事件
$("#audioButton").on("click", function (e) {
    let status = $(this).attr("value");
    let screenStatus = $("#screenButton").attr("value");
    let loopbackStatus = $("#loopbackButton").attr("value");
    if (status == "0") {
        RtcAudioVideoScreenUtil.startAudio();
        if (screenStatus == "0") {
            $(this).text("关闭麦克风");
            if (loopbackStatus == "0") {
                $("#loopbackButton").text("打开声卡采集");
            } else if (loopbackStatus == "1") {
                $("#loopbackButton").text("关闭声卡采集");
            }
        } else if (screenStatus == "1") {
            if (loopbackStatus == "0") {
                $("#loopbackButton").text("关闭声卡采集");
            } else if (loopbackStatus == "1") {
                $("#loopbackButton").text("关闭声卡采集");
            }
            $("#loopbackButton").attr("value", "1");
            // 开启声卡采集
            RtcAudioVideoScreenUtil.startLoopbackRecording();
            $(this).text("关闭麦克风关闭声卡采集");
            $("#screenButton").text("关闭屏幕共享关闭声卡采集");
        }
        $(this).attr("value", "1");
    } else if (status == "1") {
        RtcAudioVideoScreenUtil.stopAudio();
        if (screenStatus == "0") {
            $(this).text("打开麦克风");
            if (loopbackStatus == "0") {
                $("#loopbackButton").text("打开声卡采集");
            } else if (loopbackStatus == "1") {
                $("#loopbackButton").text("关闭声卡采集");
            }
        } else if (screenStatus == "1") {
            $(this).text("打开麦克风打开声卡采集");
            $("#screenButton").text("关闭屏幕共享（声卡采集已关闭）");
            if (loopbackStatus == "0") {
                $("#loopbackButton").text("打开声卡采集");
            } else if (loopbackStatus == "1") {
                $("#loopbackButton").text("打开声卡采集");
            }
            $("#loopbackButton").attr("value", "0");
        }
        $(this).attr("value", "0");
    }
})

$("#videoButton").on("click", function (e) {
    let status = $(this).attr("value");
    if (status == "0") {
        RtcAudioVideoScreenUtil.startVideo();
        $(this).text("关闭摄像头");
        $(this).attr("value", "1");
    } else if (status == "1") {
        RtcAudioVideoScreenUtil.stopVideo();
        $(this).text("打开摄像头");
        $(this).attr("value", "0");
    }
})

$("#loopbackButton").on("click", function (e) {
    let status = $(this).attr("value");
    let screenStatus = $("#screenButton").attr("value");
    let audioStatus = $("#audioButton").attr("value");
    if (status == "0") {
        RtcAudioVideoScreenUtil.startLoopbackRecording();
        $(this).text("关闭声卡采集");
        $(this).attr("value", "1");
        if (screenStatus == "0") {
            $("#screenButton").text("开始屏幕共享（声卡采集已开启）");
            if (audioStatus == "0") {
                $("#audioButton").text("打开麦克风");
            } else if (audioStatus == "1") {
                $("#audioButton").text("关闭麦克风");
            }
        } else if (screenStatus == "1") {
            $("#screenButton").text("关闭屏幕共享关闭声卡采集");
            if (audioStatus == "0") {
                $("#audioButton").text("打开麦克风（声卡采集已开启）");
            } else if (audioStatus == "1") {
                $("#audioButton").text("关闭麦克风关闭声卡采集");
            }
        }
    } else if (status == "1") {
        RtcAudioVideoScreenUtil.stopLoopbackRecording();
        $(this).text("打开声卡采集");
        $(this).attr("value", "0");
        if (screenStatus == "0") {
            $("#screenButton").text("开始屏幕共享打开声卡采集");
            if (audioStatus == "0") {
                $("#audioButton").text("打开麦克风（声卡采集已关闭）");
            } else if (audioStatus == "1") {
                $("#audioButton").text("关闭麦克风（声卡采集已关闭）");
            }
        } else if (screenStatus == "1") {
            $("#screenButton").text("关闭屏幕共享（声卡采集已关闭）");
            if (audioStatus == "0") {
                $("#audioButton").text("打开麦克风打开声卡采集");
            } else if (audioStatus == "1") {
                $("#audioButton").text("关闭麦克风（声卡采集已关闭）");
            }
        }
    }
})

$("#screenButton").on("click", function (e) {
    let status = $(this).attr("value");
    let audioStatus = $("#audioButton").attr("value");
    let loopbackStatus = $("#loopbackButton").attr("value");
    if (status == "0") {
        if (audioStatus == "0") {
            RtcAudioVideoScreenUtil.startAudio();
            $("#audioButton").attr("value", "1");
            $("#audioButton").text("关闭麦克风关闭声卡采集");
        } else if (audioStatus == "1") {
            $("#audioButton").text("关闭麦克风关闭声卡采集");
        }
        if (loopbackStatus == "0") {
            $("#loopbackButton").text("关闭声卡采集");
        } else if (loopbackStatus == "1") {
            $("#loopbackButton").text("关闭声卡采集");
        }
        $("#loopbackButton").attr("value", "1");
        $(this).text("关闭屏幕共享关闭采集声卡");
        RtcAudioVideoScreenUtil.startScreen();
        $(this).attr("value", "1");
    } else if (status == "1") {
        if (audioStatus == "0") {
            $("#audioButton").text("打开麦克风");
        } else if (audioStatus == "1") {
            $("#audioButton").text("关闭麦克风");
        }
        if (loopbackStatus == "0") {
            $("#loopbackButton").text("打开声卡采集");
        } else if (loopbackStatus == "1") {
            $("#loopbackButton").text("打开声卡采集");
        }
        $("#loopbackButton").attr("value", "0");

        RtcAudioVideoScreenUtil.stopScreen();
        $(this).text("开始屏幕共享打开声卡采集");
        $(this).attr("value", "0");
    }
})
