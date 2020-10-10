var logger = require("../common/Logger"); //日志模块
logger.info("HttpService-Initialize");

var unirest = require("unirest"); //轻量级http请求库

/**
 * 发送http-post请求并执行回调函数
 * @param {string} url 目标url
 * @param {object} params 参数对象列表 eg：{"name":"T1","par2":"par2val"}
 * @param {function} callback 回调函数
 */
function sendRequestAndRunCallBack(url, params, callback) {
  logger.info("[HttpService][sendRequestAndRunCallBack]发送http请求" + url);
  logger.info(params);
  var req = unirest.post(url);
  req
    .header("Content-Type", "application/json")
    .header("Accept", "application/json")
    .send(params)
    .end(function (data) {
      if (data.code == 200) {
        logger.info("[HttpService][sendRequestAndRunCallBack]正常返回");
        callback(data.body);
      } else {
        logger.warn(data);
      }
    });
}

module.exports = { sendRequestAndRunCallBack };
