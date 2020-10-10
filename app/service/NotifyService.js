const logger = require("../common/Logger"); //日志模块
const config = require("../common/Config"); //配置模块

const notifier = require("electron-notifications"); //notifiacation组件

/**
 * 通知用户
 * @param {string} title 通知标题
 * @param {string} message 通知内容
 * @param {function} clickBtnCallback [可选]点击按钮执行的回调函数
 */
function notifiyUser(title, message, clickBtnCallback) {
  logger.info("[NotifyService][notifiyUser]通知用户 " + title + " " + message);
  const notification = notifier.notify(title, {
    message: message,
    buttons: ["查看详情"],
    duration: config.getConfigVal("notifyTimeOut"),
    falt: true,
  });
  notification.on("buttonClicked", (text, buttonIndex, options) => {
    if (buttonIndex == 0) {
      if (clickBtnCallback) {
        clickBtnCallback();
      }
    }
    notification.close();
  });
  notification.on("clicked", function () {
    if (clickBtnCallback) {
      clickBtnCallback();
    }
    notification.close();
  });
}

/**
 * 有错误消息时通知用户
 * @param {string} title 通知标题
 * @param {string} message 通知内容
 * @param {function} clickBtnCallback [可选]点击按钮执行的回调函数
 */
function notifiyUserWhenError(title, message, clickBtnCallback) {
  logger.warn(
    "[NotifyService][notifiyUserWhenError][!!错误!!]通知用户 " +
      title +
      " " +
      message
  );
  const notification = notifier.notify(title, {
    message: message,
    buttons: ["错误详情"],
    duration: config.getConfigVal("notifyTimeOut"),
    falt: true,
  });
  notification.on("buttonClicked", (text, buttonIndex, options) => {
    if (buttonIndex == 0) {
      alert("错误标题：" + title + "\n错误详情：" + message);
      notification.close();
    }
    if (clickBtnCallback) {
      clickBtnCallback();
    }
    notification.close();
  });
  notification.on("clicked", function () {
    notification.close();
  });
}

module.exports = {
  notifiyUserWhenError,
  notifiyUser,
};
