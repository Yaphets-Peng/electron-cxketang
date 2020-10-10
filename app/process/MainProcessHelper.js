//用于创建原生浏览器窗口的组件对象
const { BrowserWindow, Tray, Menu } = require("electron"); //引入electron
const path = require("path"); //原生库path模块

const logger = require("../common/Logger"); //引入全局日志组件
const config = require("../common/Config"); //引入全局配置组件
const userInfo = require("../common/User"); //引入全局用户组件

// 为了保证一个对全局windows对象的引用，就必须在方法体外声明变量
// 否则当方法执行完成时就会被JavaScript的垃圾回收机制清理
let mainWindow;
let tray = null;

/* ↓全局变量配置区开始↓ */

//全局路由参数传递缓冲区
global.sharedObject = {
  args: {
    default: "default_arg",
  },
};

//全局状态机共享区
let statusMap = new Map();
statusMap.set("default", "default_value");
global.sharedStatus = {
  statusMap: statusMap, //全局状态对象
};

//全局窗口记录
let windowMap = new Map();
global.sharedWindow = {
  windowMap: windowMap, //全局窗口对象
};

/* ↑全局变量配置区结束↑ */

function createMainWindow() {
  logger.info("[MainProcessHelper][createMainWindow]初始化渲染窗口");

  // 创建浏览器窗口
  var mainWindowConfig = config.getConfigVal("default_window");
  mainWindowConfig.icon = path.join(
    path.resolve(__dirname, ".."),
    config.getConfigVal("icon")
  );
  mainWindow = new BrowserWindow(mainWindowConfig);

  // 引入主入口界面
  if (userInfo.isLogin()) {
    // 已登录
    //TODO 主入口改为配置项
    mainWindow.loadFile(config.getConfigVal("firstview") + ".html");
  } else {
    // 未登录
    mainWindow.loadFile(config.getConfigVal("loginview") + ".html");
  }

  if (config.getConfigVal("debug")) {
    // 打开开发者工具
    mainWindow.webContents.openDevTools(); //TODO 改为调试模式配置项
  }

  // 当窗口关闭时触发
  mainWindow.on("closed", function () {
    logger.info("[MainProcessHelper][_mainWindow_.on._closed_]渲染窗口关闭");
    //将全局mainWindow置为null
    mainWindow = null;
  });

  // 窗口关闭回调
  mainWindow.on("close", (event) => {
    mainWindow.hide();
    mainWindow.setSkipTaskbar(true);
    event.preventDefault();
  });

  // 窗口显示
  mainWindow.on("show", () => {
    console.log("show");
  });
  // 窗口隐藏
  mainWindow.on("hide", () => {
    console.log("hide");
  });

  //创建系统通知区菜单
  tray = new Tray(
    path.join(path.resolve(__dirname, ".."), config.getConfigVal("icon"))
  );

  // 托盘按钮
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "退出",
      click: () => {
        mainWindow.destroy();
      },
    },
  ]);
  tray.setToolTip("超星课堂");
  tray.setContextMenu(contextMenu);
  tray.on("click", () => {
    //我们这里模拟桌面程序点击通知区图标实现打开关闭应用的功能
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    mainWindow.isVisible()
      ? mainWindow.setSkipTaskbar(false)
      : mainWindow.setSkipTaskbar(true);
  });
}

/**
 * 返回全局mainWindow对象
 */
function getMainWindow() {
  return mainWindow;
}

/* ↓路由功能开始↓ */

/**
 * 打开新窗口并传递参数
 * @kind MainProcessOnly [仅能主进程调用]
 * @param {string} view 视图名称
 * @param {any} args 传递给新的视图的参数对象
 */
function openNewWindow(view, args) {
  if (args != null) {
    global.sharedObject.args.default = args; //保存路由传递参数到缓冲区
  }
  var viewWindow = global.sharedWindow.windowMap.get(view);
  if (!viewWindow) {
    // 创建浏览器窗口
    var viewWindowConfig = config.getConfigVal("default_window");
    if (global.sharedObject.args.default != null) {
      // 处理参数中的宽高
      var viewWindowArgs = global.sharedObject.args.default.window;
      if (viewWindowArgs) {
        var viewWindowWidth = viewWindowArgs.width;
        if (viewWindowWidth) {
          viewWindowConfig.width = viewWindowWidth;
        }
        var viewWindowHeight = viewWindowArgs.height;
        if (viewWindowHeight) {
          viewWindowConfig.height = viewWindowHeight;
        }
      }
    }
    viewWindowConfig.icon = path.join(
      path.resolve(__dirname, ".."),
      config.getConfigVal("icon")
    );
    viewWindow = new BrowserWindow(viewWindowConfig);
    const modalPath = path.join(
      path.resolve(__dirname, ".."),
      "/view/" + view + ".html"
    );
    /*  const modalPath = path.join(
      "file://",
      path.resolve(__dirname, ".."),
      "/view/" + view + ".html"
    ); */
    logger.info("[MainProcessHelper][openNewWindow]新视图 " + view + " 已加载");
    viewWindow.loadFile(modalPath);
    if (config.getConfigVal("debug")) {
      // 打开开发者工具
      viewWindow.webContents.openDevTools(); //TODO 改为调试模式配置项
    }

    // 窗口关闭的监听
    viewWindow.on("closed", (event) => {
      global.sharedWindow.windowMap.delete(view);
      viewWindow = null;
    });
    // 放入全局窗口中
    global.sharedWindow.windowMap.set(view, viewWindow);
  } else {
    viewWindow.show();
  }
}

/**
 * 获取传递给当前窗口的参数
 * @kind MainProcessOnly [仅能主进程调用]
 * @return any 路由变量
 */
function getRouterArgs() {
  return global.sharedObject.args.default; //返回全局
}

const ipcMain = require("electron").ipcMain; //ipcMain进程对象

//ipcMain收到router信号
ipcMain.on("router", function (sys, view) {
  logger.info(
    "[MainProcessHelper][_router_]主进程main.js收到跳转指令信号 目标视图 " +
      view
  );
  openNewWindow(view);
});

/**
 * 注册主进程收到特定信号的回调函数
 * @kind MainProcessOnly [仅主进程]
 * @param {string} signal 收到的信号量
 * @param {function} callback 回调函数
 */
function registeCallback(signal, callback) {
  if (typeof callback === "function") {
    ipcMain.on(signal, (sys, args) => {
      callback(args, sys);
    });
  }
}

module.exports = { createMainWindow, getMainWindow, openNewWindow };
