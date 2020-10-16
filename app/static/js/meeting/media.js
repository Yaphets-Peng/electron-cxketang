/**
 * 附件多媒体播放支持，包括音频、视频、录音和直播等
 * 依赖于脚本attachment_util_new.js
 */
window.videoPlayer = undefined;
//标记播放器是否在使用中，供直播使用--直播未开始时点击后会定时刷新状态直到直播开始了，此时如果视频播放器没有在使用中将直接开始播放
window.videoPlayerOpened = false;
window.musicPlayer = undefined;
window.mediaDefaultErrorMsg = "暂时无法播放，请稍后再试。。。";//云存储多媒体默认错误提示信息
window.defaultErrorMsg = "没有对应下载地址";//云存储非多媒体默认错误提示信息
window.__isFirst = true;//标记是否是第一次云存储非多媒体文件下载，第一次是构造iframe不应该提示
window.loadedMediaMap = new Map(); // 存储已经加载过的资源
$(document).ready(function(){
	/*
	 * @descr 多媒体附件的处理共分四种情况来处理：
	 * 		1.视频-弹出框播放；--支持点击播放时才去获取音频地址
	 * 		2.音频-播放器列表播放，初次生成播放器时加载所有的音频，异步加载而来的页面内音频需要点击加载到播放器列表并直接播放；--支持播放器列表内点击播放时才去获取音频地址
	 * 		3.录音-原地播放，只有播放和暂停状态两种；--支持点击播放时才去获取录音文件地址（暂时使用音乐播放器播放）
	 * 		4.其他-能下载直接隐式下载,不能下载提示--支持点击时才去获取文件下载地址
	*/
	$(".mediaArea").on("click",".Mtion-con a.cdft[cdft]",function(event){
		event.stopPropagation();
		var $this = $(this);
		var url = $.trim($this.attr("url")||"");
		var cdft = $.trim($this.attr("cdft")||"");
		//异步获取附件文件地址
		var mediaErrorMsg = window.defaultErrorMsg;
		if(cdft == "audio" || cdft == "video"){
			mediaErrorMsg = window.mediaDefaultErrorMsg;
		}
		if(url==""&&cdft!="audio"){//非音频获取下载地址
			$.ajax({
				url:"/pc/files/status/"+($this.attr("resid")||""),
				data:{isMedia:cdft=="video"},
				type:"get",
				async:false,
				success:function(backData){
					if(backData&&backData["status"]&&backData["status"]==true){
						if(cdft=="video"){//视频拿url来播放
							url = backData["url"]||"";
							$this.attr("url",url);							
						}/*else if(cdft=="voice"){//录音拿url来播放--暂时使用音乐播放器播放
							url = backData["url"]||"";
							$this.attr("url",url);
						}*/else{//其他拿download来下载
							url = backData["download"]||"";
							$this.attr("url",url);
						}
					}else{
						if(backData && backData["msg"] && (backData["msg"]||"") != ""){
							mediaErrorMsg = backData["msg"];
						}
					}
				}/*,
				error:function(xhr){
					alert("网络异常或者服务异常，请求超时，请稍后重试");
				}*/
			});
			if(url==""){
				alert(mediaErrorMsg);
				return false;
			}
		}
		//在线预览或者下载附件文件
		if(cdft=="video"){//视频
			if(videoPlayer&&videoPlayer.vars&&videoPlayer.vars.video&&videoPlayer.vars.video==encodeURIComponent(url)){//如果视频存在且已经加载了，直接播放即可
//				console.log("play");
				videoPlayer.videoPlay();
			}else{
//				console.log("init");
				var videoObject = {
					playerID:'ckplayer01',//播放器ID，第一个字符不能是数字，用来在使用多个播放器时监听到的函数将在所有参数最后添加一个参数用来获取播放器的内容
					container: '#video', //容器的ID或className
					//variable: 'player', //播放函数名称
					//loaded: 'loadedHandler', //当播放器加载后执行的函数
					//loop: true, //播放结束是否循环播放
					autoplay: true, //是否自动播放
					//duration: 500, //设置视频总时间
					config: '', //指定配置函数
					flashplayer: false, //强制使用flashplayer
					drag: 'start', //拖动的属性
					seek: 0, //默认跳转的时间
					video: url //视频地址
				};
				videoPlayer = new ckplayer(videoObject);
			}
			easyDialog.open({
			    container : 'videoDiv',
			    noFn : true,
			    drag:true
			});
			window.videoPlayerOpened = true;
			//空间iframe兼容
			if(parent && parent.window && parent.window!=window && $this){
				$("#videoDiv").css("top",$(parent.window).scrollTop()-$("#videoDiv").parent().offset().top-50+($(parent.window).height()-parseInt($("#videoDiv").css("height").replace("\\w*","")))/2);
			}
		}else if(cdft=="audio"){//音频
			if(musicPlayer){
				var exists = false;
				for(i in musicPlayer.musicList){
					if(musicPlayer.musicList[i]["resid"]==$this.attr("resid")){
						exists = true;
						break;
					}
				}
				if(!exists){
					var $htTit = $this.find(".Ht-tit");
					var title = $htTit.text();
					if(($this.attr("voice")||"")=="voice"){
						title = "录音-"+title;
					}
					musicPlayer.addMusic({resid:$this.attr("resid"),title:title,src:url});
				}
				musicPlayer.play($this.attr("resid"));
				//空间iframe兼容
				if(parent && parent.window && parent.window != window){
					$("#audioDiv").css("top",$(parent.window).scrollTop()-$("#audioDiv").parent().offset().top-50+$(parent.window).height()-parseInt($("#audioDiv").css("height").replace("\\w*","")));
					//$("#audioDiv").css("position","absolute").css("top",$(parent.window).scrollTop()-50+$(parent.window).height()-$("#audioDiv").height());
				}
				$("#audioDiv").show();
			}else{
				var musicList = new Array();
				var defaultIdx = 0;
				$(".mediaArea .Mtion-con>a.cdft[cdft='audio']").each(function(ind){
					var tmpUrl = $.trim($(this).attr("url")||"");
					var $htTit = $(this).find(".Ht-tit");
					var title = $htTit.text();
					if(($(this).attr("voice")||"")=="voice"){
						title = "录音-"+title;
					}
					musicList.push({resid:$(this).attr("resid"),title:title,src:tmpUrl});
					if($.trim($(this).attr("resid")||"")==$.trim($this.attr("resid")||"")){
						defaultIdx = ind;
					}
				});
				musicPlayer = new SMusic({
			        musicList : musicList,
			        autoPlay  : true,  //是否自动播放
			        defaultIndex :defaultIdx,//默认为选中
			        defaultMode : 1,   //默认播放模式，列表模式
			        callback:function(thisPlayer,curMusic){
			        	var $musicListDiv = $(thisPlayer.musicDom.listWrap);
			        	var $scrollToContainer = $musicListDiv.find("[musicresid='"+curMusic["resid"]+"']");
			        	$musicListDiv.animate({
			            	scrollTop: $scrollToContainer.offset().top - $musicListDiv.offset().top + $musicListDiv.scrollTop()
			            }, 1000);//2秒滑动到指定位置
			        },
			        loadMusic:function(thisPlayer,curMusic){//歌曲不在时，开始加载
			        	var loaded = false;
			        	if($.trim(curMusic["resid"]||"")!=""){
				        	$.ajax({
								url:"/pc/files/status/"+(curMusic["resid"]||""),
								data:{isMedia:true},
								type:"get",
								async:false,
								success:function(backData){
									if(backData&&backData["status"]&&backData["status"]==true&&(backData["url"]||"")!=""){
										var curMusicUrl = backData["url"]||"";
										$(".cdft[cdft='audio'][resid='"+curMusic["resid"]+"']").attr("url",curMusicUrl);
										//thisPlayer.musicList[curMusic[]]
										curMusic["src"] = curMusicUrl;
										loaded = true;
									}else{
//										alert("【"+(curMusic["title"]||"当前歌曲")+"】暂时不能在线播放");
										if(backData && backData["msg"] && (backData["msg"]||"") != ""){
											alert(backData["msg"]);
										}else{
											alert(window.mediaDefaultErrorMsg);
										}
									}
								},
								error:function(xhr){
//									alert("网络异常或者服务异常，请求超时，请稍后重试");
									alert(window.mediaDefaultErrorMsg);
								}
							});
			        	}
			        	return loaded;
			        }
			    });
				if(parent && parent.window && parent.window != window){
					$("#audioDiv").css("top",$(parent.window).scrollTop()-$("#audioDiv").parent().offset().top-50+$(parent.window).height()-parseInt($("#audioDiv").css("height").replace("\\w*","")));
//					$("#audioDiv").css("position","absolute").css("top",$(parent.window).scrollTop()-50+$(parent.window).height()-$("#audioDiv").height());
				}
				$("#audioDiv").show().hqzDrag(".headBar");
			}
		}/*else if(cdft=="image"){
			alert("图片");
		}else if(cdft=="doc"){
			alert("文档");
		}else if(cdft=="voice"){//录音直接原位置播放，暂时使用音乐播放器播放
			
		}*/else{//其他情况有下载地址则隐式下载
			if(url&&url!=""){
				var tt = new Date().getTime();
				/**
				* 使用form表单来发送请求
				* 1.method属性用来设置请求的类型——post还是get
				* 2.action属性用来设置请求路径。
				* 
				*/
				var form=$("<form>");//定义一个form表单
				form.attr("style","display:none");
				form.attr("target","__tmpDownloadIframe");
				form.attr("method","get"); //请求类型
				form.attr("action",url); //请求地址
				$("body").append(form);//将表单放置在web中
				if($("#__tmpDownloadIframe").length==0){
					$("body").append("<iframe name='__tmpDownloadIframe' onload='if(window.__isFirst){window.__isFirst=false;}else{alert(window.defaultErrorMsg);}' id='__tmpDownloadIframe' style='display:none;'/>");//将表单放置在web中
				}
				var input1=$("<input>");
				input1.attr("type","hidden");
				input1.attr("name","tt");
				input1.attr("value",tt);
				form.append(input1);
				if($.trim($this.find(".Ht-tit").text()||"")!=""){
					var tmpFn = $.trim($this.find(".Ht-tit").text()||"");
					if(tmpFn.indexOf(".")!=-1){
						tmpFn = tmpFn.substring(0,tmpFn.lastIndexOf("."));
					}
					var input2=$("<input>");
					input2.attr("type","hidden");
					input2.attr("name","fn");
					input2.attr("value",tmpFn);
					form.append(input2);
				}
				form.submit().remove();//表单提交
			}else{
				alert(window.defaultErrorMsg);
			}
		}
	});
	/*
	 * @descr 直播处理：
	 * 		1.正在直播-流媒体支持；--使用流媒体地址
	 * 		2.直播中断-直播回看；--使用直播录播地址
	 * 		3.直播结束-重播记录；--使用直播录制地址
	*/
	$(".mediaArea").on("click",".Pro-annex-zb[vdoid]",function(event){
		event.stopPropagation();
		var $this = $(this);
		var vdoid = $.trim($this.attr("vdoid")||"");
		if(vdoid == ""){
//			alert("暂时不能在线观看");
			alert(window.mediaDefaultErrorMsg);
			return false;
		}
		var liveInfo = window.liveObj.map.get(vdoid);
		if(!liveInfo){
//			alert("暂时不能在线观看");
			alert(window.mediaDefaultErrorMsg);
			return false;
		}
		var liveId = liveInfo.liveId;
		// 查看直播逻辑修改，可播放的情况下，跳转到直播页面
		if(liveInfo.liveStatus=="0"){
			alert("直播未开始，请等待...！");
			return false;
		}else if(liveInfo.liveStatus=="1"){
			// 正在播放中
		}else if(liveInfo.liveStatus=="3"){
			alert("直播中断，请等待...！");
			return false;
		}else if(liveInfo.liveStatus=="4" && liveInfo.ifreview==1){
			alert("此直播不支持回看！");
			return false;
		}
		if(liveId) {
			window.open("https://zhibo.chaoxing.com/"+liveId);
		} else if(livePlayPreHandler(vdoid,liveInfo,$this)){//播放前处理并返回是否可以继续播放
			window.livePlay(liveInfo,$this);
		}
		return false;
	});
	$("#videoDiv").on("click",".videoCloseBtn",function(){
		videoPlayer&&videoPlayer.videoPause();
		easyDialog.close();
		window.videoPlayerOpened = false;//播放器关闭
	});
	/*$("#videoDiv").mouseenter(function(){
		$(this).find(".videoCloseBtn").show();
	}).mouseleave(function(){
		$(this).find(".videoCloseBtn").hide();
	});*/
	$("#audioDiv").on("click",".audioCloseBtn",function(){
//		console.log("pause");
		musicPlayer&&musicPlayer.pause();
//		easyDialog.close();
		$("#audioDiv").hide();
	});
	/*$("#audioDiv").mouseenter(function(){
		$(this).find(".audioCloseBtn").show();
	}).mouseleave(function(){
		$(this).find(".audioCloseBtn").hide();
	});*/
	$.fn.extend({
	    hqzDrag: function(handler){
	        var oldX, oldY, newX, newY;
	        var $handler = handler?($(this).find(handler).length>0?$(this).find(handler).eq(0):$(handler)):this;
	        var $self = $(this);
	        $handler.on('mousedown',function(e){
	        	$self.css('position','fixed');
	            oldX = e.clientX;
	            oldY = e.clientY;
	            $(document).on('mousemove',function(e){
	                newX = e.clientX,
	                newY = e.clientY;
	                $self.css('left','+=' + (newX - oldX));
	                $self.css('top','+=' + (newY - oldY));
	                oldX = newX;
	                oldY = newY;
	            });
	            $(document).on('mouseup',function(){
	                $(document).off();
	            });
	        });
	    }
	});
});

/**
 * @title:直播点播前处理，并返回boolean值，如果返回true表示继续执行播放，否则不播放
 * @param vdoid直播资源id
 * @param liveInfo直播资源的详细信息
 * @param $this jquery格式的对象表示当前点击对象
 * @param isAtOnce 是否立刻执行，默认为false，意味着先查一遍(因为直播状态除了到页面首次查一遍，随后不查询，是过时的状态),然后才执行真正处理
 */
window.livePlayPreHandler = function(vdoid,liveInfo,$this,isAtOnce){
	isAtOnce = isAtOnce || false;
	if(isAtOnce&&liveInfo.hasLoad==true){
		if(liveInfo.liveStatus=="0"){//如果未开始播放，则提示并定时5秒刷新状态
			alert("直播未开始，直播开始后将自动播放，请等待...");
			window.liveObj.timerTask(vdoid,function(backData1,vdoid1,liveInfo1){
				if(liveInfo1.liveStatus=="0"){//还未开始，继续监控
//					console.log("0-0");
				}else if(liveInfo1.liveStatus=="1"||liveInfo1.liveStatus=="3"||liveInfo1.liveStatus=="4"){//开始直播了，直播中、直播中断或者直播结束等等，都停止监控
//					console.log("0-"+liveInfo1.liveStatus);
					liveObj.clearTimerTask(vdoid1);
					if(window.videoPlayerOpened==false){//播放器关闭
						$this.click();
					}
				}else{//其他异常状态，则立即停止监控，防止无限循环
					liveObj.clearTimerTask(vdoid1);
					if(window.videoPlayerOpened == true){
						if(videoPlayer&&videoPlayer.vars&&videoPlayer.vars.video&&(videoPlayer.vars.video==encodeURIComponent(liveInfo1.liveUrl))){
							videoPlayer&&videoPlayer.videoPause();
							alert("此直播状态异常！");
							$("#videoDiv .videoCloseBtn").click();
						}
					}
				}
			});
			return false;
		}else if(liveInfo.liveStatus=="1"){//如果正在播放中，则定时刷新以监控状态变化-关注结束状态和暂停状态
			window.liveObj.timerTask(vdoid,function(backData,vdoid1,liveInfo1){
				if(liveInfo1.liveStatus=="1"){//直播中，继续播放
					if(window.videoPlayerOpened == true){
						if(videoPlayer&&videoPlayer.vars&&videoPlayer.vars.video&&(videoPlayer.vars.video==encodeURIComponent(liveInfo1.liveUrl))){
							videoPlayer&&videoPlayer.videoPlay();
						}
					}else{
						if(liveInfo1.showMsg){//直播自动中断才会去尝试恢复播放，否则直播中发现关闭啦不会去尝试恢复直播，因为可能是主动关闭的，不应该总自动打开
							window.livePlay(liveInfo1,$this);
						}
					}
					if(liveInfo1.showMsg){
						delete liveInfo1.showMsg;
					}
				}else if(liveInfo1.liveStatus=="3"){//中断啦，暂停播放
					if(window.videoPlayerOpened == true){//播放器已打开
						if(videoPlayer&&videoPlayer.vars&&videoPlayer.vars.video&&(videoPlayer.vars.video==encodeURIComponent(liveInfo1.liveUrl))){//视频播放器播放的是当前直播
							videoPlayer&&videoPlayer.videoPause();
							if(!liveInfo1.showMsg){
								alert("直播中断，请等待...！");
								liveInfo1.showMsg = true;
								$("#videoDiv .videoCloseBtn").click();
							}
						}
					}
				}else if(liveInfo1.liveStatus=="4"){//结束啦(默认已经关闭了定时器)，先暂停播放，然后根据“直播回看”设置来确定“直接关闭”还是提示“观看录播视频”
					if(window.videoPlayerOpened == true){//播放器已打开
						if(videoPlayer&&videoPlayer.vars&&videoPlayer.vars.video&&(videoPlayer.vars.video==encodeURIComponent(liveInfo1.liveUrl))){//视频播放器播放的是当前直播
							videoPlayer&&videoPlayer.videoPause();
							if(liveInfo1.ifreview==1){//直播不允许回看
								alert("此直播不支持回看！");
								$("#videoDiv .videoCloseBtn").click();
							}else{
								if(confirm("直播已经结束啦，是否观看录播视频?")){
									setTimeout(function(){$(".Pro-annex-zb[vdoid='"+vdoid1+"']").click();}, 500);
								}else{
									$("#videoDiv .videoCloseBtn").click();
								};
							}
						}
					}
				}else{//其他异常状态，则立即停止监控，防止无限循环
					liveObj.clearTimerTask(vdoid1);
					if(window.videoPlayerOpened == true){
						if(videoPlayer&&videoPlayer.vars&&videoPlayer.vars.video&&(videoPlayer.vars.video==encodeURIComponent(liveInfo1.liveUrl))){
							videoPlayer&&videoPlayer.videoPause();
							alert("此直播状态异常！");
							$("#videoDiv .videoCloseBtn").click();
						}
					}
				}
			});
		}else if(liveInfo.liveStatus=="3"){//直播中断，提示并监听
			window.liveObj.timerTask(vdoid,function(backData1,vdoid1,liveInfo1){
				if(liveInfo1.liveStatus=="1"){//开始直播了，停止监控
					liveObj.clearTimerTask(vdoid1);
					if(window.videoPlayerOpened==false){//播放器关闭
						$this.click();
					}else{
						if(videoPlayer&&videoPlayer.vars&&videoPlayer.vars.video&&(videoPlayer.vars.video==encodeURIComponent(liveInfo1.liveUrl))){//视频播放器播放的是当前直播
							$("#videoDiv .videoCloseBtn").click();
							setTimeout(function(){$(".Pro-annex-zb[vdoid='"+vdoid1+"']").click();}, 100);
//							videoPlayer&&videoPlayer.videoPlay();
						}
					}
				}else if(liveInfo1.liveStatus=="4"){//直播结束了，停止监控
					if(window.videoPlayerOpened==false){//播放器关闭
						$this.click();
					}else{
						if(videoPlayer&&videoPlayer.vars&&videoPlayer.vars.video&&(videoPlayer.vars.video==encodeURIComponent(liveInfo1.liveUrl))){//视频播放器播放的是当前直播
							videoPlayer&&videoPlayer.videoPause();
							if(liveInfo1.ifreview==1){//直播不允许回看
								alert("此直播不支持回看！");
								$("#videoDiv .videoCloseBtn").click();
							}else{
								if(confirm("直播已经结束啦，是否观看录播视频?")){
									setTimeout(function(){$(".Pro-annex-zb[vdoid='"+vdoid1+"']").click();}, 500);
								}else{
									$("#videoDiv .videoCloseBtn").click();
								};
							}
						}
					}
				}else if(liveInfo.liveStatus!="3"){//其他异常状态，则立即停止监控，防止无限循环
					liveObj.clearTimerTask(vdoid1);
					if(window.videoPlayerOpened == true){
						if(videoPlayer&&videoPlayer.vars&&videoPlayer.vars.video&&(videoPlayer.vars.video==encodeURIComponent(liveInfo1.liveUrl))){
							videoPlayer&&videoPlayer.videoPause();
							alert("此直播状态异常！");
							$("#videoDiv .videoCloseBtn").click();
						}
					}
				}
			});
			alert("直播中断，请等待...！");
			return false;
		}else if(liveInfo.liveStatus=="4"){//直播结束，如果直播设置为允许回看则观看录播视频，否则提示并关闭
			if(liveInfo.ifreview==1){//不允许回看
				/*if(window.videoPlayerOpened == true){//播放器已打开
					if(videoPlayer&&videoPlayer.vars&&videoPlayer.vars.video&&(videoPlayer.vars.video==encodeURIComponent(liveInfo.liveUrl))){//视频播放器播放的是当前直播
						videoPlayer&&videoPlayer.videoPause();
						alert("此直播不支持回看！");
						$("#videoDiv .videoCloseBtn").click();
					}
				}else{*/
					alert("此直播不支持回看！");
//				}
				return false;
			}
		}else{//未知状态，直接中断
			alert("此直播状态异常！");
			return false;
		}
		return true;
	}else{
		if(liveInfo.liveStatus=="4"&&liveInfo.hasLoad==true){
			if(liveInfo.ifreview==1){//不允许回看
				alert("此直播不支持回看！");
				return false;
			}else{
				return true;
			}
			
		}else{
			window.liveObj.getStatus(vdoid,function(backData1,vdoid1,liveInfo1){
				if(window.livePlayPreHandler(vdoid1, liveInfo1, $this, true)){
					window.livePlay(liveInfo1,$this);
				}
			});
			return false;
		}
	}
};
//直播播放函数
window.livePlay = function(liveInfo,jqueryEl){
	var url = liveInfo.liveStatus=="1"?liveInfo.liveUrl:liveInfo.downUrl;
	if(videoPlayer&&videoPlayer.vars&&videoPlayer.vars.video&&videoPlayer.vars.video==encodeURIComponent(url)){//如果视频存在且已经加载了，直接播放即可
		videoPlayer.videoPlay();
	}else{
//		console.log("init");
		var videoObject = {
			playerID:'ckplayer01',//播放器ID，第一个字符不能是数字，用来在使用多个播放器时监听到的函数将在所有参数最后添加一个参数用来获取播放器的内容
			container: '#video', //容器的ID或className
			//variable: 'player', //播放函数名称
			//loaded: 'loadedHandler', //当播放器加载后执行的函数
			//loop: true, //播放结束是否循环播放
			autoplay: true, //是否自动播放
			//duration: 500, //设置视频总时间
			config: '', //指定配置函数
			flashplayer: false, //强制使用flashplayer
			drag: 'start', //拖动的属性
			seek: 0, //默认跳转的时间
			video: url //视频地址
		};
		videoPlayer = new ckplayer(videoObject);
	}
	easyDialog.open({
	    container : 'videoDiv',
	    noFn : true,
	    drag:true
	});
	window.videoPlayerOpened = true;//播放器已打开
	//空间iframe兼容
	try {
		if(parent && parent.window && parent.window!=window){
			$("#videoDiv").css("top",$(parent.window).scrollTop()-$("#videoDiv").parent().offset().top-50+($(parent.window).height()-parseInt($("#videoDiv").css("height").replace("\\w*","")))/2);
		}
	} catch(e) {
		console.log(e);
	}
	
};
//空间iframe滚动兼容--同协议同顶级域名
try {
	if(parent && parent.window && parent.window!=window){
		$(parent.window).scroll(function(){
			var $this = $(this);
			try{
				if($("#videoDiv").is(":visible") && $("#videoDiv").parent() && $("#videoDiv").parent().offset() && ($("#videoDiv").parent().offset().top||0>0) && $("#videoDiv").attr("scrollBool")||""==""){
					$("#videoDiv").attr("scrollBool","on");
					$("#videoDiv").css({
						"top":$this.scrollTop()-$("#videoDiv").parent().offset().top-50+($this.height()-parseInt($("#videoDiv").css("height").replace("\\w*","")))/2
					});
					setTimeout(function(){$("#videoDiv").removeAttr("scrollBool");}, 50);
				}
				if($("#audioDiv").is(":visible") && $("#audioDiv").attr("scrollBool")||""==""){
					$("#audioDiv").attr("scrollBool","on");
					$("#audioDiv").css({
						"top":$this.scrollTop()-50+$this.height()-parseInt($("#audioDiv").css("height").replace("\\w*",""))
					});
					setTimeout(function(){$("#audioDiv").removeAttr("scrollBool");}, 50);
				}
			}catch(e){;}
		});
	}
}
catch(e) {
	console.log(e);
}


//时间格式化
function timeformat(limit){
    if(!limit){  
        return "0秒";
    }
    limit = parseInt(limit);
    var index=0;    
    var timeUnit=new Array('秒','分','小时');
    var timeArray = new Array();
    if(limit>=60){
        while(limit>=60){//数字部分1到60之间
            timeArray.push(limit%60);
            limit = parseInt(limit/60);
            index += 1;
        };
    }
    timeArray.push(limit);
    var timeFormat = "";
    for(var i=timeArray.length-1;i>=0;i--){
        timeFormat += timeArray[i]+timeUnit[i];
    }
    return timeFormat;    
}

/**
 * description ：播放富文本中的音视频
 * cdft : 播放的资源类型（audio：音频； video：视频）
 * audio_video : 对应的音视频文件
 * editing : 是否是编辑页（true/false）
 * iframe_cid : 附件对应的iframe上的cid
 */
/*window.play = function(cdft, audio_video, editing) {
	//异步获取附件文件地址
	var mediaErrorMsg = window.mediaDefaultErrorMsg;
	var url = window.loadedMediaMap.get(audio_video.fileId);
	if(!url && cdft!="audio"){//非音频获取下载地址
		$.ajax({
			url:"/pc/files/status/"+(audio_video.fileId||""),
			data:{isMedia:cdft=="video"},
			type:"get",
			async:false,
			success:function(backData){
				if(backData&&backData["status"]&&backData["status"]==true){
					url = backData["url"]||"";
					window.loadedMediaMap.put(audio_video.fileId, url);
				}else{
					if(backData && backData["msg"] && (backData["msg"]||"") != ""){
						mediaErrorMsg = backData["msg"];
					}
				}
			},
			error : function(xhr ,textStatus ,errorThrown) {
				var status = xhr.status;
				var errorMsg = "";
				if(status == 0) {
					mediaErrorMsg = " 网络错误，请稍后重试";
				} else if(status == 503){
					mediaErrorMsg = "请求超时，请稍后重试";
				} else {
					mediaErrorMsg = "操作失败(code:"+ status +")";
				}
			}
		});
		if(url==""){
			alert(mediaErrorMsg);
			return false;
		}
	}
	
	//在线预览或者下载附件文件
	if(cdft=="video"){
		//视频
		if(videoPlayer&&videoPlayer.vars&&videoPlayer.vars.video&&videoPlayer.vars.video==encodeURIComponent(url)){//如果视频存在且已经加载了，直接播放即可
			videoPlayer.videoPlay();
		}else{
			var videoObject = {
				playerID:'ckplayer01',//播放器ID，第一个字符不能是数字，用来在使用多个播放器时监听到的函数将在所有参数最后添加一个参数用来获取播放器的内容
				container: '#video', //容器的ID或className
				//variable: 'player', //播放函数名称
				//loaded: 'loadedHandler', //当播放器加载后执行的函数
				//loop: true, //播放结束是否循环播放
				autoplay: true, //是否自动播放
				//duration: 500, //设置视频总时间
				config: '', //指定配置函数
				flashplayer: false, //强制使用flashplayer
				drag: 'start', //拖动的属性
				seek: 0, //默认跳转的时间
				video: url //视频地址
			};
			videoPlayer = new ckplayer(videoObject);
		}
		easyDialog.open({
		    container : 'videoDiv',
		    noFn : true,
		    drag:true
		});
		window.videoPlayerOpened = true;
	}else if(cdft=="audio"){
		//音频
		if(musicPlayer){
			var exists = false;
			for(i in musicPlayer.musicList){
				if(musicPlayer.musicList[i]["resid"] == audio_video.fileId){
					exists = true;
					break;
				}
			}
			if(!exists){
				var title = audio_video.name;
				musicPlayer.addMusic({resid:audio_video.fileId,title:title,src:url});
			}
			musicPlayer.play(audio_video.fileId);
			$("#audioDiv").show();
		}else{
			var musicList = new Array();
			var defaultIdx = 0;
			if(audio_video.infoJsonStr) {
				// 云盘里面的音频，单独处理一下处理一下
				musicList.push({resid:audio_video.fileId,title:audio_video.name,src:""});
			}
			
			var iframes;
			// 编辑页和非编辑
			if(editing) {
				var ueditor_iframe = window.frames["ueditor_0"];
				var doc = ueditor_iframe.contentDocument || ueditor_iframe.document;
				if(doc) {
					iframes = doc.getElementsByTagName('iframe');
				}
			} else {
			    iframes = document.getElementsByTagName('iframe');
			}
			if(iframes && iframes.length > 0) {
            	for(i=0; i<iframes.length; i++) {
            		var src = iframes[i].getAttribute('src');
            		if(src && src.indexOf("insertVoice") > -1) {
            			try{
            		        json = JSON.parse(iframes[i].getAttribute('name'));
            		    }catch(e){
            		        console.log(e);
            		        json = "";
            		    }
            		    if(json && json.att_voice) {
            		    	var name = "";
            		    	if(json.att_voice.titleEdited == 1){
                                name = json.att_voice.fileTitle || "";
                            }else{
                                name = "录音-" + timeformat(json.att_voice.voiceLength || 0);
                            }
            		    	musicList.push({resid:json.att_voice.objectId2, title: name, src:"", iframe_cid:json.cid});
            		    	if(audio_video.fileId == json.att_voice.objectId2) {
            		    		// 获取点击的那个音频在列表中的位置，用于后面播放相应位置的音频
            		    		defaultIdx = i;
            		    	}
            		    }
            		}
            	}
            }
			musicPlayer = new SMusic({
		        musicList : musicList,
		        autoPlay  : true,  //是否自动播放
		        defaultIndex :defaultIdx,//默认为选中
		        defaultMode : 1,   //默认播放模式，列表模式
		        callback:function(thisPlayer,curMusic){
		        	var $musicListDiv = $(thisPlayer.musicDom.listWrap);
		        	var $scrollToContainer = $musicListDiv.find("[musicresid='"+curMusic["resid"]+"']");
		        	$musicListDiv.animate({
		            	scrollTop: $scrollToContainer.offset().top - $musicListDiv.offset().top + $musicListDiv.scrollTop()
		            }, 1000);//2秒滑动到指定位置
		        },
		        loadMusic:function(thisPlayer,curMusic){//歌曲不在时，开始加载
		        	var loaded = false;
		        	if($.trim(curMusic["resid"]||"")!=""){
			        	$.ajax({
							url:"/pc/files/status/"+(curMusic["resid"]||""),
							data:{isMedia:true},
							type:"get",
							xhrFields: {
				                withCredentials: true
				            },
							async:false,
							success:function(backData){
								if(backData&&backData["status"]&&backData["status"]==true&&(backData["url"]||"")!=""){
									var curMusicUrl = backData["url"]||"";
									$(".cdft[cdft='audio'][resid='"+curMusic["resid"]+"']").attr("url",curMusicUrl);
									//thisPlayer.musicList[curMusic[]]
									curMusic["src"] = curMusicUrl;
									window.loadedMediaMap.put(audio_video.fileId, curMusicUrl);
									loaded = true;
								}else{
//									alert("【"+(curMusic["title"]||"当前歌曲")+"】暂时不能在线播放");
									if(backData && backData["msg"] && (backData["msg"]||"") != ""){
										alert(backData["msg"]);
									}else{
										alert(window.mediaDefaultErrorMsg);
									}
								}
							},
							error:function(xhr){
//								alert("网络异常或者服务异常，请求超时，请稍后重试");
								alert(window.mediaDefaultErrorMsg);
							}
						});
		        	}
		        	return loaded;
		        }
		    });
			$("#audioDiv").show().hqzDrag(".headBar");
		}
	}
}*/