//注入js
var InjectRtcAudioVideoScreenUtil = {
    isTest: false,//是否测试
    AudioVideoScreenRTC: null,//rtc实例
    RendererProcessHelper: null,//ipc通信实例
    ipcRendererCallback : null,//ipc回调方法,主线程与本窗口通信
    sdkLogPath: null,//日志路径
    clientRole: 2,//直播场景下的用户角色, 1：主播, 2：（默认）观众
    audioStatus: 0,//麦克风0：关闭，1：开启
    videoStatus: 0,//视频0：关闭，1：开启
    loopbackStatus: 0,//声卡采集0：关闭，1：开启
    screenStatus: 0,//屏幕共享0：关闭，1：开启
    videoConfig: {
        width: 320,
        height: 180,
        bitrate: 0,
        frameRate: 15
    },//视频配置
    screenConfig: {
        width: 1280,
        height: 720,
        bitrate: 0,
        frameRate: 15,
        captureMouseCursor: true,
        windowFocus: false
    },//投屏配置
    screenToolsChannel:"screenTools",//投屏ipc通信频道,控制打开顶部工具栏-和主线程通讯
    meetToolsFormMainChannel:"meetToolsFormMain",//会议ipc通信频道,接收顶部工具栏开关按钮-主线程通讯自己
}

/*InjectRtcAudioVideoScreenUtil.init = function () {

}*/

// 发送成员数量-页面调用
InjectRtcAudioVideoScreenUtil.sendMembersNumber = function (num) {
    if (InjectRtcAudioVideoScreenUtil.RendererProcessHelper) {
        let messageTemp = {
            "cmd": "membersNumber",
            "num": num
        };
        InjectRtcAudioVideoScreenUtil.RendererProcessHelper.sendToMainProcess(InjectRtcAudioVideoScreenUtil.screenToolsChannel, messageTemp);
    }
}

// 发送互动消息数量-页面调用
InjectRtcAudioVideoScreenUtil.sendChatNumber = function (num) {
    if (InjectRtcAudioVideoScreenUtil.RendererProcessHelper) {
        let messageTemp = {
            "cmd": "chatNumber",
            "num": num
        };
        InjectRtcAudioVideoScreenUtil.RendererProcessHelper.sendToMainProcess(InjectRtcAudioVideoScreenUtil.screenToolsChannel, messageTemp);
    }
}

// 发送自己说话回调-页面调用
InjectRtcAudioVideoScreenUtil.sendAudioVolume = function (status) {
    // 说话回调
    if (InjectRtcAudioVideoScreenUtil.RendererProcessHelper) {
        let messageTemp = {
            "cmd": "audioVolume",
            "status": status
        };
        InjectRtcAudioVideoScreenUtil.RendererProcessHelper.sendToMainProcess(InjectRtcAudioVideoScreenUtil.screenToolsChannel, messageTemp);
    }
}

// 发送录制状态-页面调用
InjectRtcAudioVideoScreenUtil.sendRecordingStatus = function (status, msg) {
    // 说话回调
    if (InjectRtcAudioVideoScreenUtil.RendererProcessHelper) {
        let messageTemp = {
            "cmd": "recordingStatus",
            "status": status,
            "msg": msg
        };
        InjectRtcAudioVideoScreenUtil.RendererProcessHelper.sendToMainProcess(InjectRtcAudioVideoScreenUtil.screenToolsChannel, messageTemp);
    }
}

// 更新页面-页面调用
InjectRtcAudioVideoScreenUtil.sendChangeMeetWindow = function (windowWidth,windowHeight) {
    if (!windowWidth || !windowHeight) {
        return;
    }
    // 说话回调
    if (InjectRtcAudioVideoScreenUtil.RendererProcessHelper) {
        let messageTemp = {
            "cmd": "changeMeetWindowSize",
            "windowWidth": windowWidth,
            "windowHeight": windowHeight,
        };
        InjectRtcAudioVideoScreenUtil.RendererProcessHelper.sendToMainProcess(InjectRtcAudioVideoScreenUtil.screenToolsChannel, messageTemp);
    }
}

// 发送执行方法函数-页面调用
InjectRtcAudioVideoScreenUtil.sendFunToToolsWindow = function (fun) {
    if (typeof fun !== "function") {
        return;
    }
    // 方法回调
    if (InjectRtcAudioVideoScreenUtil.RendererProcessHelper) {
        let messageTemp = {
            "cmd": "execfunction",
            "fun": fun
        };
        InjectRtcAudioVideoScreenUtil.RendererProcessHelper.sendToMainProcess(InjectRtcAudioVideoScreenUtil.screenToolsChannel, messageTemp);
    }
}

// ipc回调事件
InjectRtcAudioVideoScreenUtil.ipcRendererCallback = function (args, sys) {
    if (!args || !args.cmd) {
        return;
    }
    console.log("[InjectRtcAudioVideoScreenUtil][_meetToolsFormMain_]收到投屏指令信号 指令 " + JSON.stringify(args));
    if ("stopScreen" == args.cmd) {
        // 停止投屏
        RtcScreenUtil.stopShareScreen();
    } else if ("openMember" == args.cmd) {
        // 打开成员
        Meeting.showMemTab();
        InjectRtcAudioVideoScreenUtil.sendChangeMeetWindow(RtcScreenUtil.shareWindowWidth, RtcScreenUtil.shareWindowHeight);
    } else if ("openChar" == args.cmd) {
        // 打开互动
        Meeting.showChatTab();
        InjectRtcAudioVideoScreenUtil.sendChangeMeetWindow(RtcScreenUtil.shareWindowWidth, RtcScreenUtil.shareWindowHeight);
    } else if ("openAudio" == args.cmd) {
        // 打开麦克风
        Meeting.openAudio();
    } else if ("closeAudio" == args.cmd) {
        // 关闭麦克风
        Meeting.closeAudio();
    } else if ("openCamera" == args.cmd) {
        // 打开视频
        Meeting.openCamera();
    } else if ("closeCamera" == args.cmd) {
        // 关闭视频
        Meeting.closeCamera();
    } else if ("openRecord" == args.cmd) {
        // 打开录制
        Meeting.openRecord();
    } else if ("closeRecord" == args.cmd) {
        // 关闭录制
        Meeting.closeRecord();
    } else if ("toggleAllowSet" == args.cmd) {
        //设置加入权限
        let statusTemp = args.status || 0;
        // 切换课堂开放设置
        Meeting.toggleAllowSet(statusTemp);
    } else if ("execfunction" == args.cmd) {
        // 执行函数
        let funTemp = args.fun || "";
        if (typeof funTemp === "function") {
            funTemp();
        }
    }
}

// 开始加入频道
InjectRtcAudioVideoScreenUtil.init = function () {
    if (Meeting.videoConfig) {
        InjectRtcAudioVideoScreenUtil.videoConfig = Meeting.videoConfig;
    }
    console.log("videoConfig=", InjectRtcAudioVideoScreenUtil.videoConfig);
    if (Meeting.screenConfig) {
        InjectRtcAudioVideoScreenUtil.screenConfig = Meeting.screenConfig;
    }
    console.log("screenConfig=", InjectRtcAudioVideoScreenUtil.screenConfig);
    
    console.log("sdkLogPath=", InjectRtcAudioVideoScreenUtil.sdkLogPath);
    // 开始加入频道
    InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC = new AgoraRtcEngine();
    InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.initialize(Meeting.rtc_appid);
    console.log("rtc_appid=", Meeting.rtc_appid);

    // 设置日志文件
    InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.setLogFile(InjectRtcAudioVideoScreenUtil.sdkLogPath);
    // 开发设置2020-11-03
    //InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.setParameters("{\"che.audio.start_debug_recording\":\"NoName\"}");
    // 禁止修改码率
    // let parametersCode = InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.setParameters("{\"che.video.enableAutoVideoResize\":0}");
    // console.log("parameters=", parametersCode)

    // 加入频道回调
    InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.on('joinedChannel', (channel, uid, elapsed) => {
        console.log(`AudioVideoScreenRTC joined Screen channel ${channel} with uid ${uid}, elapsed ${elapsed}ms`);
        if ($("#camera_" + uid).length === 0) {
            $("#video_user_" + uid + " .videoPeople_div").append('<div class="cameraVideo" id="camera_' + uid + '"></div>')
        }
        let localVideoContainer = document.getElementById("camera_" + uid);
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
    // 设置音频场景
    let audioProfileCode = InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.setAudioProfile(0, 2);
    console.log("AudioVideoScreenRTC设置音频场景", audioProfileCode);
    // 停止发送本地音频流
    let localAudioCode = InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.muteLocalAudioStream(true);
    console.log("AudioVideoScreenRTC停止发送本地音频流", localAudioCode);
    // 启用说话者音量提示
    let volumeAudioCode = InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.enableAudioVolumeIndication(1000, 3, false);
    console.log("AudioVideoScreenRTC启用说话者音量提示", volumeAudioCode);
    // 设置视频编码
    let videoConfigCode = InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.setVideoEncoderConfiguration(InjectRtcAudioVideoScreenUtil.videoConfig);
    console.log("AudioVideoScreenRTC设置videoConfig", videoConfigCode);
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
    let audioSet = Meeting.audioSetStatus;
    let videoSet = Meeting.videoSetStatus;
    if (audioSet == "1") {
        InjectRtcAudioVideoScreenUtil.startAudio();
    }
    if (videoSet == "1") {
        InjectRtcAudioVideoScreenUtil.startVideo();
    }
    // 开始接收ipc回调事件
    if (InjectRtcAudioVideoScreenUtil.RendererProcessHelper) {
        InjectRtcAudioVideoScreenUtil.RendererProcessHelper.registeCallback(InjectRtcAudioVideoScreenUtil.meetToolsFormMainChannel, InjectRtcAudioVideoScreenUtil.ipcRendererCallback);
    }
    // 测试
    InjectRtcAudioVideoScreenUtil.testScreenTools();
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
    // 开启音频
    if (InjectRtcAudioVideoScreenUtil.RendererProcessHelper) {
        let messageTemp = {
            "cmd": "openAudio"
        };
        InjectRtcAudioVideoScreenUtil.RendererProcessHelper.sendToMainProcess(InjectRtcAudioVideoScreenUtil.screenToolsChannel, messageTemp);
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
    // 关闭音频
    if (InjectRtcAudioVideoScreenUtil.RendererProcessHelper) {
        let messageTemp = {
            "cmd": "closeAudio"
        };
        InjectRtcAudioVideoScreenUtil.RendererProcessHelper.sendToMainProcess(InjectRtcAudioVideoScreenUtil.screenToolsChannel, messageTemp);
    }
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
        // 处理麦克风
        if (InjectRtcAudioVideoScreenUtil.audioStatus == 0) {
            let localAudioCode = InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.muteLocalAudioStream(true);
            console.log("AudioVideoScreenRTC停止发送本地音频流", localAudioCode);
        } else {
            let localAudioCode = InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.muteLocalAudioStream(false);
            console.log("AudioVideoScreenRTC开始发送本地音频流", localAudioCode);
        }
    }
    // 开启视频预览
    let previewCode = InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.startPreview();
    console.log("RtcAudioVideoScreen开启视频预览", previewCode);
    // 开始本地视频采集
    InjectRtcAudioVideoScreenUtil.videoStatus = 1;
    let localVideoCode = InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.enableLocalVideo(true);
    console.log("AudioVideoScreenRTC开始本地视频采集", localVideoCode);
    // 开启视频
    if (InjectRtcAudioVideoScreenUtil.RendererProcessHelper) {
        let messageTemp = {
            "cmd": "openVideo"
        };
        InjectRtcAudioVideoScreenUtil.RendererProcessHelper.sendToMainProcess(InjectRtcAudioVideoScreenUtil.screenToolsChannel, messageTemp);
    }
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
    // 关闭视频
    if (InjectRtcAudioVideoScreenUtil.RendererProcessHelper) {
        let messageTemp = {
            "cmd": "closeVideo"
        };
        InjectRtcAudioVideoScreenUtil.RendererProcessHelper.sendToMainProcess(InjectRtcAudioVideoScreenUtil.screenToolsChannel, messageTemp);
    }
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
        // 选择当前第一个屏幕
        let displayScreen = displays[0];
        // start screenshare
        InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.videoSourceSetVideoProfile(49, false);
        let screenCode = InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.videoSourceStartScreenCaptureByScreen(displayScreen.displayId, {
            x: 0, y: 0, width: 0, height: 0
        }, InjectRtcAudioVideoScreenUtil.screenConfig);
        console.log("开始共享屏幕", screenCode);
        // 打开屏幕框
        if (InjectRtcAudioVideoScreenUtil.RendererProcessHelper) {
            let winHeightTemp = displayScreen.height;
            let winWidthTemp = displayScreen.width;
            let messageTemp = {
                "cmd": "startScreen",//指令
                "useLocalTools": Meeting.useLocalTools || 1,//是否使用本地1或0
                "language": window.i18.language||"language",//语言language中文,1英文
                "hasAudioDev": Meeting.hasAudioDev || false,//语音设备true或false
                "hasVideoDev": Meeting.hasVideoDev || false,//视频设备true或false
                "audioSetStatus": InjectRtcAudioVideoScreenUtil.audioStatus || 0,//语音状态1或0
                "videoSetStatus": InjectRtcAudioVideoScreenUtil.videoStatus || 0,//视频状态1或0
                "recordSetStatus": Meeting.recordStatus || 0,//录制状态1或0
                "isPublic": Meeting.isPublic || 0,//课堂是否开放1或0
                "meetTime": Meeting.meetTime || new Date().getTime,//会议开始时间
                "membersNumber": Meeting.onlineMemberCount || 0,//成员数量
                "chatNumber": Meeting.unreadMsgCount || 0,//未读消息数
                "shareWindowWidth": RtcScreenUtil.shareWindowWidth || 300,//会议屏幕共享后宽
                "shareWindowHeight": RtcScreenUtil.shareWindowHeight || 640,//会议屏幕共享后高
                "width": winWidthTemp,//会议屏幕共享后工具栏宽-即屏幕宽
                "height": winHeightTemp//会议屏幕共享后工具栏高-即屏幕高
            };
            InjectRtcAudioVideoScreenUtil.RendererProcessHelper.sendToMainProcess(InjectRtcAudioVideoScreenUtil.screenToolsChannel,messageTemp);
        }
        // 页面交互-开页面缩小
        RtcScreenUtil.changeWindowShareStyle(1);
        // 页面交互-打开成员
        Meeting.showMemTab();
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
    // 关闭屏幕框
    if (InjectRtcAudioVideoScreenUtil.RendererProcessHelper) {
        let messageTemp = {
            "cmd": "stopScreen"
        };
        InjectRtcAudioVideoScreenUtil.RendererProcessHelper.sendToMainProcess(InjectRtcAudioVideoScreenUtil.screenToolsChannel, messageTemp);
    }
    // 页面交互-关页面缩小
    RtcScreenUtil.changeWindowShareStyle(0);
    // 页面交互-关自己投屏
    RtcScreenUtil.myScreenStatusChange(0);
}

//创建投屏dom
InjectRtcAudioVideoScreenUtil.createScreenDom = function (uid) {
    // 设置视窗内容显示模式
    InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.setupViewContentMode(uid, 1);
    // 订阅该远端用户流
    if ($("#screen_" + uid).length === 0) {
        $(".videoDiv").append('<div class="shareScreen" id="screen_' + uid + '"></div>')
    }
    let remoteVideoContainer = document.getElementById("screen_" + uid);
    let domRemoteVideoCode = InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.subscribe(uid, remoteVideoContainer);
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

// 测试方法
InjectRtcAudioVideoScreenUtil.testScreenTools = function () {
    if (!InjectRtcAudioVideoScreenUtil.isTest) {
        return;
    }
    // 关闭所有
    InjectRtcAudioVideoScreenUtil.stopAudio();
    InjectRtcAudioVideoScreenUtil.stopVideo();
    InjectRtcAudioVideoScreenUtil.stopScreen();
    //获取屏幕信息
    let displays = InjectRtcAudioVideoScreenUtil.AudioVideoScreenRTC.getScreenDisplaysInfo()
    if (displays.length === 0) {
        console.log('no display found');
        return;
    }
    console.log(displays);
    // 选择当前第一个屏幕
    let displayScreen = displays[0];
    // 打开屏幕框
    if (InjectRtcAudioVideoScreenUtil.RendererProcessHelper) {
        let winHeightTemp = displayScreen.height;
        let winWidthTemp = displayScreen.width;
        let messageTemp = {
            "cmd": "startScreen",//指令
            "useLocalTools": Meeting.useLocalTools || 1,//是否使用本地1或0
            "language": window.i18.language || "language",//语言language中文,1英文
            "hasAudioDev": Meeting.hasAudioDev || false,//语音设备true或false
            "hasVideoDev": Meeting.hasVideoDev || false,//视频设备true或false
            "audioSetStatus": InjectRtcAudioVideoScreenUtil.audioStatus || 0,//语音状态1或0
            "videoSetStatus": InjectRtcAudioVideoScreenUtil.videoStatus || 0,//视频状态1或0
            "recordSetStatus": Meeting.recordStatus || 0,//录制状态1或0
            "isPublic": Meeting.isPublic || 0,//课堂是否开放1或0
            "meetTime": Meeting.meetTime || new Date().getTime,//会议开始时间
            "membersNumber": Meeting.onlineMemberCount || 0,//成员数量
            "chatNumber": Meeting.unreadMsgCount || 0,//未读消息数
            "shareWindowWidth": RtcScreenUtil.shareWindowWidth || 300,//会议屏幕共享后宽
            "shareWindowHeight": RtcScreenUtil.shareWindowHeight || 640,//会议屏幕共享后高
            "width": winWidthTemp,//会议屏幕共享后工具栏宽-即屏幕宽
            "height": winHeightTemp//会议屏幕共享后工具栏高-即屏幕高
        };
        InjectRtcAudioVideoScreenUtil.RendererProcessHelper.sendToMainProcess(InjectRtcAudioVideoScreenUtil.screenToolsChannel, messageTemp);
    }
}

module.exports = InjectRtcAudioVideoScreenUtil;