const {session} = require("electron"); //引入electron的session
const config = require("./Config"); //引入全局配置组件

const cookieUrl = config.getConfigVal("cookie_url");
const cookieKey = config.getConfigVal("cookie_key");

// cookie用法参考https://www.electronjs.org/docs/api/cookies
// Promise具体用法参考https://www.jianshu.com/p/1b63a13c2701
// sync await具体用法参考https://www.cnblogs.com/jasondan/p/3989382.html或https://www.jianshu.com/p/600e34931f2a

// 初始化
function init() {
    //检测cookies变动事件，标记cookies发生变化
    session.defaultSession.cookies.on("changed", function (event, cookie, cause, removed) {
        if (cookie.name === cookieKey.UID) {
            if (removed) {
                global.userInfo.UID = null;
            } else {
                global.userInfo.UID = cookie.value;
            }
        } else if (cookie.name === cookieKey.vc) {
            if (removed) {
                global.userInfo.vc = null;
            } else {
                global.userInfo.vc = cookie.value;
            }
        } else if (cookie.name === cookieKey.vc3) {
            if (removed) {
                global.userInfo.vc3 = null;
            } else {
                global.userInfo.vc3 = cookie.value;
            }
        } else if (cookie.name === cookieKey._d) {
            if (removed) {
                global.userInfo._d = null;
            } else {
                global.userInfo._d = cookie.value;
            }
        }
    });
    // 初始化获取cookie值
    session.defaultSession.cookies.get({"url": cookieUrl, "name": cookieKey.UID}).then((cookies) => {
        if (cookies && cookies.length > 0) {
            global.userInfo.UID = cookies[0].value;
        }
    }).catch((error) => {
        console.log(error);
    });
}

// 获取所有cookies,注意返回对象Promise
function getCookiesCore() {
    return session.defaultSession.cookies.get({"url": cookieUrl});
}

// 获取指定cookie,注意返回对象Promise
function getCookieCore(name) {
    return session.defaultSession.cookies.get({"url": cookieUrl, "name": name});
}

// 获取指定cookie
function getCookies() {
    return getCookiesCore();
}

// 获取指定cookie
function getCookieValue(name) {
    return getCookieCore(name);
}


function getUID() {
    return global.userInfo.UID;
}

function getVC() {
    return global.userInfo.vc;
}

function getVC3() {
    return global.userInfo.vc3;
}

function getD() {
    return global.userInfo._d;
}

// 获取指定用户id
function getCookieUserId() {
    return global.userInfo.UID;
}

// 判断你是否登录
function isLogin() {
    let userId = getCookieUserId();
    if (userId != null) {
        return true;
    }
    return false;
}

module.exports = {
    getCookies,
    getCookieValue,
    init,
    getUID,
    getVC,
    getVC3,
    getD,
    getCookieUserId,
    isLogin,
}
