document.write('<script type="text/javascript" src="/res/plugin/plupload/plupload.full.min.js"></script>');//加载外部js
/**
 * 初始化支持HTML5的图片和文件上传插件
 * 
 * @author huanggaohua
 * @date 2018.12.7
 * @param address 上传地址
 * @param elementId 触发上传元素
 * @param file_data_name 服务端接收的参数名
 * @param multi_selection 是否可以在文件浏览对话框中选择多个文件
 * @param fileCallBack 每个文件上传完的回调函数，回调参数为“服务端返回的值”
 */
var initUpload=function(address,elementId,file_data_name,multi_selection,fileCallBack){
	//实例化一个plupload上传对象
	var uploader = new plupload.Uploader({
	    browse_button : elementId, //触发文件选择对话框的按钮，为那个元素id
	    url : address, //服务器端的上传页面地址
	    file_data_name:file_data_name,
	    flash_swf_url : '/res/plugin/plupload/Moxie.swf', //swf文件，当需要使用swf方式进行上传时需要配置该参数
	    silverlight_xap_url : '/res/plugin/plupload/Moxie.xap', //silverlight文件，当需要使用silverlight方式进行上传时需要配置该参数
	    multi_selection:multi_selection,//是否可以在文件浏览对话框中选择多个文件
	    filters: {
	    	  max_file_size : '200MB', //最大只能上传的文件大小：单位kb
	    	  prevent_duplicates : true //不允许选取重复文件
	    	}   
	});    
	//在实例对象上调用init()方法进行初始化
	uploader.init();
	//绑定事件
	bindUpload(uploader,elementId,fileCallBack);
}

/**
 * 初始化支持HTML5的图片上传插件
 * 
 * @author huanggaohua
 * @date 2018.12.7
 * @param address 上传地址
 * @param elementId 触发上传元素id
 * @param file_data_name 文件域的名称
 * @param multi_selection 是否可以在文件浏览对话框中选择多个文件
 * @param progressDom 进度条元素
 * @param fileCallBack 每个文件上传完的回调函数，回调参数为“服务端返回的值”
 */
var initImageUpload=function(address,elementId,file_data_name,multi_selection,progressDom,fileCallBack){
	//实例化一个plupload上传对象
	var uploader = new plupload.Uploader({
	    browse_button : elementId, //触发文件选择对话框的按钮，为那个元素id
	    url : address, //服务器端的上传页面地址
	    file_data_name:file_data_name,
	    flash_swf_url : '/res/plugin/plupload/Moxie.swf', //swf文件，当需要使用swf方式进行上传时需要配置该参数
	    silverlight_xap_url : '/res/plugin/plupload/Moxie.xap', //silverlight文件，当需要使用silverlight方式进行上传时需要配置该参数
	    multi_selection:multi_selection,//是否可以在文件浏览对话框中选择多个文件
	    filters: {
	    	  mime_types : [{ title : "Image files", extensions : "jpeg,jpg,gif,png" }],//只允许上传图片
	    	  max_file_size : '20Mb', //最大只能上传的图片大小：单位Mb
	    	  prevent_duplicates : true //不允许选取重复文件
	    	}
	});    
	//在实例对象上调用init()方法进行初始化
	uploader.init();
	//绑定事件
	bindUpload(uploader,elementId,fileCallBack);
}

/**
 * 上传插件绑定监听
 * 
 * @author huanggaohua
 * @date 2018.12.7
 * @param elementId 触发上传元素id
 * @param progressDom 进度条元素
 * @param fileCallBack 每个文件上传完的回调函数，回调参数为“服务端返回的值”
 */
var bindUpload = function(uploader,elementId,fileCallBack) {


	//当文件添加到上传队列前触发
	uploader.bind('FileFiltered',function(uploader,file){
		//处理缩略图，黄高华2018.12.19
		if(file.type=='image/png'||file.type=='image/jpeg'){//图片文件采用缩略图
			var fileNative = file.getNative();
//			实例化FileReader 
			var fReader = new FileReader();
			fReader.readAsDataURL(fileNative);
			fReader.onload  = function(e){
				var progressHtml = '<div class="uploadImgItem">'+
											'<img src="'+e.target.result+'">'+
										'<div class="progress"><span class="progressBar" style="width: 0%;"></span><span class="progressTxt" id="'+file.id+'" >正在上传</span></div>'+
									'</div>';
				var addImg = $(elementId).parent().parent().find(".addImg");
				if(addImg!=undefined&&addImg.length>0){
					addImg.before(progressHtml);
				}else{
					//兼容处理非富文本话题编辑页面的上传
					var imgList = $(elementId).parents('.box').find('.replyUploadImgList');
					if(imgList!=undefined&&imgList.length>0){
						imgList.append(progressHtml);
					}
				}
			};
		}else{//文件则采用固定的图片
			var progressHtml = '<div class="attachItem file uploading"  id="'+file.id+'"  name="'+file.name+'">'+
									'<div class="attachProgress" style="width: 0%;"></div>'+
									'<div class="attachImg"><img src="'+template.defaults.imports.cloudDiskIco(file.name.substr(file.name.lastIndexOf('.')+1))+'"></div>'+
									'<div class="attachInfo">'+
										'<h1>'+file.name+'</h1>'+
										'<p>正在上传...</p>'+
									'</div>'+
									'<div class="attachRight">'+
										'<div class="attachProgressText">0%</div>'+
									'</div>'+
								'</div>';
//			$(elementId).parents(".replyEdit").find(".replyAttachList").append(progressHtml);
			var replyAttachList = $(elementId).parents(".replyEdit").find(".attachList");
			if(replyAttachList!=undefined&&replyAttachList.length>0){
				replyAttachList.append(progressHtml);
			}else{
				//兼容处理非富文本话题编辑页面的上传
				replyAttachList = $(elementId).parents('.box').find('.replyAttachList');
				if(replyAttachList!=undefined&&replyAttachList.length>0){
					replyAttachList.append(progressHtml);
				}
			}
		}
	});

	//当队列中的某一个文件上传完成后触发
	uploader.bind('FileUploaded',function(uploader,file,responseObject){
		if(file.type=='image/png'||file.type=='image/jpeg'){//图片文件
			$('#'+file.id).prev().css("width",""+file.percent+"%");
			$('#'+file.id).html(file.percent+"%");
			if(file.percent>=100){
				$('#'+file.id).parents(".uploadImgItem").find(".progress").after('<div class="imgMask"><div class="enlargeBtn"></div></div>');
				$('#'+file.id).parents(".uploadImgItem").find(".imgMask").after('<div class="removeImg"></div>');
				$('#'+file.id).parents(".uploadImgItem").find(".progress").remove();
			}
		}else{//其他文件
			$('#'+file.id).find(".attachProgress").css("width",""+file.percent+"%");
			$('#'+file.id).find(".attachProgressText").html(file.percent+"%");
			if(file.percent>=100){
				$('#'+file.id).find(".attachProgress").remove();
				$('#'+file.id).find(".attachProgressText").remove();
				$('#'+file.id).find(".attachRight").append('<span class="attachDel"></span>');
				$('#'+file.id).find(".attachDel").show();
				$('#'+file.id).find(".attachInfo").find("p").html(renderSize(file.size));
			}
		}
		var data = responseObject.response;
		var dataObj=eval("("+data+")");
		//执行回调函数
		if(typeof fileCallBack ==='function'){
			fileCallBack(dataObj, elementId, file.id);
		}
	});

	//当上传队列出现异常后触发
	uploader.bind('Error',function(uploader,errObject){
		if(errObject.message){
			var err = errObject.message;
			if(err.indexOf("Duplicate file error")> -1){
				RichTextUitl.showTips('上传文件重复');
			}else{
				RichTextUitl.showTips(errObject.message);
			}
		}else{
			RichTextUitl.showTips('上传失败');
		}
		//从上传队列中移除文件
		uploader.removeFile(errObject.file);
	});

	//当文件添加到上传队列后触发
	uploader.bind('FilesAdded',function(uploader,files){
		uploader.start(); //调用实例对象的start()方法开始上传文件
	});
	
	uploader.bind('UploadProgress',function(uploader,file){
		if(file.type=='image/png'||file.type=='image/jpeg'){//图片文件
			$('#'+file.id).prev().css("width",""+(file.percent-1)+"%");
			$('#'+file.id).html((file.percent-1)+"%");
			//100放到服务端返回数据之后才显示
		}else{//其他文件
			$('#'+file.id).find(".attachProgress").css("width",""+(file.percent-1)+"%");
			$('#'+file.id).find(".attachProgressText").html((file.percent-1)+"%");
			//100放到服务端返回数据之后才显示
		}
	});
	// 所有文件上传成功后调用 
	uploader.bind('UploadComplete', function () {
	    //清空队列
		uploader.splice();
	});
}
//格式化文件大小
function renderSize(value){
    if(null==value||value==''||isNaN(value)){
        return "0 Bytes";
    }
    var unitArr = new Array("Bytes","KB","MB","GB","TB","PB","EB","ZB","YB");
    var index=0;
    var srcsize = parseFloat(value);
    index=Math.floor(Math.log(srcsize)/Math.log(1024));//此处运用对数的换底公式，得出srcsize是1024的多少次方，并向下取整，从而得出单位
    var size =srcsize/Math.pow(1024,index);//1024的index次幂
    size=size.toFixed(2);//保留的小数位数
    return size+unitArr[index];
}