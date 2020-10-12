const logger = require("./Logger");
logger.info("Router.js-Initialize");

const ipc = require("electron").ipcRenderer;
const remote = require("electron").remote;

/**
 * 打开新窗口
 * @kind RendererProcessOnly [仅渲染进程调用]
 * @param {string} view 新窗口的视图名称
 * @param {any} sendArgs 传递给新窗口的参数信息
 */
function openNewWindow(view, sendArgs) {
  logger.info(
    "[Router][openNewWindow]收到路由请求 界面 " + view + " 参数 " + sendArgs
  );
  remote.getGlobal("sharedObject").args.default = sendArgs;
  ipc.send("router", view);
}

/**
 * 获取本窗口打开之前传来的参数
 * @kind RendererProcessOnly [仅渲染进程调用]
 * @return any
 */
function getWindowArgs() {
  logger.info("[Router][getWindowArgs]获取视图参数");
  return remote.getGlobal("sharedObject").args.default;
}

module.exports = { openNewWindow, getWindowArgs };
