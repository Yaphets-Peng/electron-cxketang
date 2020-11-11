//注入js
var InjectRtcAudioVideoScreenUtil = {
    AudioVideoScreenRTC: null,//rtc实例
    sdkLogPath: null,//日志路径
    clientRole: 2,//直播场景下的用户角色, 1：主播, 2：（默认）观众
    audioStatus: 0,//麦克风0：关闭，1：开启
    videoStatus: 0,//视频0：关闭，1：开启
    loopbackStatus: 0,//声卡采集0：关闭，1：开启
    screenStatus: 0,//屏幕共享0：关闭，1：开启
}

/*InjectRtcAudioVideoScreenUtil.init = function () {

}*/

// 开始加入频道
InjectRtcAudioVideoScreenUtil.init = function () {
    console.log("sdkLogPath=", InjectRtcAudioVideoScreenUtil.sdkLogPath);
    // 开始加入频道
    InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC = new AgoraRtcEngine();
    InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.initialize(Meeting.rtc_appid);
    console.log("rtc_appid=", Meeting.rtc_appid);

    // 设置日志文件
    InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.setLogFile(InjectRtcAudioVideoScreenUtil.sdkLogPath);
    // TODO 开发设置2020-11-03
    //InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.setParameters("{\"che.audio.start_debug_recording\":\"NoName\"}");

    // 加入频道回调
    InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.on('joinedChannel', (channel, uid, elapsed) => {
        console.log(`AudioVideoScreenRTC joined Screen channel ${channel} with uid ${uid}, elapsed ${elapsed}ms`);
        if ($("#camera_" + uid).length === 0) {
            $("#video_user_" + uid + " .videoPeople_div").append('<div class="cameraVideo" id="camera_' + uid + '"></div>')
        }
        let localVideoContainer = document.getElementById("camera_" + uid);
        console.log(localVideoContainer);
        let domLocalVideoCode = InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.setupLocalVideo(localVideoContainer);
        console.log("AudioVideoScreenRTC设置本地视频渲染位置", domLocalVideoCode);
    });
    // 重新加入频道回调
    InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.on('rejoinedChannel', (channel, uid, elapsed) => {
        console.log(`AudioVideoScreenRTC rejoined Screen channel ${channel} with uid ${uid}, elapsed ${elapsed}ms`);
        if ($("#camera_" + uid).length === 0) {
            $("#video_user_" + uid + " .videoPeople_div").append('<div class="cameraVideo" id="camera_' + uid + '"></div>')
        }
        let localVideoContainer = document.getElementById("camera_" + uid);
        let domLocalVideoCode = InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.setupLocalVideo(localVideoContainer);
        console.log("AudioVideoScreenRTC设置本地视频渲染位置", domLocalVideoCode);
    });
    // 他人加入频道回调
    InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.on('userJoined', (uid, elapsed) => {
        console.log(`AudioVideoScreenRTC userJoined uid ${uid}, elapsed ${elapsed}ms`);
        if (Meeting.isVideoId(uid)) {
            //用户加入
            RtcMediaUtil.onPeerOnline({"uid": uid});
        }
    });
    // 他人离开频道回调
    // 用户主动离开
    // 因过长时间收不到对方数据包，超时掉线。注意：由于 SDK 使用的是不可靠通道，也有可能对方 主动离开本方没收到对方离开消息而误判为超时掉线
    // （直播场景下）用户身份从主播切换为观众
    InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.on('userOffline', (uid, elapsed) => {
        console.log(`AudioVideoScreenRTC userOffline uid ${uid}, elapsed ${elapsed}ms`);
        //用户离开
        RtcMediaUtil.onPeerLeave({"uid": uid});
    });
    //当远端流被移除时（例如远端用户调用了 Stream.unpublish）， 停止播放该流并移除它的画面。
    // 0：用户主动离开。
    // 1：因过长时间收不到对方数据包，超时掉线。注意：由于 SDK 使用的是不可靠通道，也有可能对方主动离开本方没收到对方离开消息而误判为超时掉线。
    // 2：用户身份从主播切换为观众。
    InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.on('removeStream', (uid, reason) => {
        console.log(`AudioVideoScreenRTC removeStream: uid ${uid} -reason ${reason}`)
        //用户离开
        if (reason != 2) {
            RtcMediaUtil.onPeerLeave({"uid": uid});
        }
    });
    // 异常回调
    InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.on('error', (err, msg) => {
        console.log(`AudioVideoScreenRTC error: code ${err} - ${msg}`)
        //consoleContainer.innerHTML = `error: code ${err} - ${msg}`
    });
    // 说话回调
    InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.on('groupAudioVolumeIndication', (speakers, speakerNumber, totalVolume) => {
        //console.log(`AudioVideoScreenRTC说话回调: ${speakers} - ${speakerNumber} - ${totalVolume}`)
        RtcMediaUtil.onVolumeIndicator(speakers);
    });
    // 远端音频流状态发生改变回调
    InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.on('remoteAudioStateChanged', (uid, state, reason, elapsed) => {
        console.log(`AudioVideoScreenRTC远端音频流状态发生改变回调: ${uid} - ${state} - ${reason} - ${elapsed}`)
        if (Meeting.isVideoId(uid)) {
            if (state == 0) {
                if (reason == 3 || reason == 5 || reason == 7) {

                }
                RtcMediaUtil.onMuteAudio({"uid": uid});
            } else if (state == 1 || state == 2) {
                RtcMediaUtil.onUnmuteAUdio({"uid": uid});
            }
        }
    });
    // 远端视频流状态发生改变回调
    InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.on('remoteVideoStateChanged', (uid, state, reason, elapsed) => {
        console.log(`AudioVideoScreenRTC远端视频流状态发生改变回调: ${uid} - ${state} - ${reason} - ${elapsed}`)
        if (state == 0) {
            if (reason == 3 || reason == 5 || reason == 7) {

            }
            if (Meeting.isVideoId(uid)) {
                RtcMediaUtil.onDisableVideo({"uid": uid});
            } else if (Meeting.isScreenId(uid)) {
                RtcScreenUtil.userScreenStatusChange(uid, 0);
            }
        } else if (state == 1 || state == 2) {
            if (Meeting.isVideoId(uid)) {
                // 设置视窗内容显示模式
                InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.setupViewContentMode(uid, 1);
                // 订阅该远端用户流
                if ($("#camera_" + uid).length === 0) {
                    $("#video_user_" + uid + " .videoPeople_div").append('<div class="cameraVideo" id="camera_' + uid + '"></div>')
                }
                let remoteVideoContainer = document.getElementById("camera_" + uid);
                let domRemoteVideoCode = InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.subscribe(uid, remoteVideoContainer)
                console.log("AudioVideoScreenRTC设置远端视频渲染位置", domRemoteVideoCode);
                RtcMediaUtil.onEnableVideo({"uid": uid});
            } else if (Meeting.isScreenId(uid)) {
                RtcScreenUtil.userScreenStatusChange(uid, 1);
            }
        }
    });
    // 远端视频状态发生改变回调
    InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.on('userMuteVideo', (uid, muted) => {
        console.log(`AudioVideoScreenRTC远端视频状态发生改变回调: ${uid} - ${muted}`)
        if (muted) {
            RtcMediaUtil.onDisableVideo({"uid": uid});
        } else {
            RtcMediaUtil.onEnableVideo({"uid": uid});
        }
    });
    // 通话中每个用户的网络上下行
    InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.on('networkQuality', (uid, txquality, rxquality) => {
        console.log(`AudioVideoScreenRTC通话中每个用户的网络上下行: ${uid} - ${txquality} - ${rxquality}`);
        // 自己
        if (uid == 0 || Meeting.isScreenId(uid)) {
            if (txquality == 6 || rxquality == 6) {
                NetShooting.netWorkTips(2);
            } else if (rxquality == 4 || rxquality == 5) {
                NetShooting.netWorkTips(1);
            }
        } else {

        }
    });
    // 音视频token过期
    InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.on('tokenPrivilegeWillExpire', (token) => {
        console.log(`AudioVideoScreenRTC音视频token过期: ${token}`);
        RtcMediaUtil.onTokenPrivilegeWillExpire(1);
    });
    // 投屏token过期
    InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.on('videoSourceRequestNewToken', (token) => {
        console.log(`AudioVideoScreenRTC投屏token过期: ${token}`);
        RtcMediaUtil.onTokenPrivilegeWillExpire(2);
    });

    // 设置频道场景, 0: 通信, 1: 直播
    InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.setChannelProfile(1);
    /*if (MeetInfoUtil.isMyMeet) {
        //设置直播场景下的用户角色, 1：主播, 2：（默认）观众
        InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.setClientRole(1);
    }*/
    // 必须关主播身份
    InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.setClientRole(InjectRtcAudioVideoScreenUtil.clientRole);
    // 麦克风设备判断
    let audioDev = InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.getCurrentAudioRecordingDevice();
    if (audioDev) {
        Meeting.hasAudioDev = true;
    } else {
        Meeting.hasAudioDev = false;
    }
    // 摄像头设备判断
    let videoDev = InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.getCurrentVideoDevice();
    if (videoDev) {
        Meeting.hasVideoDev = true;
    } else {
        Meeting.hasVideoDev = false;
    }
    // 打开音频功能
    let openAudioCode = InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.enableAudio();
    console.log("AudioVideoScreenRTC打开音频功能", openAudioCode);
    // 停止发送本地音频流
    let localAudioCode = InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.muteLocalAudioStream(true);
    console.log("AudioVideoScreenRTC停止发送本地音频流", localAudioCode);
    // 启用说话者音量提示
    let volumeAudioCode = InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.enableAudioVolumeIndication(1000, 3, false);
    console.log("AudioVideoScreenRTC启用说话者音量提示", volumeAudioCode);
    // 打开视频功能
    let openVideoCode = InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.enableVideo();
    console.log("AudioVideoScreenRTC打开视频功能", openVideoCode);
    //停止本地视频采集
    let localVideoCode = InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.enableLocalVideo(false);
    console.log("AudioVideoScreenRTC停止本地视频采集", localVideoCode);
    // 停止视频预览
    let previewCode = InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.stopPreview();
    console.log("RtcAudioVideoScreen停止视频预览", previewCode);
    //打开与WebSDK的互通
    let enableWebCode = InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.enableWebSdkInteroperability(true);
    console.log("AudioVideoScreenRTC打开与WebSDK的互通", enableWebCode);

    // 加入频道
    let userIdTemp = parseInt(Meeting.login_puid);
    let joinChannelCode = InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.joinChannel(Meeting.rtc_video_token, Meeting.meet_qrcode, null, userIdTemp);
    console.log("AudioVideoScreenRTC joinChannel", joinChannelCode);
    console.log("rtc_video_token=", Meeting.rtc_video_token);
    console.log("meet_qrcode=", Meeting.meet_qrcode);
    console.log("userIdTemp=", userIdTemp);

    // 麦克风和摄像头默认开关
    var audioSet = Meeting.audioSetStatus;
    var videoSet = Meeting.videoSetStatus;
    if (audioSet == "1") {
        InjectRtcAudioVideoScreenUtil.startAudio();
    }
    if (videoSet == "1") {
        InjectRtcAudioVideoScreenUtil.startVideo();
    }

}

// 开麦克风
InjectRtcAudioVideoScreenUtil.startAudio = function () {
    //获取音频录音设备
    let devices = InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.getAudioRecordingDevices()
    if (devices.length === 0) {
        console.log('no audio found');
        return;
    }
    console.log(devices);
    // 必须开主播身份
    if (InjectRtcAudioVideoScreenUtil.clientRole == 2) {
        InjectRtcAudioVideoScreenUtil.clientRole = 1;
        InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.setClientRole(InjectRtcAudioVideoScreenUtil.clientRole);
    }
    // 开始发送本地音频流
    InjectRtcAudioVideoScreenUtil.audioStatus = 1;
    let localAudioCode = InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.muteLocalAudioStream(false);
    console.log("AudioVideoScreenRTC开始发送本地音频流", localAudioCode);
    // 判断是否在屏幕共享
    if (InjectRtcAudioVideoScreenUtil.screenStatus == 1) {
        InjectRtcAudioVideoScreenUtil.loopbackStatus = 1;
        //开始采集声卡
        let enableCode = InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.enableLoopbackRecording(true);
        console.log("开始采集声卡", enableCode);
    }
    // 页面交互-开启自己麦克风
    RtcMediaUtil.myAudioStatusChange(1);
    // 发送开启麦克风的频道消息
    let jsonMessage = {"mediaOperate": {"op": 1, "type": "audio"}};
    Meeting.rtm.channel.sendMessage({text: JSON.stringify(jsonMessage)}).then(() => {
        // 发送成功
        console.info("发送麦克风信令" + JSON.stringify(jsonMessage));
    }).catch(error => {
        // 失败重试一次
        setTimeout(function () {
            Meeting.rtm.channel.sendMessage({text: JSON.stringify(jsonMessage)});
        }, 3000);
    })
}

// 关麦克风
InjectRtcAudioVideoScreenUtil.stopAudio = function () {
    // 必须关主播身份
    if (InjectRtcAudioVideoScreenUtil.clientRole == 1) {
        // 如果摄像头和投屏关闭
        if (InjectRtcAudioVideoScreenUtil.videoStatus == 0 && InjectRtcAudioVideoScreenUtil.screenStatus == 0) {
            InjectRtcAudioVideoScreenUtil.clientRole = 2;
            InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.setClientRole(InjectRtcAudioVideoScreenUtil.clientRole);
        }
    }
    // 停止发送本地音频流
    InjectRtcAudioVideoScreenUtil.audioStatus = 0;
    let localAudioCode = InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.muteLocalAudioStream(true);
    console.log("AudioVideoScreenRTC停止发送本地音频流", localAudioCode);
    //停止采集声卡
    InjectRtcAudioVideoScreenUtil.loopbackStatus = 0;
    let enableCode = InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.enableLoopbackRecording(false);
    console.log("停止采集声卡", enableCode);
    // 页面交互-开启自己麦克风
    RtcMediaUtil.myAudioStatusChange(0);
    // 发送关闭麦克风的频道消息
    let jsonMessage = {"mediaOperate": {"op": 0, "type": "audio"}};
    Meeting.rtm.channel.sendMessage({text: JSON.stringify(jsonMessage)}).then(() => {
        // 发送成功
        console.info("发送麦克风信令" + JSON.stringify(jsonMessage));
        // Meeting.logs("发送麦克风信令"+JSON.stringify(jsonMessage));
    }).catch(error => {
        // 失败重试一次
        setTimeout(function () {
            Meeting.rtm.channel.sendMessage({text: JSON.stringify(jsonMessage)});
            Meeting.logs("发送麦克风信令失败重试一次" + JSON.stringify(jsonMessage));
        }, 3000);
    })
}

//开始采集声卡
InjectRtcAudioVideoScreenUtil.startLoopbackRecording = function () {
    //开始采集声卡
    InjectRtcAudioVideoScreenUtil.loopbackStatus = 1;
    let enableCode = InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.enableLoopbackRecording(true);
    console.log("开始采集声卡", enableCode);
}

//停止采集声卡
InjectRtcAudioVideoScreenUtil.stopLoopbackRecording = function () {
    //停止采集声卡
    InjectRtcAudioVideoScreenUtil.loopbackStatus = 0;
    let enableCode = InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.enableLoopbackRecording(false);
    console.log("停止采集声卡", enableCode);
}

// 开摄像头
InjectRtcAudioVideoScreenUtil.startVideo = function () {
    //获取音频录音设备
    let devices = InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.getVideoDevices()
    if (devices.length === 0) {
        console.log('no video found');
        return;
    }
    console.log(devices);
    // 必须开主播身份
    if (InjectRtcAudioVideoScreenUtil.clientRole == 2) {
        InjectRtcAudioVideoScreenUtil.clientRole = 1;
        InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.setClientRole(InjectRtcAudioVideoScreenUtil.clientRole);
    }
    // 开启视频预览
    let previewCode = InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.startPreview();
    console.log("RtcAudioVideoScreen开启视频预览", previewCode);
    // 开始本地视频采集
    InjectRtcAudioVideoScreenUtil.videoStatus = 1;
    let localVideoCode = InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.enableLocalVideo(true);
    console.log("AudioVideoScreenRTC开始本地视频采集", localVideoCode);
    // 页面交互-开启自己摄像头
    RtcMediaUtil.myVideoStatusChange(1);
    // 发送开启摄像头的频道消息
    let jsonMessage = {"mediaOperate": {"op": 1, "type": "video"}};
    Meeting.rtm.channel.sendMessage({text: JSON.stringify(jsonMessage)}).then(() => {
        // 发送成功
        console.info("发送摄像头信令" + JSON.stringify(jsonMessage));
        // Meeting.logs("发送摄像头信令"+JSON.stringify(jsonMessage));
    }).catch(error => {
        // 失败重试一次
        setTimeout(function () {
            Meeting.rtm.channel.sendMessage({text: JSON.stringify(jsonMessage)});
            // Meeting.logs("发送摄像头信令失败重试一次"+JSON.stringify(jsonMessage));
        }, 3000);
    })
}

// 关摄像头
InjectRtcAudioVideoScreenUtil.stopVideo = function () {
    // 必须关主播身份
    if (InjectRtcAudioVideoScreenUtil.clientRole == 1) {
        // 如果麦克风和投屏关闭
        if (InjectRtcAudioVideoScreenUtil.audioStatus == 0 && InjectRtcAudioVideoScreenUtil.screenStatus == 0) {
            InjectRtcAudioVideoScreenUtil.clientRole = 2;
            InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.setClientRole(InjectRtcAudioVideoScreenUtil.clientRole);
        }
    }
    // 停止视频预览
    let previewCode = InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.stopPreview();
    console.log("RtcAudioVideoScreen停止视频预览", previewCode);
    // 停止本地视频采集
    InjectRtcAudioVideoScreenUtil.videoStatus = 0;
    let localVideoCode = InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.enableLocalVideo(false);
    console.log("AudioVideoScreenRTC停止本地视频采集", localVideoCode);
    // 页面交互-关闭自己摄像头
    RtcMediaUtil.myVideoStatusChange(0);
    // 发送关闭摄像头的频道消息
    let jsonMessage = {"mediaOperate": {"op": 0, "type": "video"}};
    Meeting.rtm.channel.sendMessage({text: JSON.stringify(jsonMessage)}).then(() => {
        // 发送成功
        console.info("发送摄像头信令" + JSON.stringify(jsonMessage));
        // Meeting.logs("发送摄像头信令"+JSON.stringify(jsonMessage));
    }).catch(error => {
        // 失败重试一次
        setTimeout(function () {
            Meeting.rtm.channel.sendMessage({text: JSON.stringify(jsonMessage)});
            // Meeting.logs("发送摄像头信令失败重试一次"+JSON.stringify(jsonMessage));
        }, 3000);
    })
}

//更新音视频token
InjectRtcAudioVideoScreenUtil.renewAudioVideoToken = function (token) {
    let renewAudioVideoTokenCode = InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.renewToken(token)
    console.log("AudioVideoScreenRTC更新音视频token", renewAudioVideoTokenCode);
}

// 开始投屏
InjectRtcAudioVideoScreenUtil.startScreen = function () {
    //获取屏幕信息
    let displays = InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.getScreenDisplaysInfo()
    if (displays.length === 0) {
        console.log('no display found');
        return;
    }
    console.log(displays);

    // 必须开主播身份
    if (InjectRtcAudioVideoScreenUtil.clientRole == 2) {
        InjectRtcAudioVideoScreenUtil.clientRole = 1;
        InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.setClientRole(InjectRtcAudioVideoScreenUtil.clientRole);
    }
    // 状态
    InjectRtcAudioVideoScreenUtil.screenStatus = 1;
    //开始采集音频
    InjectRtcAudioVideoScreenUtil.startAudio();
    // 开始屏幕共享
    //开启第二个实例作为屏幕共享
    let initScreenCode = InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.videoSourceInitialize(Meeting.rtc_appid)
    console.log("初始化共享屏幕频道", initScreenCode);

    InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.videoSourceSetChannelProfile(1);
    InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.videoSourceEnableWebSdkInteroperability(true);
    // 加入videoSource频道
    let userIdTemp = parseInt(Meeting.getScreenPuid(Meeting.login_puid));
    let joinScreenCode = InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.videoSourceJoin(Meeting.rtc_screen_token, Meeting.meet_qrcode, null, userIdTemp)
    console.log("加入共享屏幕频道", joinScreenCode);

    // 初始化成功开启
    InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.on('videosourcejoinedsuccess', () => {
        // start screenshare
        InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.videoSourceSetVideoProfile(49, false);
        let screenCode = InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.videoSourceStartScreenCaptureByScreen(displays[0].displayId, {
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
        // 页面交互-开自己投屏
        RtcScreenUtil.myScreenStatusChange(1);
    });
}

// 停止屏幕共享
InjectRtcAudioVideoScreenUtil.stopScreen = function () {
    // 必须关主播身份
    if (InjectRtcAudioVideoScreenUtil.clientRole == 1) {
        // 如果麦克风和摄像头关闭
        if (InjectRtcAudioVideoScreenUtil.audioStatus == 0 && InjectRtcAudioVideoScreenUtil.videoStatus == 0) {
            InjectRtcAudioVideoScreenUtil.clientRole = 2;
            InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.setClientRole(InjectRtcAudioVideoScreenUtil.clientRole);
        }
    }
    InjectRtcAudioVideoScreenUtil.screenStatus = 0;
    //停止采集声卡
    InjectRtcAudioVideoScreenUtil.stopLoopbackRecording();

    let screenCode = InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.stopScreenCapture2();
    console.log("停止共享屏幕", screenCode);

    let leaveScreenCode = InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.videoSourceLeave();
    console.log("离开共享屏幕频道", leaveScreenCode);

    let releaseScreenCode = InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.videoSourceRelease();
    console.log("释放共享屏幕频道", releaseScreenCode);
    // 页面交互-开自己投屏
    RtcScreenUtil.myScreenStatusChange(0);
}

//创建投屏dom
InjectRtcAudioVideoScreenUtil.createScreenDom = function (uid) {
    console.log($("#screen_" + uid))
    // 设置视窗内容显示模式
    InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.setupViewContentMode(uid, 1);
    // 订阅该远端用户流
    if ($("#screen_" + uid).length === 0) {
        $(".videoDiv").append('<div class="shareScreen" id="screen_' + uid + '"></div>')
    }
    let remoteVideoContainer = document.getElementById("screen_" + uid);
    let domRemoteVideoCode = InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.subscribe(uid, remoteVideoContainer)
    console.log("AudioVideoScreenRTC设置远端投屏渲染位置", domRemoteVideoCode);
}

//更新投屏token
InjectRtcAudioVideoScreenUtil.renewScreenToken = function (token) {
    let renewScreenTokenCode = InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.videoSourceRenewToken(token)
    console.log("AudioVideoScreenRTC更新投屏token", renewScreenTokenCode);
}

// 关闭销毁
InjectRtcAudioVideoScreenUtil.closeAll = function () {
    // 关闭所有
    InjectRtcAudioVideoScreenUtil.stopAudio();
    InjectRtcAudioVideoScreenUtil.stopVideo();
    InjectRtcAudioVideoScreenUtil.stopScreen();
    // 离开销毁
    InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.leaveChannel();
    InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.release();
}

module.exports = InjectRtcAudioVideoScreenUtil;