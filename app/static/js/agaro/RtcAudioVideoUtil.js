var RtcAudioVideoUtil = {
    AudioVideoRTC: null,//rtm实例
}

// 开始加入频道
RtcAudioVideoUtil.joinAudioVideo = function (logPath) {
    // 开始加入频道
    RtcAudioVideoUtil.AudioVideoRTC = new AgoraRtcEngine()
    RtcAudioVideoUtil.AudioVideoRTC.initialize(MeetInfoUtil.meetTokens.rtc_appid);

    // 加入频道回调
    RtcAudioVideoUtil.AudioVideoRTC.on('joinedChannel', (channel, uid, elapsed) => {
        console.log(`AudioVideoRTC joined channel ${channel} with uid ${uid}, elapsed ${elapsed}ms`);
        //设置本地视频渲染位置
        //RtcAudioVideoUtil.AudioVideoRTC.setupLocalVideo(localVideoContainer);
    });
    // 重新加入频道回调
    RtcAudioVideoUtil.AudioVideoRTC.on('rejoinedChannel', (channel, uid, elapsed) => {
        console.log(`AudioVideoRTC rejoined channel ${channel} with uid ${uid}, elapsed ${elapsed}ms`);
        //设置本地视频渲染位置
        //RtcAudioVideoUtil.AudioVideoRTC.setupLocalVideo(localVideoContainer);
    });
    // 他人加入频道回调
    RtcAudioVideoUtil.AudioVideoRTC.on('userJoined', (uid, elapsed) => {
        console.log(`AudioVideoRTC userJoined uid ${uid}, elapsed ${elapsed}ms`);
        // 设置视窗内容显示模式
        RtcAudioVideoUtil.AudioVideoRTC.setupViewContentMode(uid, 1);
        // 订阅该远端用户流
        //RtcAudioVideoUtil.AudioVideoRTC.subscribe(uid, remoteVideoContainer)
    });
    // 异常回调
    RtcAudioVideoUtil.AudioVideoRTC.on('error', (err, msg) => {
        console.log(`AudioVideoRTC error: code ${err} - ${msg}`)
        //consoleContainer.innerHTML = `error: code ${err} - ${msg}`
    });

    // 设置频道场景, 0: 通信, 1: 直播
    RtcAudioVideoUtil.AudioVideoRTC.setChannelProfile(1);

    if (MeetInfoUtil.isMyMeet) {
        //设置直播场景下的用户角色, 1：主播, 2：（默认）观众
        RtcAudioVideoUtil.AudioVideoRTC.setClientRole(1);
    }

    // 开启音频功能
    let audioCode = RtcAudioVideoUtil.AudioVideoRTC.enableAudio();
    console.log("AudioVideoRTC开启音频功能", audioCode);
    // 关闭音频功能
    //RtcAudioVideoUtil.AudioVideoRTC.disableAudio();
    // 开启视频功能
    let videoCode = RtcAudioVideoUtil.AudioVideoRTC.enableVideo();
    console.log("AudioVideoRTC开启视频功能", videoCode);
    // 关闭视频功能
    //RtcAudioVideoUtil.AudioVideoRTC.disableVideo();
    // 停止视频预览
    //RtcAudioVideoUtil.AudioVideoRTC.stopPreview();

    // 设置日志文件
    RtcAudioVideoUtil.AudioVideoRTC.setLogFile(logPath)

    // 加入频道
    let joinChannelCode = RtcAudioVideoUtil.AudioVideoRTC.joinChannel(MeetInfoUtil.meetTokens.rtc_video_token, MeetInfoUtil.meetQrcord, null, parseInt(AgaroUserUtil.userId));
    console.log("AudioVideoRTC joinChannel", joinChannelCode);
}

module.exports = RtcAudioVideoUtil;