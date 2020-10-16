const {session} = require("electron"); //引入electron的session
const config = require("./Config"); //引入全局配置组件

const cookieUrl = config.getConfigVal("cookie_url");
const cookieKey = config.getConfigVal("cookie_key");

// 内存中用户信息
let userId = null;
let vc = null;
let vc3 = null;
let _d = null;

// cookie用法参考https://www.electronjs.org/docs/api/cookies
// Promise具体用法参考https://www.jianshu.com/p/1b63a13c2701
// sync await具体用法参考https://www.cnblogs.com/jasondan/p/3989382.html或https://www.jianshu.com/p/600e34931f2a

// 初始化
function init() {
    //检测cookies变动事件，标记cookies发生变化
    session.defaultSession.cookies.on("changed", function (event, cookie, cause, removed) {
        if (cookie.name === cookieKey.UID) {
            if (removed) {
                userId = null;
            } else {
                userId = cookie.value;
            }
        } else if (cookie.name === cookieKey.vc) {
            if (removed) {
                vc = null;
            } else {
                vc = cookie.value;
            }
        } else if (cookie.name === cookieKey.vc3) {
            if (removed) {
                vc3 = null;
            } else {
                vc3 = cookie.value;
            }
        } else if (cookie.name === cookieKey._d) {
            if (removed) {
                _d = null;
            } else {
                _d = cookie.value;
            }
        }
    });
    // 初始化获取cookie值
    session.defaultSession.cookies.get({"url": cookieUrl, "name": cookieKey.UID}).then((cookies) => {
        if (cookies && cookies.length > 0) {
            userId = cookies[0].value;
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
    return userId;
}

function getVC() {
    return vc;
}

function getVC3() {
    return vc3;
}

function getD() {
    return _d;
}

// 获取指定用户id
function getCookieUserId() {
    return userId;
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
