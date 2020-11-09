//注入js
var InjectRtcAudioVideoUtil = {
    AudioVideoRTC: null,//rtc实例
    sdkLogPath: null,//日志路径
    clientRole: 2,//直播场景下的用户角色, 1：主播, 2：（默认）观众
    audioStatus: 0,//麦克风0：关闭，1：开启
    videoStatus: 0,//视频0：关闭，1：开启
    loopbackStatus: 0,//声卡采集0：关闭，1：开启
}

// 开始加入频道
InjectRtcAudioVideoUtil.init = function () {
    console.log("sdkLogPath=", InjectRtcAudioVideoUtil.sdkLogPath);
    // 开始加入频道
    InjectRtcAudioVideoUtil.AudioVideoRTC = new AgoraRtcEngine();
    InjectRtcAudioVideoUtil.AudioVideoRTC.initialize(Meeting.rtc_appid);
    console.log("rtc_appid=", Meeting.rtc_appid);

    // 设置日志文件
    InjectRtcAudioVideoUtil.AudioVideoRTC.setLogFile(InjectRtcAudioVideoUtil.sdkLogPath);
    // TODO 开发设置2020-11-03
    //InjectRtcAudioVideoUtil.AudioVideoRTC.setParameters("{\"che.audio.start_debug_recording\":\"NoName\"}");

    // 加入频道回调
    InjectRtcAudioVideoUtil.AudioVideoRTC.on('joinedChannel', (channel, uid, elapsed) => {
        console.log(`AudioVideoRTC joined Screen channel ${channel} with uid ${uid}, elapsed ${elapsed}ms`);
    });
    // 重新加入频道回调
    InjectRtcAudioVideoUtil.AudioVideoRTC.on('rejoinedChannel', (channel, uid, elapsed) => {
        console.log(`AudioVideoRTC rejoined Screen channel ${channel} with uid ${uid}, elapsed ${elapsed}ms`);
        //设置本地视频渲染位置
        //AudioVideoRTC.setupLocalVideo(localVideoContainer);
    });
    // 他人加入频道回调
    InjectRtcAudioVideoUtil.AudioVideoRTC.on('userJoined', (uid, elapsed) => {
        console.log(`AudioVideoRTC userJoined uid ${uid}, elapsed ${elapsed}ms`);
        // 设置视窗内容显示模式
        //AudioVideoRTC.setupViewContentMode(uid, 1);
        // 订阅该远端用户流
        //AudioVideoRTC.subscribe(uid, remoteVideoContainer)
    });
    // 他人离开频道回调
    // 用户主动离开
    // 因过长时间收不到对方数据包，超时掉线。注意：由于 SDK 使用的是不可靠通道，也有可能对方 主动离开本方没收到对方离开消息而误判为超时掉线
    // （直播场景下）用户身份从主播切换为观众
    InjectRtcAudioVideoUtil.AudioVideoRTC.on('userOffline', (uid, elapsed) => {
        console.log(`AudioVideoRTC userOffline uid ${uid}, elapsed ${elapsed}ms`);
    });
    //当远端流被移除时（例如远端用户调用了 Stream.unpublish）， 停止播放该流并移除它的画面。
    // 0：用户主动离开。
    // 1：因过长时间收不到对方数据包，超时掉线。注意：由于 SDK 使用的是不可靠通道，也有可能对方主动离开本方没收到对方离开消息而误判为超时掉线。
    // 2：用户身份从主播切换为观众。
    InjectRtcAudioVideoUtil.AudioVideoRTC.on('removeStream', (uid, reason) => {
        console.log(`AudioVideoRTC removeStream: uid ${uid} -reason ${reason}`)
        //consoleContainer.innerHTML = `error: code ${err} - ${msg}`
    });
    // 异常回调
    InjectRtcAudioVideoUtil.AudioVideoRTC.on('error', (err, msg) => {
        console.log(`AudioVideoRTC error: code ${err} - ${msg}`)
        //consoleContainer.innerHTML = `error: code ${err} - ${msg}`
    });

    // 设置频道场景, 0: 通信, 1: 直播
    InjectRtcAudioVideoUtil.AudioVideoRTC.setChannelProfile(1);
    /*if (MeetInfoUtil.isMyMeet) {
        //设置直播场景下的用户角色, 1：主播, 2：（默认）观众
        InjectRtcAudioVideoUtil.AudioVideoRTC.setClientRole(1);
    }*/
    // 必须关主播身份
    InjectRtcAudioVideoUtil.AudioVideoRTC.setClientRole(InjectRtcAudioVideoUtil.clientRole);
    // 打开音频功能
    let openAudioCode = InjectRtcAudioVideoUtil.AudioVideoRTC.enableAudio();
    console.log("AudioVideoRTC打开音频功能", openAudioCode);
    // 停止发送本地音频流
    let localAudioCode = InjectRtcAudioVideoUtil.AudioVideoRTC.muteLocalAudioStream(true);
    console.log("AudioVideoRTC停止发送本地音频流", localAudioCode);
    // 打开视频功能
    let openVideoCode = InjectRtcAudioVideoUtil.AudioVideoRTC.enableVideo();
    console.log("AudioVideoRTC打开视频功能", openVideoCode);
    //停止本地视频采集
    let localVideoCode = InjectRtcAudioVideoUtil.AudioVideoRTC.enableLocalVideo(false);
    console.log("AudioVideoRTC停止本地视频采集", localVideoCode);
    //打开与WebSDK的互通
    let enableWebCode = InjectRtcAudioVideoUtil.AudioVideoRTC.enableWebSdkInteroperability(true);
    console.log("AudioVideoRTC打开与WebSDK的互通", enableWebCode);

    // 加入频道
    let userIdTemp = parseInt(Meeting.login_puid);
    let joinChannelCode = InjectRtcAudioVideoUtil.AudioVideoRTC.joinChannel(Meeting.rtc_video_token, Meeting.meet_qrcode, null, userIdTemp);
    console.log("AudioVideoRTC joinChannel", joinChannelCode);
    console.log("rtc_video_token=", Meeting.rtc_video_token);
    console.log("meet_qrcode=", Meeting.meet_qrcode);
    console.log("userIdTemp=", userIdTemp);
}

// 开麦克风
InjectRtcAudioVideoUtil.startAudio = function () {
    //获取音频录音设备
    let devices = InjectRtcAudioVideoUtil.AudioVideoRTC.getAudioRecordingDevices()
    if (devices.length === 0) {
        console.log('no audio found');
        return;
    }
    console.log(devices);
    // 必须开主播身份
    if (InjectRtcAudioVideoUtil.clientRole == 2) {
        InjectRtcAudioVideoUtil.clientRole = 1;
        InjectRtcAudioVideoUtil.AudioVideoRTC.setClientRole(InjectRtcAudioVideoUtil.clientRole);
    }
    // 开始发送本地音频流
    InjectRtcAudioVideoUtil.audioStatus = 1;
    let localAudioCode = InjectRtcAudioVideoUtil.AudioVideoRTC.muteLocalAudioStream(false);
    console.log("AudioVideoRTC开始发送本地音频流", localAudioCode);
    // 判断是否在屏幕共享
    if (typeof InjectRtcScreenUtil) {
        if (InjectRtcScreenUtil.screenStatus == 1) {
            InjectRtcAudioVideoUtil.loopbackStatus = 1;
            //开始采集声卡
            let enableCode = InjectRtcAudioVideoUtil.AudioVideoRTC.enableLoopbackRecording(true);
            console.log("开始采集声卡", enableCode);
        }
    }
}

// 关麦克风
InjectRtcAudioVideoUtil.stopAudio = function () {
    // 必须关主播身份
    if (InjectRtcAudioVideoUtil.clientRole == 1) {
        // 如果摄像头关闭
        if (InjectRtcAudioVideoUtil.videoStatus == 0) {
            InjectRtcAudioVideoUtil.clientRole = 2;
            InjectRtcAudioVideoUtil.AudioVideoRTC.setClientRole(InjectRtcAudioVideoUtil.clientRole);
        }
    }
    // 停止发送本地音频流
    InjectRtcAudioVideoUtil.audioStatus = 0;
    let localAudioCode = InjectRtcAudioVideoUtil.AudioVideoRTC.muteLocalAudioStream(true);
    console.log("AudioVideoRTC停止发送本地音频流", localAudioCode);
    //停止采集声卡
    InjectRtcAudioVideoUtil.loopbackStatus = 0;
    let enableCode = RtcAudioVideoScreenUtil.RtcAudioVideoScreen.enableLoopbackRecording(false);
    console.log("停止采集声卡", enableCode);
}

//开始采集声卡
InjectRtcAudioVideoUtil.startLoopbackRecording = function () {
    //开始采集声卡
    InjectRtcAudioVideoUtil.loopbackStatus = 1;
    let enableCode = InjectRtcAudioVideoUtil.RtcAudioVideoScreen.enableLoopbackRecording(true);
    console.log("开始采集声卡", enableCode);
}

//停止采集声卡
InjectRtcAudioVideoUtil.stopLoopbackRecording = function () {
    //停止采集声卡
    InjectRtcAudioVideoUtil.loopbackStatus = 0;
    let enableCode = InjectRtcAudioVideoUtil.RtcAudioVideoScreen.enableLoopbackRecording(false);
    console.log("停止采集声卡", enableCode);
}

// 开摄像头
InjectRtcAudioVideoUtil.startVideo = function () {
    //获取音频录音设备
    let devices = InjectRtcAudioVideoUtil.AudioVideoRTC.getVideoDevices()
    if (devices.length === 0) {
        console.log('no video found');
        return;
    }
    console.log(devices);
    // 必须开主播身份
    if (InjectRtcAudioVideoUtil.clientRole == 2) {
        InjectRtcAudioVideoUtil.clientRole = 1;
        InjectRtcAudioVideoUtil.AudioVideoRTC.setClientRole(InjectRtcAudioVideoUtil.clientRole);
    }
    // 开始本地视频采集
    InjectRtcAudioVideoUtil.videoStatus = 1;
    let localVideoCode = InjectRtcAudioVideoUtil.AudioVideoRTC.enableLocalVideo(true);
    console.log("AudioVideoRTC开始本地视频采集", localVideoCode);
}

// 关摄像头
InjectRtcAudioVideoUtil.stopVideo = function () {
    // 必须关主播身份
    if (InjectRtcAudioVideoUtil.clientRole == 1) {
        // 如果麦克风关闭
        if (InjectRtcAudioVideoUtil.audioStatus == 0) {
            InjectRtcAudioVideoUtil.clientRole = 2;
            InjectRtcAudioVideoUtil.AudioVideoRTC.setClientRole(InjectRtcAudioVideoUtil.clientRole);
        }
    }
    // 停止本地视频采集
    InjectRtcAudioVideoUtil.videoStatus = 0;
    let localVideoCode = InjectRtcAudioVideoUtil.AudioVideoRTC.enableLocalVideo(false);
    console.log("AudioVideoRTC停止本地视频采集", localVideoCode);
}

module.exports = InjectRtcAudioVideoUtil;