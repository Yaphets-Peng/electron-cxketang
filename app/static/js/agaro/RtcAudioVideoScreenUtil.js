var RtcAudioVideoScreenUtil = {
    RtcAudioVideoScreen: null,//rtm实例
}

//初始化
RtcAudioVideoScreenUtil.init = function (logPath) {
    RtcAudioVideoScreenUtil.RtcAudioVideoScreen = new AgoraRtcEngine()
    RtcAudioVideoScreenUtil.RtcAudioVideoScreen.initialize(MeetInfoUtil.meetTokens.rtc_appid);

    // 加入频道回调
    RtcAudioVideoScreenUtil.RtcAudioVideoScreen.on('joinedChannel', (channel, uid, elapsed) => {
        console.log(`RtcAudioVideoScreen joined channel ${channel} with uid ${uid}, elapsed ${elapsed}ms`);
        //设置本地视频渲染位置
        //RtcAudioVideoScreenUtil.RtcAudioVideoScreen.setupLocalVideo(localVideoContainer);
    });
    // 重新加入频道回调
    RtcAudioVideoScreenUtil.RtcAudioVideoScreen.on('rejoinedChannel', (channel, uid, elapsed) => {
        console.log(`RtcAudioVideoScreen rejoined channel ${channel} with uid ${uid}, elapsed ${elapsed}ms`);
        //设置本地视频渲染位置
        //RtcAudioVideoScreenUtil.RtcAudioVideoScreen.setupLocalVideo(localVideoContainer);
    });
    // 他人加入频道回调
    RtcAudioVideoScreenUtil.RtcAudioVideoScreen.on('userJoined', (uid, elapsed) => {
        console.log(`RtcAudioVideoScreen userJoined uid ${uid}, elapsed ${elapsed}ms`);
        // 设置视窗内容显示模式
        RtcAudioVideoScreenUtil.RtcAudioVideoScreen.setupViewContentMode(uid, 1);
        // 订阅该远端用户流
        //RtcAudioVideoScreenUtil.RtcAudioVideoScreen.subscribe(uid, remoteVideoContainer)
    });
    // 他人离开频道回调
    // 用户主动离开
    // 因过长时间收不到对方数据包，超时掉线。注意：由于 SDK 使用的是不可靠通道，也有可能对方 主动离开本方没收到对方离开消息而误判为超时掉线
    // （直播场景下）用户身份从主播切换为观众
    RtcAudioVideoScreenUtil.RtcAudioVideoScreen.on('userOffline', (uid, elapsed) => {
        console.log(`RtcAudioVideoScreen userOffline uid ${uid}, elapsed ${elapsed}ms`);
    });
    //当远端流被移除时（例如远端用户调用了 Stream.unpublish）， 停止播放该流并移除它的画面。
    // 0：用户主动离开。
    // 1：因过长时间收不到对方数据包，超时掉线。注意：由于 SDK 使用的是不可靠通道，也有可能对方主动离开本方没收到对方离开消息而误判为超时掉线。
    // 2：用户身份从主播切换为观众。
    RtcAudioVideoScreenUtil.RtcAudioVideoScreen.on('removeStream', (uid, reason) => {
        console.log(`RtcAudioVideoScreen removeStream: uid ${uid} -reason ${reason}`)
        //consoleContainer.innerHTML = `error: code ${err} - ${msg}`
    });
    // 异常回调
    RtcAudioVideoScreenUtil.RtcAudioVideoScreen.on('error', (err, msg) => {
        console.log(`RtcAudioVideoScreen error: code ${err} - ${msg}`)
        //consoleContainer.innerHTML = `error: code ${err} - ${msg}`
    });

    // 设置频道场景, 0: 通信, 1: 直播
    RtcAudioVideoScreenUtil.RtcAudioVideoScreen.setChannelProfile(1);

    if (MeetInfoUtil.isMyMeet) {
        //设置直播场景下的用户角色, 1：主播, 2：（默认）观众
        RtcAudioVideoScreenUtil.RtcAudioVideoScreen.setClientRole(1);
    }

    // 设置日志文件
    RtcAudioVideoScreenUtil.RtcAudioVideoScreen.setLogFile(logPath)
}

RtcAudioVideoScreenUtil.startAudio = function () {
    // 开启音频功能
    let audioCode = RtcAudioVideoScreenUtil.RtcAudioVideoScreen.enableAudio();
    console.log("RtcAudioVideoScreen开启音频功能", audioCode);
    // 关闭音频功能
    //RtcAudioVideoScreenUtil.RtcAudioVideoScreen.disableAudio();
    // 开启视频功能
    let videoCode = RtcAudioVideoScreenUtil.RtcAudioVideoScreen.enableVideo();
    console.log("RtcAudioVideoScreen开启视频功能", videoCode);
    // 关闭视频功能
    //RtcAudioVideoScreenUtil.RtcAudioVideoScreen.disableVideo();
    // 停止视频预览
    //RtcAudioVideoScreenUtil.RtcAudioVideoScreen.stopPreview();
    // 加入频道
    let joinChannelCode = RtcAudioVideoScreenUtil.RtcAudioVideoScreen.joinChannel(MeetInfoUtil.meetTokens.rtc_video_token, MeetInfoUtil.meetQrcord, null, parseInt(AgaroUserUtil.userId));
    console.log("RtcAudioVideoScreen joinChannel", joinChannelCode);
}


// 开始加入频道
RtcAudioVideoScreenUtil.joinAudioVideoScreen = function (logPath) {
    // 开启音频功能
    let audioCode = RtcAudioVideoScreenUtil.RtcAudioVideoScreen.enableAudio();
    console.log("RtcAudioVideoScreen开启音频功能", audioCode);
    // 关闭音频功能
    //RtcAudioVideoScreenUtil.RtcAudioVideoScreen.disableAudio();
    // 开启视频功能
    let videoCode = RtcAudioVideoScreenUtil.RtcAudioVideoScreen.enableVideo();
    console.log("RtcAudioVideoScreen开启视频功能", videoCode);
    // 关闭视频功能
    //RtcAudioVideoScreenUtil.RtcAudioVideoScreen.disableVideo();
    // 停止视频预览
    //RtcAudioVideoScreenUtil.RtcAudioVideoScreen.stopPreview();

    // 设置日志文件
    RtcAudioVideoScreenUtil.RtcAudioVideoScreen.setLogFile(logPath)

    // 加入频道
    let joinChannelCode = RtcAudioVideoScreenUtil.RtcAudioVideoScreen.joinChannel(MeetInfoUtil.meetTokens.rtc_video_token, MeetInfoUtil.meetQrcord, null, parseInt(AgaroUserUtil.userId));
    console.log("RtcAudioVideoScreen joinChannel", joinChannelCode);
}

RtcAudioVideoScreenUtil.startScreen = function () {
    //获取屏幕信息
    let displays = RtcAudioVideoScreenUtil.RtcAudioVideoScreen.getScreenDisplaysInfo()
    if (displays.length === 0) {
        return alert('no display found')
    }
    console.log(displays);

    // 开始屏幕共享
    //设置本地视频渲染位置
    //RtcAudioVideoScreenUtil.RtcAudioVideoScreen.setupLocalVideo(localVideoContainer);
    //开启第二个实例作为屏幕共享
    let initScreenCode = RtcAudioVideoScreenUtil.RtcAudioVideoScreen.videoSourceInitialize(MeetInfoUtil.meetTokens.rtc_appid)
    console.log("初始化共享屏幕频道", initScreenCode);

    RtcAudioVideoScreenUtil.RtcAudioVideoScreen.videoSourceSetChannelProfile(1);
    // 加入videoSource频道
    let joinScreenCode = RtcAudioVideoScreenUtil.RtcAudioVideoScreen.videoSourceJoin(MeetInfoUtil.meetTokens.rtc_screen_token, MeetInfoUtil.meetQrcord, null, AgaroUserUtil.getScreenPuid(AgaroUserUtil.userId, true))
    console.log("加入共享屏幕频道", joinScreenCode);

    // 初始化成功开启
    RtcAudioVideoScreenUtil.RtcAudioVideoScreen.on('videosourcejoinedsuccess', () => {
        // start screenshare
        RtcAudioVideoScreenUtil.RtcAudioVideoScreen.videoSourceSetVideoProfile(49, false);
        let screenCode = RtcAudioVideoScreenUtil.RtcAudioVideoScreen.videoSourceStartScreenCaptureByScreen(displays[0].displayId, {
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
    });
}

// 停止屏幕共享
RtcAudioVideoScreenUtil.stopScreen = function () {
    let screenCode = RtcAudioVideoScreenUtil.RtcAudioVideoScreen.stopScreenCapture2();
    console.log("停止共享屏幕", screenCode);

    let leaveScreenCode = RtcAudioVideoScreenUtil.RtcAudioVideoScreen.videoSourceLeave();
    console.log("离开共享屏幕频道", leaveScreenCode);

    let releaseScreenCode = RtcAudioVideoScreenUtil.RtcAudioVideoScreen.videoSourceRelease();
    console.log("释放共享屏幕频道", releaseScreenCode);
}

module.exports = RtcAudioVideoScreenUtil;