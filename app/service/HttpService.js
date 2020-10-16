const logger = require("../common/Logger"); //日志模块
const urlHelper = require("../common/UrlHelper");
const axiosMain = require("axios"); //http请求库http://www.axios-js.com或https://github.com/axios/axios
const Qs = require("qs");

logger.info("HttpService-Initialize");


/**
 * 发送http-get请求并执行回调函数
 * @param {string} url 目标url
 * @param {object} params 参数对象列表 eg：{"name":"T1","par2":"par2val"}
 * @param {function} callback 回调函数
 */
function get(url, params, callback, errorBack) {
    logger.info("[HttpService][sendRequestAndRunCallBack]发送http请求" + url + ",params" + Qs.stringify(params));
    axiosMain.get(urlHelper.queryString(url, params), {timeout: 1000 * 10}).then((response) => {
        if (callback) {
            callback(response.data);
        }
    }).catch(function (error) {
        console.log(error);
        if (errorBack) {
            errorBack(error);
        }
    });
}

/**
 * 发送http-post请求并执行回调函数
 * @param {string} url 目标url
 * @param {object} params 参数对象列表 eg：{"name":"T1","par2":"par2val"}
 * @param {function} callback 回调函数
 */
function post(url, params, callback, errorBack) {
    logger.info("[HttpService][sendRequestAndRunCallBack]发送http请求" + url + ",params" + Qs.stringify(params));
    axiosMain.post(url, Qs.stringify(params), {timeout: 1000 * 10}).then((response) => {
        if (callback) {
            callback(response.data);
        }
    }).catch(function (error) {
        console.log(error);
        if (errorBack) {
            errorBack(error);
        }
    });
}

module.exports = {get, post};
