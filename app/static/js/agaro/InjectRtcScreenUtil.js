//注入js
var InjectRtcScreenUtil = {
    ScreenRTC: null,//rtc实例
    sdkLogPath: null,//日志路径
    clientRole: 2,//直播场景下的用户角色, 1：主播, 2：（默认）观众
    screenStatus: 0,//屏幕共享0：关闭，1：开启
}

InjectRtcScreenUtil.init = function () {
}

InjectRtcScreenUtil.startScreen = function () {
    InjectRtcAudioVideoScreenUtil.startScreen();
}

InjectRtcScreenUtil.stopScreen = function () {
    InjectRtcAudioVideoScreenUtil.stopScreen();
}

// 开始加入频道
/*InjectRtcScreenUtil.init = function () {
    console.log("sdkLogPath=", InjectRtcScreenUtil.sdkLogPath);
    // 开始加入频道
    InjectRtcScreenUtil.ScreenRTC = new AgoraRtcEngine();
    InjectRtcScreenUtil.ScreenRTC.initialize(Meeting.rtc_appid);
    console.log("rtc_appid=", Meeting.rtc_appid);

    // 设置日志文件
    InjectRtcScreenUtil.ScreenRTC.setLogFile(InjectRtcScreenUtil.sdkLogPath);
    // TODO 开发设置2020-11-03
    //InjectRtcScreenUtil.ScreenRTC.setParameters("{\"che.audio.start_debug_recording\":\"NoName\"}");

    // 加入频道回调
    InjectRtcScreenUtil.ScreenRTC.on('joinedChannel', (channel, uid, elapsed) => {
        console.log(`ScreenRTC joined Screen channel ${channel} with uid ${uid}, elapsed ${elapsed}ms`);
    });
    // 重新加入频道回调
    InjectRtcScreenUtil.ScreenRTC.on('rejoinedChannel', (channel, uid, elapsed) => {
        console.log(`ScreenRTC rejoined Screen channel ${channel} with uid ${uid}, elapsed ${elapsed}ms`);
        //设置本地视频渲染位置
        //ScreenRTC.setupLocalVideo(localVideoContainer);
    });
    // 他人加入频道回调
    InjectRtcScreenUtil.ScreenRTC.on('userJoined', (uid, elapsed) => {
        console.log(`ScreenRTC userJoined uid ${uid}, elapsed ${elapsed}ms`);
        // 设置视窗内容显示模式
        //ScreenRTC.setupViewContentMode(uid, 1);
        // 订阅该远端用户流
        //ScreenRTC.subscribe(uid, remoteVideoContainer)
    });
    // 他人离开频道回调
    // 用户主动离开
    // 因过长时间收不到对方数据包，超时掉线。注意：由于 SDK 使用的是不可靠通道，也有可能对方 主动离开本方没收到对方离开消息而误判为超时掉线
    // （直播场景下）用户身份从主播切换为观众
    InjectRtcScreenUtil.ScreenRTC.on('userOffline', (uid, elapsed) => {
        console.log(`ScreenRTC userOffline uid ${uid}, elapsed ${elapsed}ms`);
    });
    //当远端流被移除时（例如远端用户调用了 Stream.unpublish）， 停止播放该流并移除它的画面。
    // 0：用户主动离开。
    // 1：因过长时间收不到对方数据包，超时掉线。注意：由于 SDK 使用的是不可靠通道，也有可能对方主动离开本方没收到对方离开消息而误判为超时掉线。
    // 2：用户身份从主播切换为观众。
    InjectRtcScreenUtil.ScreenRTC.on('removeStream', (uid, reason) => {
        console.log(`ScreenRTC removeStream: uid ${uid} -reason ${reason}`)
        //consoleContainer.innerHTML = `error: code ${err} - ${msg}`
    });
    // 异常回调
    InjectRtcScreenUtil.ScreenRTC.on('error', (err, msg) => {
        console.log(`ScreenRTC error: code ${err} - ${msg}`)
        //consoleContainer.innerHTML = `error: code ${err} - ${msg}`
    });

    // 设置频道场景, 0: 通信, 1: 直播
    InjectRtcScreenUtil.ScreenRTC.setChannelProfile(1);
    /!*if (MeetInfoUtil.isMyMeet) {
        //设置直播场景下的用户角色, 1：主播, 2：（默认）观众
        InjectRtcScreenUtil.ScreenRTC.setClientRole(1);
    }*!/
    // 必须关主播身份
    InjectRtcScreenUtil.ScreenRTC.setClientRole(InjectRtcScreenUtil.clientRole);
    // 关闭音频功能
    let audioCode = InjectRtcScreenUtil.ScreenRTC.disableAudio();
    console.log("ScreenRTC关闭音频功能", audioCode);
    // 停止接收所有音频流
    let stopAudioCode = InjectRtcScreenUtil.ScreenRTC.muteAllRemoteAudioStreams(true);
    console.log("ScreenRTC停止接收所有音频流", stopAudioCode);
    // 打开视频功能
    let openVideoCode = InjectRtcScreenUtil.ScreenRTC.enableVideo();
    console.log("ScreenRTC打开视频功能", openVideoCode);
    //停止视频预览
    let stopPreviewCode = InjectRtcScreenUtil.ScreenRTC.stopPreview();
    console.log("ScreenRTC停止视频预览", stopPreviewCode);
    // 停止接收所有视频流
    let stopVideoCode = InjectRtcScreenUtil.ScreenRTC.muteAllRemoteVideoStreams(true);
    console.log("ScreenRTC停止接收所有视频流", stopVideoCode);
    //打开与WebSDK的互通
    let enableWebCode = InjectRtcScreenUtil.ScreenRTC.enableWebSdkInteroperability(true);
    console.log("ScreenRTC打开与WebSDK的互通", enableWebCode);
}

InjectRtcScreenUtil.startScreen = function () {
    //获取屏幕信息
    let displays = InjectRtcScreenUtil.ScreenRTC.getScreenDisplaysInfo()
    if (displays.length === 0) {
        console.log('no display found');
        return;
    }
    console.log(displays);
    // 必须开主播身份
    InjectRtcScreenUtil.screenStatus = 1;
    InjectRtcScreenUtil.clientRole = 1;
    InjectRtcScreenUtil.ScreenRTC.setClientRole(InjectRtcScreenUtil.clientRole);
    //开始采集音频
    if (typeof InjectRtcAudioVideoUtil != "undefined") {
        // 开启麦克风
        InjectRtcAudioVideoUtil.startAudio();
    }
    // 加入频道
    let userIdTemp = parseInt(Meeting.getScreenPuid(Meeting.login_puid));
    let joinChannelCode = InjectRtcScreenUtil.ScreenRTC.joinChannel(Meeting.rtc_screen_token, Meeting.meet_qrcode, null, userIdTemp);
    console.log("ScreenRTC joinChannel", joinChannelCode);
    console.log("rtc_screen_token=", Meeting.rtc_screen_token);
    console.log("meet_qrcode=", Meeting.meet_qrcode);
    console.log("userIdTemp=", userIdTemp);

    // 开始屏幕共享
    // 初始化成功开启
    let screenCode = InjectRtcScreenUtil.ScreenRTC.startScreenCaptureByScreen(displays[0].displayId, {
        x: 0, y: 0, width: 0, height: 0
    }, {
        width: 0,
        height: 0,
        bitrate: 500,
        frameRate: 5,
        captureMouseCursor: true,
        windowFocus: false
    });
    console.log("开始共享屏幕", screenCode);
}

// 停止屏幕共享
InjectRtcScreenUtil.stopScreen = function () {
    // 必须关主播身份
    InjectRtcScreenUtil.screenStatus = 0;
    InjectRtcScreenUtil.clientRole = 2;
    InjectRtcScreenUtil.ScreenRTC.setClientRole(InjectRtcScreenUtil.clientRole);
    //停止采集音频
    if (typeof InjectRtcAudioVideoUtil != "undefined") {
        InjectRtcAudioVideoUtil.stopLoopbackRecording();
    }
    //离开频道
    let leaveCode = InjectRtcScreenUtil.ScreenRTC.leaveChannel();
    console.log("ScreenRTC leaveChannel", leaveCode);
    //停止共享屏幕
    let screenCode = InjectRtcScreenUtil.ScreenRTC.stopScreenCapture();
    console.log("停止共享屏幕", screenCode);
}*/

module.exports = InjectRtcScreenUtil;