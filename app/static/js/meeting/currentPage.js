var currentPage = {
    data:{
        currentPeopleNumber:0,
        allMute:false,
        navs : ['成员','聊天'],
        isShow:true,
        talkAllList:['刘小花','张小亮','刘胡兰'],
        listenPeople:[],
        ismeeting:false,
        shareStatus:0,
        res:{},
        status:'',
        userName:'',
        leader:0,

    },
    init : function(){
        var that = this;
        this.autoSize();
        this.rightInit();
        this.leftInit();
        $(window).resize(function(){
            that.autoSize()
        })
    },
    autoSize : function(){
        var winh = document.body.clientHeight || document.documentElement.clientHeight;
        $('.leftVideo,.rightList').css('height',winh);
        $('.listbox').css('height',winh - $('.topTab').outerHeight(true) - $('.iswhotalk').outerHeight(true) - $('.allMuteBox').outerHeight(true));
        //2020.09.01
//      var newWidth = $(".leftVideo").width();
//      var newHeight = $(".leftVideo").height();
//      if(newWidth/newHeight > 900/648){
//      	$(".blackboard_box").css('width',696/398 * $(".leftVideo").height() * 0.64);
//      	$(".blackboard_box").css('height',$(".leftVideo").height() * 0.64);
//      }else if(newWidth/newHeight < 900/648){
//      	$(".blackboard_box").css('height',398 * ($(".leftVideo").width() * 0.78 ) / 696);
//      	$(".blackboard_box").css('width',$(".leftVideo").width() * 0.78);
//      }
       
    },
    tabInit(){
        var str = '<ul class="rightTab">';
        for(var i = 0; i<this.data.navs.length;i++){
            if(i == 0){
                str += '<li class="active" index="'+ i +'">'+ this.data.navs[i] +'（'+ this.data.currentPeopleNumber +'）</li>'
            } else {
                str += '<li index="'+ i +'">'+ this.data.navs[i] +'</li>'
            }  
        }
        str += `</ul><span class="arrowSpan">
            <i alt="arrow" class="arrow"></i>
        </span>`;
        $('.topTab').html(str);
    },
    talkInit(){
        var str = '<span class="talkTips">正在讲话：</span><span class="talkTipsall">';
        for(var i = 0; i<this.data.talkAllList.length;i++){
            str += '<em>'+ this.data.talkAllList[i] +',</em>'
        }
        str += '</span>';
        $('.iswhotalk').html(str);
//      $('.iswhotalk').html('');
    },
    listenInit(){
//      var str = '<ul class="listenPeople">';
//      if(this.data.listenPeople.length == 0){
//          $('.listLeft').html('');
//          return;
//      }
//      for(var i = 0; i<this.data.listenPeople.length;i++){
//          if(this.data.listenPeople[i].role == 1){
//              str += '<li class="active">';
//          } else {
//              str += '<li>';
//          }
//          str += `<span class="namePhoto">${this.data.listenPeople[i].uid.slice(0,6)}</span>
//              <span class="names">
//              <p>${(this.data.listenPeople[i].un && this.data.listenPeople[i].un.length > 11) ? this.data.listenPeople[i].un.slice(0,12) + '…' : this.data.listenPeople[i].un}</p>`;
//          // if(this.data.listenPeople[i].isMobile){
//          //     str += '<i alt="phone" class="onShare"></i>'
//          // }
//          str += '</span><span class="currentState">';
//          if(this.data.listenPeople[i].share == 1){
//              str += '<i alt="phone" class="onShare"></i>'
//          }
//          if(this.data.allMute == 1 && this.data.listenPeople[i].role == 0){
//              str += '<i alt="phone" class="ontalk forbid"></i>';
//          } else if(this.data.allMute == 1 && this.data.listenPeople[i].role == 1 && this.data.listenPeople[i].mute == 0){
//              str += '<i alt="phone" class="ontalk"></i>';
//          } else if(this.data.allMute == 1 && this.data.listenPeople[i].role == 1 && this.data.listenPeople[i].mute == 1){
//              str += '<i alt="phone" class="ontalk forbid"></i>';
//          } else if(this.data.allMute == 0 && this.data.listenPeople[i].role == 0 && this.data.listenPeople[i].mute == 0){
//              str += '<i alt="phone" class="ontalk"></i>';
//          } else if(this.data.allMute == 0 && this.data.listenPeople[i].role == 0 && this.data.listenPeople[i].mute == 1){
//              str += '<i alt="phone" class="ontalk forbid"></i>';
//          } else if(this.data.allMute == 0 && this.data.listenPeople[i].role == 1 && this.data.listenPeople[i].mute == 0){
//              str += '<i alt="phone" class="ontalk"></i>';
//          } else if(this.data.allMute == 0 && this.data.listenPeople[i].role == 1 && this.data.listenPeople[i].mute == 1){
//              str += '<i alt="phone" class="ontalk forbid"></i>';
//          }
//          str += '</span></li>';
//      }
//      
//      str += '</ul>';
//      $('.listLeft').html(str);
    },
    reviewAudio(){
        var stra = '';
        if(this.data.listenPeople.length == 0){
            $('#audioDial').removeClass("forbid").removeClass("talking");
            return;
        }
        for(var j = 0; j<this.data.listenPeople.length;j++){
            if(this.data.allMute == 1 && this.data.listenPeople[j].role == 1 && this.data.listenPeople[j].un == this.data.userName && this.data.listenPeople[j].mute == 1){
                $('#audioDial').removeClass("talking").addClass("forbid");
                break;
            } else if(this.data.allMute == 1 && this.data.listenPeople[j].role == 1 && this.data.listenPeople[j].un == this.data.userName && this.data.listenPeople[j].mute == 0) {
                $('#audioDial').removeClass("talking").removeClass("forbid");
            } else if(this.data.allMute == 0 && this.data.listenPeople[j].role == 1 && this.data.listenPeople[j].un == this.data.userName && this.data.listenPeople[j].mute == 1){
                $('#audioDial').removeClass("talking").addClass("forbid");
                break;
            } else if(this.data.allMute == 0 && this.data.listenPeople[j].role == 1 && this.data.listenPeople[j].un == this.data.userName && this.data.listenPeople[j].mute == 0){
                $('#audioDial').removeClass("talking").removeClass("forbid");
                break;
            } else if(this.data.allMute == 1 && this.data.listenPeople[j].role == 0 && this.data.listenPeople[j].un == this.data.userName){
                $('#audioDial').removeClass("talking").addClass("forbid");
                break;
            } else if(this.data.allMute == 0 && this.data.listenPeople[j].role == 0 && this.data.listenPeople[j].un == this.data.userName && this.data.listenPeople[j].mute == 0){
                $('#audioDial').removeClass("talking").removeClass("forbid");
                break;
            } else if(this.data.allMute == 0 && this.data.listenPeople[j].role == 0 && this.data.listenPeople[j].un == this.data.userName && this.data.listenPeople[j].mute == 1){
                $('#audioDial').removeClass("talking").addClass("forbid");
                break;
            }
        }
//      $('#audioDial').html(stra);
        if(this.data.allMute == 1 && this.data.leader == 1){
            $('.buttonAllMute').html('取消全员静音');
        } else if(this.data.allMute == 0 && this.data.leader == 1) {
            $('.buttonAllMute').html('全员静音');
        }
        if(this.data.leader == 0){
            $('.allMuteBox').addClass("hide");
        }
        this.autoSize(); 
    },
    rightInit(){
        //this.tabInit();
        this.talkInit();
        this.listenInit();
        this.navBindEvent();
    },
    leftInit(){
//       $('.vidTitle').html('超星会议');
//      $('.vidTime').html('26:20');
    },
    talkHideInit(){
        var str = '';
        for(var i = 0; i<this.data.talkAllList.length;i++){
            str += '<em>'+ this.data.talkAllList[i] +';</em>&nbsp;&nbsp;'
        }
        $('.htalkpeople').html(str);
    },
    tabshow(){/*2020.09.28*/
        this.data.isShow = true;
        var winw = $(window).width();
        $('.rightList').css('width','300px');
        $('.htalkBox').css('top','-150px');
        $('.leftVideo').css('width','calc( 100% - 300px )');
    },
    tabhide(){/*2020.09.28*/
        $('.rightList').css('width',0);
        $('.leftVideo').css('width','100%');
       $('.htalkBox').css('top','40px');
        $('.talkNumbers').html('' + this.data.currentPeopleNumber +'');
        this.talkHideInit();
        this.data.isShow = false;
    },
    navBindEvent(){
        var that = this;
        var winh = document.body.clientHeight || document.documentElement.clientHeight;
        var buttonNow = true;
        var names = '';
        var meetid = '',leader;
        var ismute = false;
        window.addEventListener('memberState',function(e){//给window监听getMeetingPeople事件，获取进入会议的人数
            that.data.res = Object.assign({},e.detail.res);
            that.data.status = e.detail.status;
            that.data.names = e.detail.name;
            if(that.data.status == 1){// 1=成员进入；
                RKCloudVideo.error_(that.data.names + '加入会议');
            } else if(that.data.status == 2){// 2=成员退出；
                RKCloudVideo.error_(that.data.names + '退出会议');
            } else if(that.data.status == 3){//3=成员发言（取消静音）;
                RKCloudVideo.error_(that.data.names+'开启麦克风');
            } else if(that.data.status == 4 ){//4=成员静音；
                RKCloudVideo.error_(that.data.names+'关闭麦克风');
            } else if(that.data.status == 5){//5=成员关闭视频；
                RKCloudVideo.error_(that.data.names+'关闭视频');
            } else if(that.data.status == 6){//6=成员开启视频；
                RKCloudVideo.error_(that.data.names+'开启视频');
            } else if(that.data.status == 7){// 7=成员被踢出；
                RKCloudVideo.error_(that.data.names + '被踢出会议');
            } else if(that.data.status == 8){// 8=会议结束；
                RKCloudVideo.error_('会议结束');
            } else if(that.data.status == 9){// 9=会场静音；
                RKCloudVideo.error_('会场静音');
            } else if(that.data.status == 10){// 10=会场取消静音；
                RKCloudVideo.error_('会场退出静音');
            } else if(that.data.status == 11){// 11=会场关闭视频；
                RKCloudVideo.error_('会场关闭视频');
            } else if(that.data.status == 12){// 12=成员退出；
                RKCloudVideo.error_('会场开启视频');
            } else if(that.data.status == 13){//13=设置会议主持人
                RKCloudVideo.error_(that.data.names+'成为会议主持人');
            } else if(that.data.status == 14){//14=取消会议主持人；
                RKCloudVideo.error_('取消'+that.data.names +'主持人');
            } else if(that.data.status == 15){// 15=屏幕共享开启
                RKCloudVideo.error_('屏幕共享开启');
            } else if(that.data.status == 16){// 16=屏幕共享关闭
                RKCloudVideo.error_('屏幕共享关闭');
            }

           if(that.data.status == 8){
                window.location.reload();
            }
           if(that.data.status == 1 || that.data.status == 13){
            that.data.ismute = true;
           }
           if(that.data.status == 15){
                $('#videoRender').css({
                    'width':'100%',
                    'height':'100%'
                });
                $('.noShare').css({
                    'display':'none'
                });
           } else if(that.data.status == 16) {
                $('#videoRender').css({
                    'width':'0',
                    'height':'0'
                });
                $('.noShare').css({
                    'display':'flex',
                    'display':'-webkit-flex'
                });
           }
           that.data.shareStatus = that.data.res.cnfshare;
           if(that.data.res.cnfstatus == 1){
            that.data.ismeeting = true;
           } else if(that.data.res.cnfstatus == 2){
            that.data.ismeeting = false;
           }
           that.data.listenPeople = that.data.res.mbs.slice();
           that.data.currentPeopleNumber = that.data.listenPeople.length;
           that.data.allMute = that.data.res.cnfmute;
           that.data.res.mbs.forEach(function(element){
                if(element.share == 1 && element.uid != names){
                    $('#videoRender').css({
                        'width':'100%',
                        'height':'100%'
                    });
                    $('.noShare').css({
                        'display':'none'
                    });
                }
            });
           that.reviewAudio();
           that.listenInit();
           that.tabInit();
        });
        //$(window).bind('beforeunload', function(res){
        //    console.log(res);
        //    return false;
            // return '次行为会刷新页面！';
        //});

        $('.buttonAllMute').click(function(){
            if(that.data.res.cnfmute == 1){
                RKCloudVideo.meetingMute(0,function(res){
                    document.getElementById('audioRender').muted = false;
                    $('.buttonAllMute').html('全员静音');
                })
            } else {
                RKCloudVideo.meetingMute(1,function(res){
                    document.getElementById('audioRender').muted = true;
                    $('.buttonAllMute').html('取消全员静音');
                })
            }
            that.autoSize(); 
        });
        $('.teachIdent').click(function(){//2020.08.04教师结束
            $('.show-textwaring').addClass('meetingovers');
        });
        $('.stuIdent').click(function(){//2020.08.04学生结束
            $('.show-textwaring').addClass('meetingovers_stu');
        });
        $('.trusCancle').click(function(){//2020.08.07
            $('.show-textwaring').removeClass('meetingovers').removeClass('meetingovers_stu').removeClass("show-removeClass").removeClass("assisTeachOk").removeClass("muteAll");
        });
        $('.trusOvers').click(function(){//2020.07.22
            var isCloseShare = false;
            $('.show-textwaring').removeClass('meetingovers').removeClass('meetingovers_stu');
            if(leader == 1){
                RKCloudVideo.meetingClose(function(res){
                    window.location.reload();
                })
            } else {
                that.data.res.mbs.forEach(function(element){
                    if(element.share == 1 && element.uid == names){
                        isCloseShare = true;
                        
                    }
                });
                if(isCloseShare){
                    RKCloudVideo.stopScreenShare(function(res){});
                }
                RKCloudVideo.hangup(function(res){
                    window.location.reload();
                })
            }
        });
        $('.shareState').click(function(){//共享
            var isuser = false;
            that.data.res.mbs.forEach(function(element){
                if(element.share == 1 && element.uid == names){
                    RKCloudVideo.stopScreenShare(function(result){
                        $('.shareState').removeClass('lshareindex');
                        $('.noShare').css({
                            'display':'flex',
                            'display':'-webkit-flex'
                        });
                        that.data.res = Object.assign({}, result.detail.res);
                        that.data.listenPeople = that.data.res.mbs.slice();
                        that.listenInit();
                    });
                } else if(element.share == 1 && element.uid != names){
                    RKCloudVideo.error_('当前分享未结束！');
                }
                if(element.share == 1){
                    isuser = true;
                }
                
            });
            if(!isuser){
                RKCloudVideo.startScreenShare(function(res,result){
                    if(res == 0){
                        $('.shareState').addClass('lshareindex');
                        $('.noShare').css('display','none');
                        that.data.res = Object.assign({}, result.detail.res);
                        that.data.listenPeople = that.data.res.mbs.slice();
                        that.listenInit();
                    }
                });
            }
        });
        $('.topTab').on('click','li',function(){
            $(this).addClass('active').siblings().removeClass('active');
            $('.listenList').find('.listbox').eq($(this).attr('index')).css('display','block').siblings().css('display','none');
//          if($(this).attr('index') == 1){
//              $('.allMuteBox').addClass("hide");
//          } else {
//              $('.allMuteBox').removeClass("hide");
//          }
            that.autoSize();
        });
        $('.topTab').on('click','span.arrowSpan', function(){
            if(that.data.isShow){
                that.tabhide();
            } else {
                that.tabshow();
            }
        });
        //2020.09.28
        $('.control_memberState,.control_chatState').on('click',function(){
        	that.tabshow();
            $('.topTab li').eq($(this).attr('index')).addClass('active').siblings().removeClass('active');
            //2020.07.30
            $('.listenList').find('.listbox').eq($(this).attr('index')).css('display','block').siblings().css('display','none');
        });
        $('.showHide').click(function(){
            if($('.vid_control').hasClass('hides')){
                $('.vid_control').removeClass('hides');
            } else {
                $('.vid_control').addClass('hides');
            }
        });
        $('.start').click(function(){
            names = $('#username').val();
            meetid = $('#meeting').val();
            names = names.replace(/^\s+|\s+$/g);
            meetid = meetid.replace(/^\s+|\s+$/g);
            that.data.userName = names;
            leader = $('.inputList input:radio:checked').val();
            that.data.leader = leader;
            if(names != '' && meetid != ''){
                RKCloudVideo.init(meetid,names,leader,'audioRender','videoRender','meeting-cx.rongkecloud.com',
                    {
                        oninit:function(){
                            $('.mask').removeClass('isinputs');
                            if($('.inputList input:radio:checked').val() == 1){
                                $('.mobileState').find('a').attr('title','结束');
                            } else {
                                $('.mobileState').find('a').attr('title', '退出');
                            }
                            RKCloudVideo.dial(1,2,{
                                video:true,
                                audio:true
                            },function(res){});
                        },
                    }
                );
            } else {
                RKCloudVideo.error_('填写不完全');
            }
        });
        $('#audioDial').click(function(){
            that.data.listenPeople.forEach(function(item){
                if((item.role == 1 && item.un == names) || (item.role == 0 && item.un == names && that.data.allMute == 0)){
                    RKCloudVideo.mute(
                        names,//被操作者账号名称
                        item.mute == 1 ? 0 : 1,//mute状态；1----mute状态；0---unmute状态
                        '0',//0音频，1视频
                        function(res){}
                    );
                } else if(item.role == 0 && item.un == names && that.data.allMute == 1) {
                    RKCloudVideo.error_('已被静音');
                }
            });
        });
        $('.listLeft').on('click','.ontalk',function(){
            var ismute = 0;
            var sname = '';
            var index = $(this).parents('li').index();
            if(that.data.listenPeople[index].role == 0 && that.data.listenPeople[index].un == names && that.data.allMute == 1) {
                RKCloudVideo.error_('已被静音');
                return;
            }
            if(that.data.listenPeople[index].mute == 1){//静音标志
                if(leader == 1){
                    ismute = 0;
                    sname = $(this).parents('li').find('.namePhoto').html();
                } else {
                    if(names == $(this).parents('li').find('.namePhoto').html()){
                        ismute = 0;
                        sname = names;
                    } else {
                        RKCloudVideo.error_('不能操作他人');
                        return;
                    }
                }
            } else {//未静音标志
                if(leader == 1){
                    ismute = 1;
                    sname = $(this).parents('li').find('.namePhoto').html();
                } else {
                    if(names == $(this).parents('li').find('.namePhoto').html()){
                        ismute = 1;
                        sname = names;
                    } else {
                        RKCloudVideo.error_('不能操作他人');
                        return;
                    }
                }
            }
            RKCloudVideo.mute(
                sname,//被操作者账号名称
                ismute,//mute状态；1----mute状态；0---unmute状态
                '0',//0音频，1视频
                function(res){
                }
            );
        });
        //打开二维码弹窗
        $('.leftVideo').on('click','.topNaver_invitCode',function(){
        	$(".show-qr-code").addClass("iscode");
        })
        //关闭二维码弹窗
        $(document).on('click','.qrcode-close-icon',function(){
        	$(".show-qr-code").removeClass("iscode");
        })
        //复制邀请码2020.08.07
        $(document).on('click','.code-link',function(){
        	$(".show-qr-code").removeClass("iscode");
        	currentPage.errorTips("复制成功");
        })

    },
    errorTips(mes){
    	//this.errorTips("梁小爽正在共享屏幕");
    	$(".popError").remove();
	    $(".leftVideo").append('<div class="popError">'+ (mes || "")+'</div>');
        if(timer){
            clearInterval(timer);
        }
        var timer = setTimeout(function(){
            $('.popError').remove();
        },2000)
    }
}

