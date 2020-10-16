const logger = require("../common/Logger"); //日志模块
const urlHelper = require("../common/UrlHelper");
const sessionCookie = require("../common/SessionCookie");
const axios = require("axios"); //http请求库http://www.axios-js.com或https://github.com/axios/axios
const Qs = require("qs");

logger.info("HttpService-Initialize");


/**
 * 发送http-get请求并执行回调函数
 * @param {string} url 目标url
 * @param {object} params 参数对象列表 eg：{"name":"T1","par2":"par2val"}
 * @param {function} callback 回调函数
 */
function get(url, params, callback, errorBack) {
    let cookies = "";
    let UID = sessionCookie.getUID();
    if (UID != null) {
        cookies += "UID=" + UID + ";";
    }
    let vc = sessionCookie.getVC();
    if (vc != null) {
        cookies += "vc=" + vc + ";";
    }
    let vc3 = sessionCookie.getVC3();
    if (vc3 != null) {
        cookies += "vc3=" + vc3 + ";";
    }
    let _d = sessionCookie.getD();
    if (_d != null) {
        cookies += "_d=" + _d + ";";
    }
    logger.info("[HttpService][sendRequestAndRunCallBack]发送http请求" + url + ",params" + Qs.stringify(params));
    axios.get(urlHelper.queryString(url, params), {timeout: 1000 * 10, "cookie": cookies}).then((response) => {
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
    let cookies = "";
    let UID = sessionCookie.getUID();
    if (UID != null) {
        cookies += "UID=" + UID + ";";
    }
    let vc = sessionCookie.getVC();
    if (vc != null) {
        cookies += "vc=" + vc + ";";
    }
    let vc3 = sessionCookie.getVC3();
    if (vc3 != null) {
        cookies += "vc3=" + vc3 + ";";
    }
    let _d = sessionCookie.getD();
    if (_d != null) {
        cookies += "_d=" + _d + ";";
    }
    logger.info("[HttpService][sendRequestAndRunCallBack]发送http请求" + url + ",params" + Qs.stringify(params));
    axios.post(url, Qs.stringify(params), {timeout: 1000 * 10, "cookie": cookies}).then((response) => {
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
