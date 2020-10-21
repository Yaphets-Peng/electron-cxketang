var RtcScreenUtil = {
    ScreenRTC: null,//rtc实例
}

// 开始加入频道
RtcScreenUtil.joinScreen = function (logPath) {
    // 开始加入频道
    RtcScreenUtil.ScreenRTC = new AgoraRtcEngine();
    RtcScreenUtil.ScreenRTC.initialize(MeetInfoUtil.meetTokens.rtc_appid);

    // 加入频道回调
    RtcScreenUtil.ScreenRTC.on('joinedChannel', (channel, uid, elapsed) => {
        console.log(`ScreenRTC joined Screen channel ${channel} with uid ${uid}, elapsed ${elapsed}ms`);
    });
    // 重新加入频道回调
    RtcScreenUtil.ScreenRTC.on('rejoinedChannel', (channel, uid, elapsed) => {
        console.log(`ScreenRTC rejoined Screen channel ${channel} with uid ${uid}, elapsed ${elapsed}ms`);
        //设置本地视频渲染位置
        //ScreenRTC.setupLocalVideo(localVideoContainer);
    });
    // 他人加入频道回调
    RtcScreenUtil.ScreenRTC.on('userJoined', (uid, elapsed) => {
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
    RtcScreenUtil.ScreenRTC.on('userOffline', (uid, elapsed) => {
        console.log(`ScreenRTC userOffline uid ${uid}, elapsed ${elapsed}ms`);
    });
    //当远端流被移除时（例如远端用户调用了 Stream.unpublish）， 停止播放该流并移除它的画面。
    // 0：用户主动离开。
    // 1：因过长时间收不到对方数据包，超时掉线。注意：由于 SDK 使用的是不可靠通道，也有可能对方主动离开本方没收到对方离开消息而误判为超时掉线。
    // 2：用户身份从主播切换为观众。
    RtcScreenUtil.ScreenRTC.on('removeStream', (uid, reason) => {
        console.log(`ScreenRTC removeStream: uid ${uid} -reason ${reason}`)
        //consoleContainer.innerHTML = `error: code ${err} - ${msg}`
    });
    // 异常回调
    RtcScreenUtil.ScreenRTC.on('error', (err, msg) => {
        console.log(`ScreenRTC error: code ${err} - ${msg}`)
        //consoleContainer.innerHTML = `error: code ${err} - ${msg}`
    });

    // 设置频道场景, 0: 通信, 1: 直播
    RtcScreenUtil.ScreenRTC.setChannelProfile(1);
    if (MeetInfoUtil.isMyMeet) {
        //设置直播场景下的用户角色, 1：主播, 2：（默认）观众
        RtcScreenUtil.ScreenRTC.setClientRole(1);
    }


    // 打开视频功能
    let openVideoCode = RtcScreenUtil.ScreenRTC.enableVideo();
    console.log("ScreenRTC打开视频功能", openVideoCode);
    //停止视频预览
    let stopPreviewCode = RtcScreenUtil.ScreenRTC.stopPreview();
    console.log("ScreenRTC打开视频功能", stopPreviewCode);
    // 关闭音频功能
    let audioCode = RtcScreenUtil.ScreenRTC.disableAudio();
    console.log("ScreenRTC关闭音频功能", audioCode);

    // 打开音频功能
    /*let openAudioCode = RtcScreenUtil.ScreenRTC.enableAudio();
    console.log("ScreenRTC打开音频功能", openAudioCode);*/
    // 关闭视频功能
    /*let videoCode = RtcScreenUtil.ScreenRTC.disableVideo();
    console.log("ScreenRTC关闭视频功能", videoCode);*/

    // 设置日志文件
    RtcScreenUtil.ScreenRTC.setLogFile(logPath)

    // 加入频道
    let joinChannelCode = RtcScreenUtil.ScreenRTC.joinChannel(MeetInfoUtil.meetTokens.rtc_screen_token, MeetInfoUtil.meetQrcord, null, AgaroUserUtil.getScreenPuid(AgaroUserUtil.userId, true));
    console.log("ScreenRTC joinChannel", joinChannelCode);
}

RtcScreenUtil.startScreen = function () {
    //获取屏幕信息
    let displays = RtcScreenUtil.ScreenRTC.getScreenDisplaysInfo()
    if (displays.length === 0) {
        return alert('no display found')
    }
    console.log(displays);

    //开始发动本地视频流
    let muteVideoCode = RtcScreenUtil.ScreenRTC.muteLocalVideoStream(false);
    console.log("开始发动本地视频流", muteVideoCode);

    //开始采集音频
    let enableCode = RtcScreenUtil.ScreenRTC.enableLoopbackRecording(true);
    console.log("开始采集音频", enableCode);

    // 开始屏幕共享
    //设置本地视频渲染位置
    //ScreenRTC.setupLocalVideo(localVideoContainer);
    // 初始化成功开启
    let screenCode = RtcScreenUtil.ScreenRTC.startScreenCaptureByScreen(displays[0].displayId, {
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
RtcScreenUtil.stopScreen = function () {

    //停止发动本地视频流
    let muteVideoCode = RtcScreenUtil.ScreenRTC.muteLocalVideoStream(true);
    console.log("停止发动本地视频流", muteVideoCode);
    //停止采集音频
    let enableCode = RtcScreenUtil.ScreenRTC.enableLoopbackRecording(false);
    console.log("停止采集音频", enableCode);

    let screenCode = RtcScreenUtil.ScreenRTC.stopScreenCapture();
    console.log("停止共享屏幕", screenCode);
}

module.exports = RtcScreenUtil;