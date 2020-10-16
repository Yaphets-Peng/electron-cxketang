var RKCloudVideo = function(){
    var self = {
        sipServer : "",
        sipKey:'',
        audio:null,
        prefix:'',
        objs:{
            cnfid: "",
            cnflock: "0",
            cnfmute: "0",
            cnfshare: "0",
            cnfstatus: "0",
            cnfvmute: "0",
            mbs: [],
            uid: "",
            un: "",
        },
        cnfObj:{},
		hashear:false,
		extensionInstalled:false,
		quality:[
			['video-240P', 320, 240],
			['video-480P', 640, 480],
			['video-720P', 1280, 720],
			['video-1080P', 1920, 1080]
        ],
        key:'3f465948b28d6d66b953856c8a87d1b17a061d31',
        registed:false,
        timer:null,
    };
    var API_URL= {};
    var RKCloudErrorCode = {
        RK_SUCCESS: 											0,		//操作成功
        RK_FAILURE: 											1,		//操作失败
        RK_PARAMS_ERROR:										3,		// 参数错误
        RK_SDK_UNINIT:											4,		// SDK还未初始化
        RK_INVALID_USER:										5,  	//非法用户
    };
    var Error = {
        SUCCESS : 0,
        INIT_SUCCESS : 1,
        INIT_FAIL : 2
    };
    var CallState = {
        IDLE : 0,
        RING : 1,
        INCALL : 3
    };

    function parseResult(str){
        var json = JSON.parse(str);
        var result = {errcode : 0};
        if(json){
            if(json["result"]){						
                result = json;
            } else {
                var jsonResult = {};
                for(var item in json){
                    if(item == "errcode"){
                        result.errcode = json.errcode;								
                    } else if(item == "errmsg"){
                        result.errmsg = json.errmsg;
                    } else {
                        jsonResult[item] = json[item];
                    }													
                }
                result.result = jsonResult;
            }
        }
        return result;
    }
    function httpRequest(url,params,callback,method,file,progressCallback){	  
        console.log("url = " + url);
        var ajax = new XMLHttpRequest();	
        var formData = "";  
        var fileUpload;      
        if(null == ajax){
            alert("不支持的浏览器类型。");
            return;
        }
        fileUpload = null != file && file instanceof File ? true:false;
        ajax.open(null == method ? "POST" : method, url, true);
        if(!fileUpload){
            ajax.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
        } 
        if(fileUpload){
            formData = new FormData();
            formData.append("file",file);
            ajax.upload.onprogress = function(e) {
                if(null != progressCallback){
                    progressCallback(file, Math.floor(e.loaded*100/e.total));
                }	            		
            };
        }
        for(var key in params) {
            if(fileUpload){
                formData.append(key,params[key]);		
            } else {
                formData += key + "=" + encodeURIComponent((params[key] + "")/*.replace(/\n/g,"[&_&]")*/) + "&";
                
            }
        }
        ajax.send(formData);
        ajax.onload = function(result){
            if(ajax.status == 200){
                if(null != callback){
                    var result = parseResult(ajax.responseText);
                    if(result.errcode != 0){
                        RKCloudVideo.error_(RKCloudErrorCode.RK_FAILURE)
                        return;  		
                    }
                    callback(result);
                }
            }else{
                if(null != callback){
                    callback(RKCloudErrorCode.RK_FAILURE);
                }
            }
        };
        ajax.onerror = function(e){
            if(null != callback){
                callback(RKCloudErrorCode.RK_FAILURE);
            }
        };
    }
    function Base64(str) {  
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
            return String.fromCharCode('0x' + p1);
        }));
    }
    function bindEventInit(){
        self.ua.on('registered', function(){
            console.log("call event[UA] : registered");
            if(self.callback && self.callback.onregister){
                if(self.registed == false){
                    self.registed = true;
                    self.callback.onregister();
                }		
            }
        });
        self.ua.on('registrationFailed', function(){
            console.log("call event[UA] : registrationFailed");
            if(self.callback && self.callback.registrationFailed){
                self.callback.registrationFailed();
            }
        });
        self.ua.on('invite', function (incomingSession) {
            console.log("call event[UA] : invite");
            self.callState = CallState.RING;
            self.session = incomingSession;
            bindSessionEvent();
            if(self.callback && self.callback.oninvite){
                self.callback.oninvite();
            }
        });
        self.ua.on('connecting', function(){
            console.log("call event[UA] : connecting");
            if(self.callback && self.callback.connecting){
                self.callback.connecting();
            }
        });
        self.ua.on('connected', function(){
            console.log("call event[UA] : connected");
            if(self.callback && self.callback.connected){
                self.callback.connected();
            }
        });
        self.ua.on('disconnected', function(){
            console.log("call event[UA] : disconnected");
            if(self.callback && self.callback.disconnected){
                self.callback.disconnected();
            }
        });
        self.ua.on('unregistered', function(){
            console.log("call event[UA] : unregistered");
            if(self.callback && self.callback.unregistered){
                self.callback.unregistered();
            }
        });
        self.ua.on('message',function(res){
            var str = res.body;
            var names = str.split(' ');
            var status = names[names.length - 1];
            names = names[names.length - 2];
            updataArr(names,status);
        });
    }
    function bindSessionEvent(){
        self.session.on('accepted', function(res){//进入成功
            self.objs.mbs.push({
                mute: "0",
                role: self.isLeader,
                ste: "1",
                uid: self.userName,
                un: self.userName,
                share: 0,
                vmute: "0"
            });
            updataData();
        });
    }
    function getMeetingInfoUrl(){
        httpRequest(API_URL.GET_MEETINGINFO,{'room': self.meetingId},function(res){
            self.objs = Object.assign({},res.result);
            updataData();
        });
    }
    function setApi(API_PATH){
        API_URL.API_PATH = API_PATH;
        API_URL.GET_ROOM = API_PATH + "getRoom.do";//创建并获取会议信息
        API_URL.GET_MEETINGINFO = API_PATH + 'getMeetingInfo.do';//获取会议信息
        API_URL.GET_MUTEMEETING =API_PATH+ 'muteMeeting.do';//会场静音/取消静音
        API_URL.GET_MUTEMEMBERMEDIA =API_PATH+ 'muteMemberMedia.do';//音视频mute/unmute指定成员接口
        API_URL.GET_CLOSEMEETING = API_PATH+ 'closeMeeting.do';//结束会议接口
        API_URL.GET_KICKMEMBER = API_PATH + 'kickMember.do';//会议室踢出/取消踢出指定成员接口
        API_URL.GET_LOOKMEMBERVIDEO = API_PATH + 'lookMemberVideo.do';//指定/取消查看指定参与者视频
        API_URL.GET_SETSHARESTATU = API_PATH + 'setShareStatus.do';//开启和结束屏幕共享
    }
    function updataData(){
        let customEvent = new CustomEvent('memberState', {
            detail: {
                res:self.objs,
                status:self.messageStatus,
                name:self.names
            }
        })
        window.dispatchEvent(customEvent);
    }
    function updataArr(names, status){//数据更新
        var ishas = false;
        self.messageStatus = status;
        self.names = names;
        if(status == 1 ){
            if(!ishas){
                self.objs.mbs.push({
                    mute: "0",
                    role: "0",
                    ste: "1",
                    uid: names,
                    un: names,
                    share: 0,
                    vmute: "0"
                });
                updataData();
            }
            
        } else if( status == 2 || status == 7){
            self.objs.mbs.forEach(function(item,index){
                if(item.uid == names){
                    self.objs.mbs.splice(index,1);
                }
            });
            updataData();
        } else if( status == 3 ){
            self.objs.mbs.forEach(function(item,index){
                if(item.uid == names){
                    item.mute = 0;
                }
            });
            updataData();
        } else if( status == 4 ){
            self.objs.mbs.forEach(function(item,index){
                if(item.uid == names){
                    item.mute = 1;
                }
            });
            updataData();
        } else if( status == 5 ){
            self.objs.mbs.forEach(function(item,index){
                if(item.uid == names){
                    item.vmute = 0;
                }
            });
            updataData();
        } else if( status == 6 ){
            self.objs.mbs.forEach(function(item,index){
                if(item.uid == names){
                    item.vmute = 1;
                }
            });
            updataData();
        } else if( status == 8 ){
            self.objs.mbs = [];
            updataData();
        } else if( status == 9 ){
            self.objs = Object.assign({},self.objs,{
                cnfmute:1
            });
            updataData();
        } else if( status == 10 ){
            self.objs = Object.assign({},self.objs,{
                cnfmute:0
            });
            self.objs.mbs.forEach(function(item){
                item.mute = 0;
            });
            updataData();
        } else if( status == 11 ){
            self.objs = Object.assign({},self.objs,{
                cnfvmute:0
            });
            updataData();
        } else if( status == 12 ){
            self.objs = Object.assign({},self.objs,{
                cnfvmute:1
            });
            updataData();
        } else if( status == 13 ){
            self.objs.mbs.forEach(function(item,index){
                var items = Object.assign({},item);
                if(items.uid == names){
                    items.role = 1;
                    self.objs.mbs.splice(index,1);
                    self.objs.mbs.unshift(items);
                }
            });
            updataData();
        } else if( status == 14 ){
            self.objs.mbs.forEach(function(item,index){
                var items = Object.assign({},item);
                if(items.uid == names){
                    items.role = 0;
                }
            });
            updataData();
        } else if(status == 15){
            self.objs.mbs.forEach(function(item){
                if(item.uid == names){
                    item.share = 1;
                    self.objs.cnfshare = 1;
                }
            });
            if(names != self.userName){
                updataData();
            } else {
                window.dispatchEvent(new CustomEvent('openExeCallBack',{
                    detail: {
                        res:self.objs,
                        status:self.messageStatus
                    }
                }));
            }
        } else if(status == 16){
            self.objs.mbs.forEach(function(item){
                if(item.uid == names){
                    item.share = 0;
                    self.objs.cnfshare = 0;
                }
            });
            if(names != self.userName){
                updataData();
            } else {
                window.dispatchEvent(new CustomEvent('stopExeCallBack',{
                    detail: {
                        res:self.objs,
                        status:self.messageStatus
                    }
                }));
            }
        }
    }
    function createUA(){
        var configuration = {
            traceSip: true,
            uri: self.userName + "@" + self.sipServer,
            displayName: "",
            register: false,
            password: self.pwd,
            hackIpInContact: true,
        };
        return new SIP.UA(configuration);
    }
    return {
        /* 初始化
        初始化多人音视频功能，请确保Base SDK已经初始化成功，防止后面工作异常。
        无参数
        */
        init: function(meetingId, userName, isLeader, audioID, videoID, host, callback){
            self.meetingId = meetingId.replace(/^\s+|\s+$/g);//会议室id
            self.userName = userName.replace(/^\s+|\s+$/g);//用户名
            self.isLeader = isLeader;//是否是主持人,1 是，0不是
            self.audioID = document.getElementById(audioID);
            self.videoID = document.getElementById(videoID);
            setApi('https://'+host+'/3.0/');
            self.callback = callback;
            if(callback && callback.oninit){
                callback.oninit(Error.INIT_SUCCESS);
            }
        },
        error_ :function(mes){//信息提示
            if($(".leftVideo").find('.popError') == true){
                $('.popError').css('display','block').html(mes);
            } else {
                $(".leftVideo").append('<div class="popError">'+ (mes || "")+'</div>');
                if(self.timer){
                    clearInterval(self.timer);
                }
                self.timer = setTimeout(function(){
                    $('.popError').css('display','none')
                },3000)
            }
        },
        /*
        取消初始化
        */
        unInit:function(){
            self = {};
        },
        /*
        直接呼叫会议室
        callBack：会议状态回调
        meetingType  1 多人语音， 2 多人视频
        rsltype 分辨率
        */
        dial:function (meetingType, rsltype, revMediaType,callback){
            self.meetingType = meetingType;//1 多人语音， 2 多人视频
            self.rsltype = rsltype;//分辨率,暂时传值1,2,3都可以
            httpRequest(
                API_URL.GET_ROOM,
                {
                    'uname':self.userName,
                    'rsltype': self.rsltype,
                    'type':self.meetingType,
                    'room':self.meetingId
                },function(res){
                    if(res.errcode == 0){
                        self.meetingNumber = res.result.room;
                        self.prefix = res.result.prefix;
                        self.sipServer = res.result.rs + ':' + res.result.wss;
                        self.ua = createUA();//创建通讯协议
                        bindEventInit();
                        if(self.meetingType == 2){
                            RKCloudVideo.setVideoQuality();
                            if(self.isLeader == 1){
                                RKCloudVideo.videoDial(res.result.prefix+res.result.room + '_01', self.videoID, self.videoID,revMediaType, callback);
                            } else {
                                RKCloudVideo.videoDial(res.result.prefix+res.result.room + '_00', self.videoID, self.videoID,revMediaType, callback);
                            }
                        } else {
                            if(self.isLeader == 1){
                                RKCloudVideo.audioDial(res.result.prefix+res.result.room + '_01', self.audioID, self.videoID,revMediaType, callback);
                            } else {
                                RKCloudVideo.audioDial(res.result.prefix+res.result.room + '_00', self.audioID, self.videoID,revMediaType, callback);
                            }
                        }
                        if(self.session){
                            bindSessionEvent();
                        }
                    }
                }
            )
        },
        /*
        获取当前多人会议的信息对象
        无参数
        */
        getMeetingInfo:function(){
            let obj = Object.assign({},self.objs);
            delete obj.mbs;
            return obj;
        },
        /*
        获取当前参与会议参与者信息
        */
        getAttendeeInfos:function(){
            return self.objs.mbs;
        },
        muteLocal:function(options){
            self.session.mute(options);
        },
        unmuteLocal:function(options){
            self.session.mute(options);
        },
        /*
        指定某成员静音、取消静音、关闭视频、开启视频主持人可对会议室所有成员进行以上操作，会议室成员对自己进行以上操作，则destname传入自己账号即可。
        meetingId:会议室的唯一标示
        isMute：是否mute操作，YES:mute操作 NO:unmute操作
        muteType：mute类型分为音频或者视频， 1---音频，2—视频，3—All（未使用），详见RKCloudMeetingMuteType枚举值定义
        uname:指定参与者账号
        */
        mute:function(uname, mutestate, mediatype, cb){
            httpRequest(API_URL.GET_MUTEMEMBERMEDIA,{
                'ctluname':self.userName,
                'uname':uname,
                'room':self.meetingId,
                'mutestate': mutestate,
                'mediatype':mediatype
            },cb)
        },
        /*
        退出当前多人音视频
        */
        hangup:function(callback){
            self.session && self.session.terminate();
            self.session = null;
            self.objs.mbs = [];
            updataData();
            typeof callback == 'function' && callback(RKCloudErrorCode.RK_SUCCESS);
        },
        /*
        结束当前会议仅主持人调用该接口会成功
        无参数
        */
        meetingClose:function(cb){
            httpRequest(API_URL.GET_CLOSEMEETING,{
                'uname':self.userName,
                'room': self.meetingId,
            },cb);
        },
        /*
        踢出／取消踢出某参与者仅主持人调用该接口会成功
        meetingId:会议室的唯一标示
        isKick：是否踢出操作，YES:踢出操作 NO:取消踢出操作
        destname:指定参与者账号
        */
        kickOut:function(uname, kickstate, cb){
            httpRequest(API_URL.GET_KICKMEMBER,{
                'ctluname':self.userName,
                'uname':uname,
                'room': self.meetingId,
                'kickstate':kickstate,//：踢出状态；1----踢出成员；0---取消踢出
            },cb)
        },
        /*
        会场静音／取消会场静音仅主持人调用该接口会成功
        uname:支持人名字
        meetingId:会议室的唯一标示
        mutestate:1----静音；0---取消静音
        */
        meetingMute:function(mutestate, cb){
            if(self.isLeader != 1){
                RKCloudVideo.error_('只有主持人才可将全场静音');
                return;
            }
            httpRequest(API_URL.GET_MUTEMEETING,{
                'uname':self.userName,
                'room':self.meetingId,
                'mutestate': mutestate
            },cb)
        },
		//视频调用
		videoDial:function (callee, localRender, remoteRender, revMediaType, callback) {
			var options = {
                media: {
                    constraints: {
                        audio: true,
                        video: {
                            mandatory: {
                                maxWidth: self.vw,
                                maxHeight: self.vh,
                                minWidth: self.vw,
                                minHeight: self.vh
                            }
                          },
                    },
                    render: {
                        local: localRender || null,
                        remote: remoteRender
                    }
                },
                RTCConstraints:{ 
                    offerToReceiveVideo:revMediaType.video || true,
                    offerToReceiveAudio:revMediaType.audio || true
                }
            };
            self.session = self.ua.invite("sip:" + callee + '@'+self.sipServer, options);
            setTimeout(function(){
                typeof callback == 'function' && callback()
            },500)
		},
        // 音频调用
        audioDial: function (callee, localRender, remoteRender, revMediaType, callback) {
            var options = {
                media: {
                    constraints: {
                        audio: true,
                        video: false,
                    },
                    render: {
                        local: null,
                        audio:localRender,
                        video:remoteRender,
                        remote: null
                    }
                },
                RTCConstraints:{ 
                    offerToReceiveVideo:revMediaType.video || false,
                    offerToReceiveAudio:revMediaType.audio || true
                }
            };
            self.session = self.ua.invite("sip:" + callee + '@'+self.sipServer, options);
            getMeetingInfoUrl();
            setTimeout(function(){
                typeof callback == 'function' && callback()
            },500)
		},
        /*
        指定/取消查看单人视频仅主持人调用该接口会成功
        ctluname：操作者账号名称
  		uname: 被操作者账号名称
		room:入口会议室号码，由业务层创建，后台会根据相同的room 产生相同的meeting_id 
		lookstate：查看状态；1----查看；0---取消查看
        */
        lookVideo:function(uname, lookstate, cb){
            httpRequest(API_URL.GET_LOOKMEMBERVIDEO,{
                'ctluname':self.userName,
				'uname':uname,
				'lookstate':lookstate,
                'room': self.meetingId,
            },cb)
        },
        getDevices:function(cb){
            var audioinput = [];
            var videoinput = [];
            var audiooutput = [];
            navigator.mediaDevices.enumerateDevices().then(function(devices) {
                for (var i = 0; i < devices.length; i++) {
                    if (devices[i].kind === 'audioinput') {
                        audioinput.push(devices[i]);
                    } else if (devices[i].kind === 'videoinput') {
                        videoinput.push(devices[i]);
                    } else if (devices[i].kind === 'audiooutput')  {
                        audiooutput.push(devices[i]);
                    } else {
                        error_('Device type ' + devices[i].kind + ' not recognized, ' +
                                'cannot enumerate device. Currently only device types' +
                                '\'audio\' and \'video\' are supported');
                        //updateGetUserMediaConstraints();
                    }
                }
                self.dev = Object.assign({},{'audioinput':audioinput,'videoinput':videoinput,'audiooutput':audiooutput});
                typeof cb == 'function' && cb(self.dev);
            });
        },
		/*
        设置或切换摄像头接口，在dial前调用作用为设置，发起会议时使用的摄像头，在会议进行中调用该接口，可进行前后摄像头的切换。 mobile
            0 - 后置摄像头；1 - 前置摄像头
        */
	   setCamera:function(cameraId){
            return self.dev['videoinput'][cameraId].deviceId;
       },
	   /*
	   设置视频会议本端上传视频的视频质量接口（dial接口调用前需要调用本接口）

	   */
	   	setVideoQuality:function(rsltype){
            self.rsltype = rsltype;
			self.vw = self.quality[self.rsltype][1];
            self.vh = self.quality[self.rsltype][2];
            self.videoID.width="100%";
            self.videoID.height="100%";
		},
		 /*
		开启和结束屏幕共享
		uname: 共享者账号
		status: 开启：1 or 结束：0
		leave: 是否退出，1 退出，0 不退出
		room:入口会议室号码
	   */
        startScreenShare:function(cb){
            var info = {
                "userId":self.userName+"_2020",
                "roomId":self.meetingId,
                "apiHost":API_URL.API_PATH
            };
            var fail = false;
            window.open("rkMeetingScreenShare://" + Base64(JSON.stringify(info)),'_blank');
            window.addEventListener('openExeCallBack',function(res){
                fail = true;
                typeof cb == 'function' && cb(RKCloudErrorCode.RK_SUCCESS,res);
            });
            setTimeout(function(){
                if(!fail){
                    typeof cb == 'function' && cb(RKCloudErrorCode.RK_FAILURE);
                }
            },4000);

        },
        stopScreenShare:function (cb) {
            httpRequest(API_URL.GET_SETSHARESTATU,{
                'uname':self.userName+"_2020",
                'status':0,
                'leave':1,
                'room': self.meetingId,
            },function(res){

            });
            window.addEventListener('stopExeCallBack',function(res){
                typeof cb == 'function' && cb(res);
            });
		}
    }
}();
