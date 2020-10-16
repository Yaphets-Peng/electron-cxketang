const router = require("../common/Router"); //路由模块

function openNewWindow(view, args) {
    router.openNewWindow(view, args);
}

function getWindowArgs() {
    return router.getWindowArgs();
}

function getUserInfo() {
    return router.getUserInfo();
}

module.exports = {openNewWindow, getWindowArgs, getUserInfo};
