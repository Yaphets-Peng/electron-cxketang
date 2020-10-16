var Audio = function(tpl){ this.init(tpl); };
Audio.prototype = {
  init:function(tpl) {
    let defaultOptions = {
      ele: null,
      autoplay: false,
      // loop为true的时候不执行ended事件
      loop: true,
      ended: function () {}
    }
    this.opt = Object.assign({}, defaultOptions, tpl)
    // 判断传进来的是DOM还是字符串
    if (typeof this.opt.ele === 'string') {
        this.opt.ele = document.querySelector(this.opt.ele)
    }
    if (!this.opt.ele) return

    this.loading = true
		this.isDrag = false;
		this.isPlaying = false
		this.durationT = 0
		this.currentT = 0
		this.currentP = 0
		this.maxProgressWidth = 0
		this.dragProgressTo = 0

		// 通过时间戳与当前时间的差值来判断是否需要加载
		this.reduceTBefore = 0   // 时间戳与当前时间的差值 (初始化)
		this.reduceTAfter = 0   // 时间戳与当前时间的差值 (执行中)

    this.initDom();
  },
  // 初始化元素
  initDom:function () {
  	if(this.opt.ele.getElementsByClassName('audio-content')[0].innerHTML==''){
  		var html='<div class="audio-time">'
							+'<span class="current-t">00:00</span>'
						+'</div>'
						+'<div class="audio-progress">'
							+'<div class="audio-progress-detail">'
								+'<span class="audio-voice-p"></span>'
								+'<span class="audio-buffer-p"></span>'
								+'<span class="audio-loading"><span class="audio-loading-wrapper"></span></span>'
							+'</div>'
							+'<div class="audio-origin-bar">'
								+'<div class="audio-origin"></div>'
							+'</div>'
						+'</div>'
						+'<div class="audio-time">'
							+'<span class="duration-t">00:00</span>'
						+'</div>'
						+'<div class="audio-loading-text">正在加载...</div>';
			this.opt.ele.getElementsByClassName('audio-content')[0].innerHTML=html;
  	} 
    this.audio = this.opt.ele.getElementsByTagName('audio')[0];// audio 
    if(!this.audio.paused){
    	this.isPlaying = true;
    }
    this.audioDetail = this.opt.ele.getElementsByClassName('audio-progress-detail')[0];// progress detail 
    this.audioVoiceP = this.opt.ele.getElementsByClassName('audio-voice-p')[0]; // voice p
    this.audioBufferP = this.opt.ele.getElementsByClassName('audio-buffer-p')[0];// buffer p
    this.audioLoading = this.opt.ele.getElementsByClassName('audio-loading')[0];// loading p
    this.audioC = this.opt.ele.getElementsByClassName('audio-content')[0];// laoding wrapper
    this.audioOriginBar = this.opt.ele.getElementsByClassName('audio-origin-bar')[0];// origin bar
    this.audioOrigin = this.opt.ele.getElementsByClassName('audio-origin')[0];// origin
    this.audioLoadingText = this.opt.ele.getElementsByClassName('audio-loading-text')[0];// 加载中
    this.audioTime = this.opt.ele.getElementsByClassName('audio-time')[0];// 音乐时间信息
    this.audioCurrent = this.opt.ele.getElementsByClassName('current-t')[0];// currentT
    this.audioDuration = this.opt.ele.getElementsByClassName('duration-t')[0];// durationT
		this.durationT = this.audio.duration;
    this.audioDuration.innerText = this.formartTime(this.durationT);// 初始化视频时间
    this.initAudioEvent();
  },

  // 播放
  audioPlay:function() {
    this.audio.play()
		this.isPlaying = true
  },

  // 
  audioPause :function() {
    this.audio.pause();
    this.isPlaying = false
  },

  audioPlayPause :function() {
    if (!this.audio.paused) {
      this.audioPause();
    } else {
      this.audioPlay();
    }
  },

  audioCut :function(src, title, disc) {
    this.audio.src = src
    this.durationT = 0
    this.currentT = 0
    this.currentP = 0
    this.dragProgressTo = 0
    // 初始化 audioCurrent 的文案
    this.audioCurrent.innerText = '00:00'
    this.audioOrigin.style.left = '0px'
    this.audioVoiceP.style.width = '0px'
    this.audioPlay()
  },

  showLoading :function(bool) {
    this.loading = bool || false
    if (this.loading) {
      this.audioLoading.style.display = 'block';
      this.audioOrigin.classList.add('loading');
      this.audioTime.style.display='none';
      this.audioLoadingText.style.display='block';
    } else {
      this.audioLoading.style.display = 'none';
      this.audioOrigin.classList.remove('loading');
      this.audioTime.style.display='block';
      this.audioLoadingText.style.display='none';
    }
  },

  initAudioEvent :function() {
    var _this = this
    // 音频事件
    _this.audio.onplaying = function () { //播放
//  	alert('playing')
	  	_this.opt.ele.classList.remove('loading');
	  	_this.opt.ele.classList.remove('pause');
	  	_this.opt.ele.classList.add('play');
      var date = new Date ()
      _this.isPlaying = true;
      _this.reduceTBefore = Date.parse(date) - Math.floor(_this.audio.currentTime * 1000);
      _this.showLoading(false);
    },
    _this.audio.onpause = function () {  //暂停
//  	alert('pause')
	  	_this.opt.ele.classList.remove('loading');
	  	_this.opt.ele.classList.remove('play');
      _this.isPlaying = false;
      _this.showLoading(false)
    },
    _this.audio.onloadedmetadata = function () {
//  	alert('loadedmetadata')
      _this.durationT = _this.audio.duration
      // 初始化视频时间
      _this.audioDuration.innerText = _this.formartTime(_this.audio.duration)
    },
    _this.audio.onwaiting = function () {
//    alert('waiting');    	
    	_this.opt.ele.classList.add('loading');
      if(!_this.audio.paused) {
        _this.showLoading(true)
      }
    },
    _this.audio.onprogress = function () {
      if(_this.audio.buffered.length > 0) {
        var bufferedT = 0
        for (var i = 0; i < _this.audio.buffered.length; i++) {
          bufferedT += _this.audio.buffered.end(i) - _this.audio.buffered.start(i)
          if(bufferedT > _this.durationT) {
            bufferedT = _this.durationT
            _this.showLoading(false)
            console.log('缓冲完成')
          }
        }
        var bufferedP = Math.floor((bufferedT / _this.durationT) * 100)
        _this.audioBufferP.style.width = bufferedP + '%'
      }

      // ===========================
      var date = new Date ()
      if(!_this.audio.paused) {
        _this.reduceTAfter = Date.parse(date) - Math.floor(_this.currentT * 1000)
        if(_this.reduceTAfter - _this.reduceTBefore > 1000) {
          _this.showLoading(true)
        } else {
          _this.showLoading(false)
        }
      } else {
        return
      }
    },
    // 播放结束事件
    _this.audio.onended = function () {
      _this.opt.ended()
    }
    // 绑定进度条
    _this.audio.ontimeupdate = function () {
      var date = new Date ()
      if (!_this.isDrag) {
        _this.currentT = _this.audio.currentTime;
        _this.durationT = _this.audio.duration;
        _this.currentP = Number((_this.audio.currentTime / _this.durationT) * 100)
        _this.reduceTBefore = Date.parse(date) - Math.floor(_this.currentT * 1000)
        _this.currentP = _this.currentP > 100 ? 100 : _this.currentP
        _this.audioVoiceP.style.width = _this.currentP + '%'
        _this.audioOrigin.style.left = _this.currentP + '%'
        // 更改时间进度
        _this.audioCurrent.innerText = _this.formartTime(_this.audio.currentTime)
        _this.showLoading(false)
      }
    },
    // 页面点击事件
//  _this.audioStateImg.onclick = function () {
//    _this.audioPlayPause()
//  }

    _this.audioOrigin.onmousedown = function (event) {
      _this.isDrag = true
      var e = event || window.event
      var x = e.clientX
      var l = event.target.offsetLeft
      _this.maxProgressWidth = _this.audioOriginBar.offsetWidth
      console.log(_this.maxProgressWidth)
      _this.audioC.onmousemove = function (event) {
        if (_this.isDrag) {
          var e = event || window.event
          var thisX = e.clientX
          _this.dragProgressTo = Math.min(_this.maxProgressWidth, Math.max(0, l + (thisX - x)))
          // update Time
          _this.updatePorgress()
        }
      }
      _this.audioC.onmouseup = function () {
        if (_this.isDrag) {
          _this.isDrag = false
          _this.audio.currentTime = Math.floor(_this.dragProgressTo / _this.maxProgressWidth * _this.durationT)
        } else {
          return
        }
      }

      _this.audioC.onmouseleave = function () {
        if (_this.isDrag) {
          _this.isDrag = false
          _this.audio.currentTime = Math.floor(_this.dragProgressTo / _this.maxProgressWidth * _this.durationT)
        } else {
          return
        }
      }
    }

    _this.audioOrigin.ontouchstart = function (event) {
      _this.isDrag = true
      var e = event || window.event
      var x = e.touches[0].clientX
      var l = e.target.offsetLeft

      _this.maxProgressWidth = _this.audioOriginBar.offsetWidth

      _this.audioC.ontouchmove = function (event) {
        if (_this.isDrag) {
          var e = event || window.event
          var thisX = e.touches[0].clientX
          _this.dragProgressTo = Math.min(_this.maxProgressWidth, Math.max(0, l + (thisX - x)))
          _this.updatePorgress()
        }
      },
      _this.audioC.ontouchend = function () {
        if (_this.isDrag) {
          _this.isDrag = false
          _this.audio.currentTime = Math.floor(_this.dragProgressTo / _this.maxProgressWidth * _this.durationT)
        } else {
          return
        }
      }
    }

    _this.audioDetail.onclick = function (event) {
      var e = event || window.event
      var l = e.layerX
      var w = _this.audioDetail.offsetWidth
      _this.audio.currentTime = Math.floor(l / w * _this.durationT)
      e.stopPropagation(); 
    }
  },
  updatePorgress :function() {
    this.audioOrigin.style.left = this.dragProgressTo + 'px'
    this.audioVoiceP.style.width = this.dragProgressTo + 'px'
    var currentTime = Math.floor(this.dragProgressTo / this.maxProgressWidth * this.durationT)
    // this.audio.currentTime = currentTime
    this.audioCurrent.innerText = this.formartTime(currentTime)
    // this.audio.currentTime = Math.floor(this.dragProgressTo / this.maxProgressWidth * this.durationT)
  },

  formartTime :function(seconds) {
    var formatNumber = function (n) {
            n = n.toString()
            return n[1] ? n : '0' + n
        }
        var m = Math.floor(seconds / 60);
        var s = Math.floor(seconds % 60);
        return formatNumber(m) + ":" + formatNumber(s);
  }
}
