var RtmUtil = {
    RTM: null,//rtm实例
    channel: null,//频道
    messageBody: {
        muteAudioAll: "muteAudioAll",				//全员禁言
        unmuteAudioAll: "unmuteAudioAll",			//解除全员禁言
        muteAudioPeer: "muteAudioPeer",			//单人禁言
        unmuteAudioPeer: "unmuteAudioPeer",		// 请求开启某人麦克风
        muteVideoPeer: "muteVideoPeer",			// 关闭某人视频
        unmuteVideoPeer: "unmuteVideoPeer",		// 请求开启某人视频	
        master_endMeeting: "master_endMeeting",	//主持人结束会议
        kickPeer: "kickPeer",						//踢人
        setTeacher: "setTeacher",					//设置共建教师		{"setTeacher": {"op": 0,"memberPuid": 45874549,"operator": 65551655}}
        userDevStatus: "userDevStatus",			//用户设备开启状态 {"userDevStatus": {"videoStatus": 0,"audioStatus": 0}}
        mediaOperate: "mediaOperate"				//音视频设备的开关操作{"mediaOperate":{"op": 0,"type": "audio"}}
    }
}


// 开始加入频道
RtmUtil.joinRTM = function () {
    RtmUtil.RTM = AgoraRTM.createInstance(MeetInfoUtil.meetTokens.rtc_appid, {logFilter: AgoraRTM.LOG_FILTER_ERROR});
    // 登录
    RtmUtil.RTM.login({"token": MeetInfoUtil.meetTokens.rtm_video_token, uid: AgaroUserUtil.userId + ""}).then(() => {
        console.log('AgoraRTM client login success');
    }).catch(err => {
        console.log('AgoraRTM client login failure', err);
    });
    // 创建频道
    RtmUtil.channel = RtmUtil.RTM.createChannel(MeetInfoUtil.meetQrcord);

    // 监听状态
    RtmUtil.RTM.on('ConnectionStateChanged', (newState, reason) => {
        console.log('RTM on connection state changed to ' + newState + ' reason: ' + reason);
        if (reason == 'REMOTE_LOGIN') {
            console.log("已在其他设备加入课堂，当前设备将被移出");
            return;
        }
        RtmUtil.channel.join().then(() => {
            console.info("加入频道【" + MeetInfoUtil.meetQrcord + "】成功 success");
        }).catch(error => {
            console.info("加入频道失败", error);
        });
    });
}

// 离开频道
RtmUtil.leaveRTM = function () {
    RtmUtil.RTM.logout();
}
module.exports = RtmUtil;