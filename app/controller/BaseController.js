const router = require("../common/Router"); //路由模块

function openNewWindow(view, args) {
  router.openNewWindow(view, args);
}

function getWindowArgs() {
  return router.getWindowArgs();
}

module.exports = { openNewWindow, getWindowArgs };
