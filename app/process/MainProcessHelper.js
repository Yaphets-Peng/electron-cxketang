//用于创建原生浏览器窗口的组件对象
const electron = require("electron");
const {app, shell, BrowserWindow, dialog, powerSaveBlocker, Tray, Menu} = electron; //引入electron
const path = require("path"); //原生库path模块

const {v4: uuidv4} = require('uuid');// 引入uuid工具类
const md5 = require('md5');// 引入md5工具类
const logger = require("../common/Logger"); //引入全局日志组件
const config = require("../common/Config"); //引入全局配置组件
const sessionCookie = require("../common/SessionCookie"); //引入全局sessionCookie组件
const urlHelper = require("../common/UrlHelper");
const activeWinHelper = require("../ext/win-info"); //活动窗口组件

// 为了保证一个对全局windows对象的引用，就必须在方法体外声明变量
// 否则当方法执行完成时就会被JavaScript的垃圾回收机制清理
let mainWindow = null;
let tray = null;
// 主窗口uuid和level
const mainWindowUUID = "mainWindow";
const mainWindowLevel = 1;
// 会议窗口uuid
const meetWindowUUID = "meetWindow";
// 投屏工具栏窗口uuid
const screenToolsWindowUUID = "screenTools";
// 选择投屏窗口uuid
const choseScreenWindowUUID = "choseScreen";
// 视屏窗口uuid
const openVideoBoxWindowUUID = "openVideoBox";

// 消息发送相关
// 主-InjectRtcAudioVideoScreenUtil.js
let meetToolsFormMainChannel = "meetToolsFormMain";
// 主-box.html
let meetToolsMessageFormMainChannel = "meetToolsMessageFormMain";
// 主-choseScreen.html
let meetChosesMessageFormMainChannel = "meetChosesMessageFormMain";
// 主-videoBox.html
let meetVideoMessageFormMainChannel = "meetVideoMessageFormMain";

// 防止休眠设置
let blockerId = null;

/* ↓全局变量配置区开始↓ */

//全局路由参数传递缓冲区
global.sharedObject = {
    args: {
        default: "default_arg",
    },
};

//全局窗口记录
let windowMap = new Map();
global.sharedWindow = {
    windowMap: windowMap, //全局窗口对象
};

// 全局用户信息
global.userInfo = {
    UID: null,
    vc: null,
    vc3: null,
    _d: null,
};

/* ↑全局变量配置区结束↑ */

function createMainWindow() {
    // 清空所有菜单
    //Menu.setApplicationMenu(Menu.buildFromTemplate([]));
    //Menu.setApplicationMenu(null);

    logger.info("[SessionCookie][init]初始化cookie");
    sessionCookie.init();

    logger.info("[MainProcessHelper][createMainWindow]初始化渲染窗口");

    // 生成窗口唯一uuid值
    let windowUUID = mainWindowUUID;
    // 生成窗口层级主窗口默认为1
    let windowLevel = mainWindowLevel;
    // 创建浏览器窗口
    let mainWindowConfig = config.getConfigVal("main_window");
    //更新标题和图标
    mainWindowConfig.title = config.getConfigVal("title");
    mainWindowConfig.icon = path.join(
        path.resolve(__dirname, ".."),
        config.getConfigVal("icon")
    );
    // 放入窗口唯一值
    mainWindowConfig.customUUID = windowUUID;
    mainWindowConfig.customLevel = windowLevel;
    mainWindow = new BrowserWindow(mainWindowConfig);

    // 引入主入口界面
    mainWindow.loadURL(config.getUrlPathConfigVal("main_url"));

    if (config.getConfigVal("debug")) {
        // 打开开发者工具
        mainWindow.webContents.openDevTools();
    }

    // 删除菜单
    mainWindow.removeMenu();

    // 防止休眠设置
    blockerId = powerSaveBlocker.start("prevent-display-sleep");

    // 放入窗口集合中
    global.sharedWindow.windowMap.set(windowUUID, mainWindow);

    // 窗口监控
    all_win_event(mainWindow);

    // 当窗口关闭时触发
    mainWindow.on("closed", function () {
        logger.info("[MainProcessHelper][_mainWindow_.on._closed_]渲染窗口关闭");
        // 关闭休眠
        powerSaveBlocker.stop(blockerId);
        //将全局mainWindow置为null
        global.sharedWindow.windowMap.delete(windowUUID);
        mainWindow = null;
    });

    /*// 窗口关闭回调
    mainWindow.on("close", (event) => {
        if (process.platform !== "darwin") {
            mainWindow.hide();
            mainWindow.setSkipTaskbar(true);
            event.preventDefault();
        } else {
            // mac销毁托盘
            if (tray != null) {
                tray.destroy();
                tray = null;
            }
        }
        /!*mainWindow.hide();
        mainWindow.setSkipTaskbar(true);
        event.preventDefault();*!/
    });

    //创建系统通知区菜单
    tray = new Tray(
        path.join(path.resolve(__dirname, ".."), config.getConfigVal("trayIcon"))
    );

    // 托盘按钮
    const contextMenu = Menu.buildFromTemplate([
        {
            label: "显示",
            click: () => {
                if (global.sharedWindow.windowMap.size > 1) {
                    // 循环判断窗口
                    global.sharedWindow.windowMap.forEach(function (value, key) {
                        if (key !== mainWindowUUID) {
                            value.flashFrame(true);
                            //value.show();
                            return;
                        }
                    });
                } else {
                    // 显示任务栏
                    mainWindow.setSkipTaskbar(false);
                    // 闪烁提醒
                    //mainWindow.flashFrame(true);
                    // 显示聚焦
                    mainWindow.show();
                    // 显示不聚焦
                    //mainWindow.showInactive();
                }
            },
        },
        {
            label: "退出",
            click: () => {
                if (process.platform !== "darwin") {
                    mainWindow.destroy();
                    mainWindow = null;
                    app.quit();
                } else {
                    // 循环关闭窗口
                    global.sharedWindow.windowMap.forEach(function (value, key) {
                        if (key !== mainWindowUUID) {
                            value.destroy();
                            console.log("[MainProcessHelper][closeWindow]视图 " + key + " 已关闭");
                        }
                    });
                    // 销毁托盘
                    if (tray != null) {
                        tray.destroy();
                        tray = null;
                    }
                    // 销毁主窗口
                    mainWindow.destroy();
                    mainWindow = null;
                }
            },
        },
    ]);
    tray.setToolTip("超星课堂");
    tray.setContextMenu(contextMenu);
    tray.on("click", () => {
        if (!sessionCookie.isLogin()) {
            return;
        }
        if (global.sharedWindow.windowMap.size > 1) {
            // 循环判断窗口
            global.sharedWindow.windowMap.forEach(function (value, key) {
                if (key !== mainWindowUUID) {
                    value.flashFrame(true);
                    //value.show();
                    return;
                }
            });
        } else {
            // 显示任务栏
            mainWindow.setSkipTaskbar(false);
            // 闪烁提醒
            //mainWindow.flashFrame(true);
            // 显示聚焦
            mainWindow.show();
            // 显示不聚焦
            //mainWindow.showInactive();
        }
    });*/
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
    // 未登录
    if (!sessionCookie.isLogin()) {
        return;
    }
    // 打开窗口逻辑
    if (args != null) {
        global.sharedObject.args.default = args; //保存路由传递参数到缓冲区
    }
    let viewWindow = global.sharedWindow.windowMap.get(view);
    if (!viewWindow) {
        let isWeb = false;
        let defaultArgs = global.sharedObject.args.default;
        // 创建浏览器窗口
        let viewWindowConfig = config.getConfigVal("default_window");
        if (defaultArgs != null) {
            // 是否是网页
            if (defaultArgs.isWeb) {
                isWeb = true;
                viewWindowConfig = config.getConfigVal("web_window");
            }
            // 处理参数中的宽高
            let viewWindowArgs = defaultArgs.window;
            if (viewWindowArgs) {
                let viewWindowWidth = viewWindowArgs.width;
                if (viewWindowWidth) {
                    viewWindowConfig.width = viewWindowWidth;
                }
                let viewWindowHeight = viewWindowArgs.height;
                if (viewWindowHeight) {
                    viewWindowConfig.height = viewWindowHeight;
                }
            }
        }
        //更新标题和图标
        viewWindowConfig.title = config.getConfigVal("title");
        //更新标题和图标
        viewWindowConfig.title = config.getConfigVal("title");
        viewWindowConfig.icon = path.join(
            path.resolve(__dirname, ".."),
            config.getConfigVal("icon")
        );
        // 放入窗口唯一值
        viewWindowConfig.uuid = uuidv4();
        viewWindow = new BrowserWindow(viewWindowConfig);
        logger.info("[MainProcessHelper][openNewWindow]新视图 " + view + " 已加载");
        if (isWeb) {
            viewWindow.loadURL(view);
            win_event(viewWindow);
        } else {
            const modalPath = path.join(
                path.resolve(__dirname, ".."),
                "/view/" + view + ".html"
            );
            /*  const modalPath = path.join(
              "file://",
              path.resolve(__dirname, ".."),
              "/view/" + view + ".html"
            ); */
            viewWindow.loadFile(modalPath);
        }
        if (config.getConfigVal("debug")) {
            // 打开开发者工具
            viewWindow.webContents.openDevTools();
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

// 监控窗口浏览器事件
function all_win_event(win) {
    // 拦截window.open事件
    win.webContents.on("new-window", function (event, url, frameName, disposition, options, additionalFeatures, referrer, postBody) {
        // 事件拦截
        if (url.startsWith("cxkt://openUrlOnBrowser?url=")) {
            // 用默认浏览器打开地址
            let openBrowserUrl = url.replace("cxkt://openUrlOnBrowser?url=", "");
            //shell.openExternal(decodeURIComponent(openBrowserUrl));
            shell.openExternal(openBrowserUrl);
            event.preventDefault();
            return;
        }
        // 当前窗口值
        let nowWindowUUID = event.sender.browserWindowOptions.customUUID;
        let nowWindowLevel = event.sender.browserWindowOptions.customLevel;
        // 生成窗口唯一uuid值
        let windowUUID = md5(url);
        if (url.startsWith(config.getUrlPathConfigVal("open_meet_url"))) {
            // 如果是会议
            windowUUID = meetWindowUUID;
        }
        let windowLevel = nowWindowLevel + 1;
        // 获取窗口集合中
        let childWindow = global.sharedWindow.windowMap.get(windowUUID);
        if (!childWindow) {
            // 默认配置项
            let webWindowConfig = config.getConfigVal("web_window");

            // 链接中width
            let viewWindowWidth = getUrlParamValue(url, "windowWidth");
            if (viewWindowWidth) {
                webWindowConfig.width = parseInt(viewWindowWidth);
            }
            // 链接中height
            let viewWindowHeight = getUrlParamValue(url, "windowHeight");
            if (viewWindowHeight) {
                webWindowConfig.height = parseInt(viewWindowHeight);
            }

            // 链接中minWidth
            let viewWindowMinWidth = getUrlParamValue(url, "minWindowWidth");
            if (viewWindowMinWidth) {
                webWindowConfig.minWidth = parseInt(viewWindowMinWidth);
            }
            // 链接中minHeight
            let viewWindowMinHeight = getUrlParamValue(url, "minWindowHeight");
            if (viewWindowMinHeight) {
                webWindowConfig.minHeight = parseInt(viewWindowMinHeight);
            }

            // 链接中是否可拖拽
            let viewWindowDrag = getUrlParamValue(url, "canDragWindowSize");
            if (viewWindowDrag) {
                if (viewWindowDrag === "true") {
                    webWindowConfig.resizable = true;
                    webWindowConfig.maximizable = true;
                    webWindowConfig.fullscreenable = true;
                } else {
                    webWindowConfig.resizable = false;
                    webWindowConfig.maximizable = false;
                    webWindowConfig.fullscreenable = false;
                }
            } else {
                // 链接中resizable固定大小（弃用）
                let viewWindowFixedSize = getUrlParamValue(url, "fixedWindowSize");
                if (viewWindowFixedSize) {
                    if (viewWindowFixedSize === "true") {
                        webWindowConfig.resizable = false;
                        webWindowConfig.maximizable = false;
                        webWindowConfig.fullscreenable = false;
                    } else {
                        webWindowConfig.resizable = true;
                        webWindowConfig.maximizable = true;
                        webWindowConfig.fullscreenable = true;
                    }
                }
            }

            // 链接中canMaximizeWindow是否可最大化
            let viewWindowMaximizable = getUrlParamValue(url, "canMaximizeWindow");
            if (viewWindowMaximizable) {
                if (viewWindowMaximizable === "true") {
                    webWindowConfig.maximizable = true;
                    webWindowConfig.fullscreenable = true;
                } else {
                    webWindowConfig.maximizable = false;
                    webWindowConfig.fullscreenable = false;
                }
            }
            //更新标题和图标
            webWindowConfig.title = config.getConfigVal("title");
            // 图标
            webWindowConfig.icon = path.join(
                path.resolve(__dirname, ".."),
                config.getConfigVal("icon")
            );

            // 设置主窗口和模态窗口
            // webWindowConfig.parent = mainWindow;
            // webWindowConfig.modal = true;

            // 会议链接判断
            let isMeeting = false;
            let isPreloadJs = false;
            let isTestDemo = false;
            if (url.startsWith(config.getUrlPathConfigVal("open_meet_url"))) {
                // 如果是会议
                isMeeting = true;
                isPreloadJs = true;
                //isTestDemo = true;
            }

            // 注入js脚本
            if (isPreloadJs) {
                // 开启nodejs
                webWindowConfig.webPreferences.nodeIntegration = true;
                webWindowConfig.webPreferences.enableRemoteModule = true;
                // 开启无框窗口
                webWindowConfig.frame = false;
                //webWindowConfig.titleBarStyle = "hidden";
                // 关闭请求跨域限制
                //webWindowConfig.webPreferences.webSecurity = false;
                // 如果是测试关闭注入
                if (!isTestDemo) {
                    // 注入脚本
                    webWindowConfig.webPreferences.preload = path.join(path.resolve(__dirname, ".."), "/controller/preload.js");
                }
            }
            // 放入窗口唯一uuid值
            webWindowConfig.customUUID = windowUUID;
            webWindowConfig.customLevel = windowLevel;
            webWindowConfig.customParentUUID = nowWindowUUID;
            webWindowConfig.customParentLevel = nowWindowLevel;
            // 是否需要刷新父页面
            if (url.startsWith(config.getUrlPathConfigVal("meet_setting_url"))) {
                webWindowConfig.customParentRefresh = true;
            }
            // 创建窗口
            childWindow = new BrowserWindow(webWindowConfig);

            if (config.getConfigVal("debug")) {
                // 打开开发者工具
                childWindow.webContents.openDevTools();
            }

            // 关闭菜单
            childWindow.removeMenu();

            // 如果是打开会议链接
            if (isMeeting) {
                if (config.getConfigVal("meet_debug")) {
                    childWindow.webContents.openDevTools();
                }
            }
            // 如果是打开会议链接
            if (isTestDemo) {
                let meetuuid = urlHelper.getQueryStringByUrl(url, "uuid");
                // 通过js来获取对象上token
                let runJsCodeTemp = "document.querySelector(\".meeting_record_item[data_uuid='" + meetuuid + "']\").getAttribute(\"data_tokens\")";
                mainWindow.webContents.executeJavaScript(runJsCodeTemp).then((meetTokens) => {
                    runJsCodeTemp = "document.querySelector(\".meeting_record_item[data_uuid='" + meetuuid + "']\").getAttribute(\"data_qrcode\")";
                    mainWindow.webContents.executeJavaScript(runJsCodeTemp).then((meetQrcode) => {
                        let urlAllParamValues = urlHelper.getUrlAllParamValues(url);
                        if (urlAllParamValues) {
                            urlAllParamValues = "?" + urlAllParamValues + "&tokens=";
                        } else {
                            urlAllParamValues = "?tokens=";
                        }
                        urlAllParamValues = urlAllParamValues + meetTokens + "&meetQrcode=" + meetQrcode;
                        childWindow.loadFile(path.join(path.resolve(__dirname, ".."), "/view/meeting.html"), {"search": urlAllParamValues});
                    });
                });
            } else {
                childWindow.loadURL(url);
            }
            logger.info("[MainProcessHelper][new-window]新视图 " + url + " 已加载");
            // 放入窗口集合中
            global.sharedWindow.windowMap.set(windowUUID, childWindow);
            //绑定事件
            all_win_event(childWindow);
            // 如果父窗口是一级
            if (mainWindow != null) {
                //隐藏父窗口
                mainWindow.hide();
            }
            // 当子窗口关闭前触发
            childWindow.on("close", function (e) {
                // 是否可关闭
                let isColseTemp = true;
                // 显示当前窗口
                e.sender.show();
                // 先判断是否存在对象
                let isHasBeforeWindowClose = false;
                let isHasBeforeunload = false;
                e.sender.webContents.executeJavaScript("typeof beforeWindowClose").then((result) => {
                    if (result === "function") {
                        isHasBeforeWindowClose = true;
                        // 存在执行此方法获取返回值
                        return e.sender.webContents.executeJavaScript("beforeWindowClose()");
                    }
                }).then((result) => {
                    if (isHasBeforeWindowClose) {
                        if (result === "1") {
                            isColseTemp = false;
                        } else {
                            isColseTemp = true;
                        }
                    } else {
                        // 判断是否有其它事件
                        return e.sender.webContents.executeJavaScript("typeof onbeforeunload");
                    }
                }).then((result) => {
                    if (result === "function") {
                        isHasBeforeunload = true;
                        // 判断是否有其它事件
                        return e.sender.webContents.executeJavaScript("onbeforeunload()");
                    }
                }).then((result) => {
                    if (isHasBeforeunload) {
                        if (result !== "undefined") {
                            isColseTemp = false;
                            // 关闭对话框
                            return dialog.showMessageBox(e.sender, {
                                type: 'none',
                                buttons: ['Cancel', 'Ok'],
                                title: " ",
                                detail: result,
                                noLink: true
                            });
                        }
                    }
                }).then((result) => {
                    if (isHasBeforeunload) {
                        if (result === 1) {
                            isColseTemp = true;
                        }
                    }
                }).then(() => {
                    if (isColseTemp) {
                        // 销毁
                        e.sender.destroy();
                    }
                })
                e.preventDefault();
            });
            // 当子窗口关闭时触发
            childWindow.on("closed", function () {
                logger.info("[MainProcessHelper][_childWindow_.on._closed_]渲染窗口关闭url=" + url);
                if (mainWindow != null) {
                    if (webWindowConfig.customParentRefresh) {
                        // 刷新主窗口页面
                        mainWindow.webContents.reloadIgnoringCache();
                    }
                    if (global.sharedWindow.windowMap.size == 2) {
                        //显示父窗口
                        mainWindow.show();
                    }
                }
                // 删除窗口集合中
                global.sharedWindow.windowMap.delete(windowUUID);
            });
        } else {
            childWindow.show();
        }
        event.preventDefault();
    });
    // 拦截跳转
    win.webContents.on("will-navigate", function (event, url) {
        // 事件拦截
        if (url.startsWith("cxkt://openUrlOnBrowser?url=")) {
            // 用默认浏览器打开地址
            let openBrowserUrl = url.replace("cxkt://openUrlOnBrowser?url=", "");
            //shell.openExternal(decodeURIComponent(openBrowserUrl));
            shell.openExternal(openBrowserUrl);
            event.preventDefault();
            return;
        }
        // 当前窗口值
        let nowWindowUUID = event.sender.browserWindowOptions.customUUID;
        let nowWindow = global.sharedWindow.windowMap.get(nowWindowUUID);
        // 默认配置项
        let web_window = config.getConfigVal("web_window");
        // 默认宽高
        let web_windowWidth = web_window.width;
        let web_windowHeight = web_window.height;
        // 最小宽高
        let web_windowMinWidth = web_window.minWidth;
        let web_windowMinHeight = web_window.minHeight;
        // 最大化
        let web_windowMaximizable = web_window.maximizable;
        // 是否可拖拽大小
        let web_windowResizable = web_window.resizable;
        // 是否全屏
        let web_windowFullscreenable = web_window.fullscreenable;

        // 链接中width
        let viewWindowWidth = getUrlParamValue(url, "windowWidth") || web_windowWidth;
        // 链接中height
        let viewWindowHeight = getUrlParamValue(url, "windowHeight") || web_windowHeight;
        if (viewWindowWidth && viewWindowHeight) {
            if (nowWindow) {
                nowWindow.setSize(parseInt(viewWindowWidth), parseInt(viewWindowHeight));
                // 居中
                nowWindow.center();
            }
        }

        // 链接中minWidth
        let viewWindowMinWidth = getUrlParamValue(url, "minWindowWidth") || web_windowMinWidth;
        // 链接中minHeight
        let viewWindowMinHeight = getUrlParamValue(url, "minWindowHeight") || web_windowMinHeight;
        if (viewWindowMinWidth && viewWindowMinHeight) {
            if (nowWindow) {
                nowWindow.setMinimumSize(parseInt(viewWindowMinWidth), parseInt(viewWindowMinHeight));
            }
        }

        // 链接中是否可拖拽
        let viewWindowDrag = getUrlParamValue(url, "canDragWindowSize");
        if (viewWindowDrag) {
            if (viewWindowDrag === "true") {
                web_windowResizable = true;
                web_windowMaximizable = true;
                web_windowFullscreenable = true;
            } else {
                web_windowResizable = false;
                web_windowMaximizable = false;
                web_windowFullscreenable = false;
            }
        } else {
            // 链接中resizable固定大小（弃用）
            let viewWindowFixedSize = getUrlParamValue(url, "fixedWindowSize");
            if (viewWindowFixedSize) {
                if (viewWindowFixedSize === "true") {
                    web_windowResizable = false;
                    web_windowMaximizable = false;
                    web_windowFullscreenable = false;
                } else {
                    web_windowResizable = true;
                    web_windowMaximizable = true;
                    web_windowFullscreenable = true;
                }
            }
        }
        if (nowWindow) {
            nowWindow.setResizable(web_windowResizable);
        }

        // 链接中canMaximizeWindow是否可最大化
        let viewWindowMaximizable = getUrlParamValue(url, "canMaximizeWindow");
        if (viewWindowMaximizable) {
            if (viewWindowMaximizable === "true") {
                web_windowMaximizable = true;
                web_windowFullscreenable = true;
            } else {
                web_windowMaximizable = false;
                web_windowFullscreenable = false;
            }
        }
        if (nowWindow) {
            nowWindow.setMaximizable(web_windowMaximizable);
            nowWindow.setFullScreenable(web_windowFullscreenable);
        }

        // 关闭菜单
        if (nowWindow) {
            nowWindow.removeMenu();
        }
        logger.info("[MainProcessHelper][will-navigate]新视图 " + url + " 已加载");
    });
    // 拦截重定向
    win.webContents.on("will-redirect", function (event, url, isInPlace, isMainFrame, frameProcessId, frameRoutingId) {
        // 事件拦截
        if (url.startsWith("cxkt://openUrlOnBrowser?url=")) {
            // 用默认浏览器打开地址
            let openBrowserUrl = url.replace("cxkt://openUrlOnBrowser?url=", "");
            //shell.openExternal(decodeURIComponent(openBrowserUrl));
            shell.openExternal(openBrowserUrl);
            event.preventDefault();
            return;
        }
        // 上层窗口值
        let nowWindowUUID = event.sender.browserWindowOptions.customUUID;
        let nowWindow = global.sharedWindow.windowMap.get(nowWindowUUID);
        // 默认配置项
        let web_window = config.getConfigVal("web_window");
        // 默认宽高
        let web_windowWidth = web_window.width;
        let web_windowHeight = web_window.height;
        // 最小宽高
        let web_windowMinWidth = web_window.minWidth;
        let web_windowMinHeight = web_window.minHeight;
        // 最大化
        let web_windowMaximizable = web_window.maximizable;
        // 是否可拖拽大小
        let web_windowResizable = web_window.resizable;
        // 是否全屏
        let web_windowFullscreenable = web_window.fullscreenable;

        // 链接中width
        let viewWindowWidth = getUrlParamValue(url, "windowWidth") || web_windowWidth;
        // 链接中height
        let viewWindowHeight = getUrlParamValue(url, "windowHeight") || web_windowHeight;
        if (viewWindowWidth && viewWindowHeight) {
            if (nowWindow) {
                nowWindow.setSize(parseInt(viewWindowWidth), parseInt(viewWindowHeight));
                // 居中
                nowWindow.center();
            }
        }

        // 链接中minWidth
        let viewWindowMinWidth = getUrlParamValue(url, "minWindowWidth") || web_windowMinWidth;
        // 链接中minHeight
        let viewWindowMinHeight = getUrlParamValue(url, "minWindowHeight") || web_windowMinHeight;
        if (viewWindowMinWidth && viewWindowMinHeight) {
            if (nowWindow) {
                nowWindow.setMinimumSize(parseInt(viewWindowMinWidth), parseInt(viewWindowMinHeight));
            }
        }

        // 链接中是否可拖拽
        let viewWindowDrag = getUrlParamValue(url, "canDragWindowSize");
        if (viewWindowDrag) {
            if (viewWindowDrag === "true") {
                web_windowResizable = true;
                web_windowMaximizable = true;
                web_windowFullscreenable = true;
            } else {
                web_windowResizable = false;
                web_windowMaximizable = false;
                web_windowFullscreenable = false;
            }
        } else {
            // 链接中resizable固定大小（弃用）
            let viewWindowFixedSize = getUrlParamValue(url, "fixedWindowSize");
            if (viewWindowFixedSize) {
                if (viewWindowFixedSize === "true") {
                    web_windowResizable = false;
                    web_windowMaximizable = false;
                    web_windowFullscreenable = false;
                } else {
                    web_windowResizable = true;
                    web_windowMaximizable = true;
                    web_windowFullscreenable = true;
                }
            }
        }
        if (nowWindow) {
            nowWindow.setResizable(web_windowResizable);
        }

        // 链接中canMaximizeWindow是否可最大化
        let viewWindowMaximizable = getUrlParamValue(url, "canMaximizeWindow");
        if (viewWindowMaximizable) {
            if (viewWindowMaximizable === "true") {
                web_windowMaximizable = true;
                web_windowFullscreenable = true;
            } else {
                web_windowMaximizable = false;
                web_windowFullscreenable = false;
            }
        }
        if (nowWindow) {
            nowWindow.setMaximizable(web_windowMaximizable);
            nowWindow.setFullScreenable(web_windowFullscreenable);
        }

        // 关闭菜单
        if (nowWindow) {
            nowWindow.removeMenu();
        }

        logger.info("[MainProcessHelper][will-navigate]新视图 " + url + " 已加载重定向");
    });
}

// 监控新打开地址
function win_event(win) {
    win.webContents.on("new-window", function (
        event,
        url,
        fname,
        disposition,
        options
    ) {
        // 创建浏览器窗口
        let webWindowConfig = config.getConfigVal("web_window");

        // 链接中width
        let viewWindowWidth = getUrlParamValue(url, "windowWidth");
        if (viewWindowWidth) {
            webWindowConfig.width = parseInt(viewWindowWidth);
        }
        // 链接中height
        let viewWindowHeight = getUrlParamValue(url, "windowHeight");
        if (viewWindowHeight) {
            webWindowConfig.height = parseInt(viewWindowHeight);
        }

        // 链接中minWidth
        let viewWindowMinWidth = getUrlParamValue(url, "minWindowWidth");
        if (viewWindowMinWidth) {
            webWindowConfig.minWidth = parseInt(viewWindowMinWidth);
        }
        // 链接中minHeight
        let viewWindowMinHeight = getUrlParamValue(url, "minWindowHeight");
        if (viewWindowMinHeight) {
            webWindowConfig.minHeight = parseInt(viewWindowMinHeight);
        }

        // 链接中是否可拖拽
        let viewWindowDrag = getUrlParamValue(url, "canDragWindowSize");
        if (viewWindowDrag) {
            if (viewWindowDrag === "true") {
                webWindowConfig.resizable = true;
            } else {
                webWindowConfig.resizable = false;
            }
        } else {
            // 链接中resizable固定大小（弃用）
            let viewWindowFixedSize = getUrlParamValue(url, "fixedWindowSize");
            if (viewWindowFixedSize) {
                if (viewWindowFixedSize === "true") {
                    webWindowConfig.resizable = false;
                } else {
                    webWindowConfig.resizable = true;
                }
            }
        }

        // 链接中canMaximizeWindow是否可最大化
        let viewWindowMaximizable = getUrlParamValue(url, "canMaximizeWindow");
        if (viewWindowMaximizable) {
            if (viewWindowMaximizable === "true") {
                webWindowConfig.maximizable = true;
                webWindowConfig.fullscreenable = true;
            } else {
                webWindowConfig.maximizable = false;
                webWindowConfig.fullscreenable = false;
            }
        }
        //更新标题和图标
        webWindowConfig.title = config.getConfigVal("title");
        webWindowConfig.icon = path.join(
            path.resolve(__dirname, ".."),
            config.getConfigVal("icon")
        );
        let childWindow = new BrowserWindow(webWindowConfig);
        // 添加打开事件监控
        win_event(childWindow);
        childWindow.loadURL(url);
        logger.info("[MainProcessHelper][new-window]新视图 " + url + " 已加载");
        if (config.getConfigVal("debug")) {
            // 打开开发者工具
            childWindow.webContents.openDevTools();
        }
        event.preventDefault();
    });
    // 监听跳转
    win.webContents.on("will-navigate", function (event, url) {
        let winTemp = win;
        // 链接中width
        let viewWindowWidth = getUrlParamValue(url, "windowWidth");
        // 链接中height
        let viewWindowHeight = getUrlParamValue(url, "windowHeight");
        if (viewWindowWidth && viewWindowHeight) {
            winTemp.setSize(parseInt(viewWindowWidth), parseInt(viewWindowHeight));
        }
        console.log(winTemp.getSize());
        // 链接中resizable
        let viewWindowFixedSize = getUrlParamValue(url, "fixedWindowSize");
        if (viewWindowFixedSize) {
            let viewresizable = false;
            if (viewWindowFixedSize === "true") {
                viewresizable = true;
            }
            winTemp.setResizable(!viewresizable);
        }
        logger.info("[MainProcessHelper][will-navigate]新视图 " + url + " 已加载");
    });
}

// 解析ulr上参数
function getUrlParamValue(url, param) {
    if (url && param) {
        let index = url.indexOf("?");
        if (index != -1) {
            let urlsearch = url.substr(index + 1);
            let pstr = urlsearch.split("&");
            for (let i = pstr.length - 1; i >= 0; i--) {
                let tep = pstr[i].split("=");
                if (tep[0] == param) {
                    return tep[1];
                }
            }
        }
    }
    return false;
}

// 获取全部url参数
function getUrlAllParamValues(url) {
    if (url) {
        let index = url.indexOf("?");
        if (index != -1) {
            return url.substr(index + 1);
        }
    }
    return false;
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

/**
 *投屏相关-会议页面打开工具栏
 * cmd 指令
 * useLocalTools 是否使用本地1或0
 * leader  1 创建者  0 观众（学生）2助教
 * language 语言language中文,1英文
 * curScreenValue 当前屏幕共享分辨率720p_1,1080p_1
 * hasAudioDev 语音设备true或false
 * hasVideoDev 视频设备true或false
 * audioSetStatus 语音状态1或0
 * videoSetStatus 视频状态1或0
 * recordSetStatus 录制状态1或0
 * isPublic 课堂是否开放1或0
 * meetTime 会议开始时间
 * membersNumber 成员数量
 * chatNumber 未读消息数
 * shareWindowWidth 会议屏幕共享后宽
 * shareWindowHeight 会议屏幕共享后高
 * width 会议屏幕共享后工具栏宽-即屏幕宽
 * height 会议屏幕共享后工具栏高-即屏幕高
 */
//ipcMain收到screenTools信号
ipcMain.on("screenTools", function (sys, message) {
    if (!message || !message.cmd) {
        return;
    }
    if (config.getConfigVal("debug")) {
        logger.debug("[MainProcessHelper][_screenTools_]主进程main.js收到投屏指令信号 指令 " + JSON.stringify(message));
    }
    message.debug = config.getConfigVal("debug");
    message.meet_debug = config.getConfigVal("meet_debug");
    if ("startScreen" == message.cmd) {
        // 打开选择窗口
        let choseWindowTemp = global.sharedWindow.windowMap.get(choseScreenWindowUUID);
        if (choseWindowTemp) {
            //将screenToolsWindow置为null
            global.sharedWindow.windowMap.delete(choseScreenWindowUUID);
            choseWindowTemp.close();
        }
        let screenToolsWindow = global.sharedWindow.windowMap.get(screenToolsWindowUUID);
        if (!screenToolsWindow) {
            // 获取窗口集合中
            let meetWindowTemp = global.sharedWindow.windowMap.get(meetWindowUUID);
            if (!meetWindowTemp) {
                return;
            }
            //是否使用本地工具栏1或0
            let useLocalTools = message.useLocalTools || 1;
            if (useLocalTools == 1) {
                useLocalTools = true;
            } else {
                useLocalTools = false;
            }
            //会议屏幕共享后工具栏宽-即屏幕宽
            let winWidthTemp = message.width;
            if (winWidthTemp) {
                winWidthTemp = parseInt(winWidthTemp);
            } else {
                winWidthTemp = 800;
            }
            //会议屏幕共享后工具栏高-即屏幕高
            let winHeightTemp = message.height;
            if (winHeightTemp) {
                winHeightTemp = parseInt(winHeightTemp);
            } else {
                winHeightTemp = 600;
            }
            //会议屏幕共享后宽
            let meetWinWidthTemp = message.shareWindowWidth;
            if (meetWinWidthTemp) {
                meetWinWidthTemp = parseInt(meetWinWidthTemp);
            } else {
                meetWinWidthTemp = 300;
            }
            //会议屏幕共享后高
            let meetWinHeightTemp = message.shareWindowHeight;
            if (meetWinHeightTemp) {
                meetWinHeightTemp = parseInt(meetWinHeightTemp);
            } else {
                meetWinHeightTemp = 640;
            }
            // 获取窗口原参数
            let meetWindowOptionsTemp = meetWindowTemp.webContents.browserWindowOptions;
            // 退出全屏
            meetWindowTemp.setFullScreen(false);
            // 更新会议窗口信息
            meetWindowTemp.setMinimumSize(meetWinWidthTemp, meetWinHeightTemp);
            meetWindowTemp.setSize(meetWinWidthTemp, meetWinHeightTemp);
            meetWindowTemp.setContentSize(meetWinWidthTemp, meetWinHeightTemp);
            if (process.platform === 'darwin') {
                // 不显示红绿灯
                //meetWindowTemp.setWindowButtonVisibility(false);
            }
            meetWindowTemp.setResizable(false);
            // 计算窗口位置
            let {width: screenWidth, height: screenHeight} = electron.screen.getPrimaryDisplay().workAreaSize;
            let moveX = screenWidth - (screenWidth * 0.3);
            let moveY = screenHeight * 0.1;
            // let moveX = winWidthTemp - (winWidthTemp * 0.3);
            // let moveY = winHeightTemp * 0.1;
            // 必须转int否则mac报错
            moveX = parseInt(moveX);
            moveY = parseInt(moveY);
            meetWindowTemp.setPosition(moveX, moveY, false);
            // 再次更新窗口大小临时修复页面问题
            /*meetWindowTemp.setMinimumSize(meetWinWidthTemp, meetWinHeightTemp);
            meetWindowTemp.setSize(meetWinWidthTemp, meetWinHeightTemp);
            meetWindowTemp.setContentSize(meetWinWidthTemp, meetWinHeightTemp);*/
            meetWindowTemp.show();
            // 传递参数
            let queryValues = "?_t=0";
            //语言language中文,1英文
            let language = message.language || "language";
            queryValues += "&language=" + language;
            // 当前邀请码
            let qrcode = message.qrcode || "";
            // 当前邀请码二维码
            let qrcodeUrl = message.qrcodeUrl || "";
            // 当前邀请码二维码提示语句
            let qrcodeTips = message.qrcodeTips || "";
            //当前视屏分辨率是否可切换
            let videoValueChange = message.videoValueChange || "";
            queryValues += "&videoValueChange=" + videoValueChange;
            //当前视屏共享分辨率180p_1,720p_1
            let curVideoValue = message.curVideoValue || "180p_1";
            queryValues += "&curVideoValue=" + curVideoValue;
            //当前屏幕分辨率是否可切换
            let screenValueChange = message.screenValueChange || "";
            queryValues += "&screenValueChange=" + screenValueChange;
            //当前屏幕共享分辨率720p_1,1080p_1
            let curScreenValue = message.curScreenValue || "720p_1";
            queryValues += "&curScreenValue=" + curScreenValue;
            //身份1-创建者,0-观众（学生）,2-助教
            let leader = message.leader || "0";
            queryValues += "&leader=" + leader;
            //语音设备true或false
            let hasAudioDev = message.hasAudioDev || "false";
            queryValues += "&hasAudioDev=" + hasAudioDev;
            //视频设备true或false
            let hasVideoDev = message.hasVideoDev || "false";
            queryValues += "&hasVideoDev=" + hasVideoDev;
            //语音状态1或0
            let audioSetStatus = message.audioSetStatus || "0";
            queryValues += "&audioSetStatus=" + audioSetStatus;
            //视频状态1或0
            let videoSetStatus = message.videoSetStatus || "0";
            queryValues += "&videoSetStatus=" + videoSetStatus;
            //录制状态1或0
            let recordSetStatus = message.recordSetStatus || "0";
            queryValues += "&recordSetStatus=" + recordSetStatus;
            //课堂是否开放1或0
            let isPublic = message.isPublic || "1";
            queryValues += "&isPublic=" + isPublic;
            // 设置- 允许主动退出课堂
            let isAllowToLeave = message.isAllowToLeave || "1";
            queryValues += "&isAllowToLeave=" + isAllowToLeave;
            // 设置-全体静音后，允许自我解除静音
            let isAllowUnmuteSelf = message.isAllowUnmuteSelf || "1";
            queryValues += "&isAllowUnmuteSelf=" + isAllowUnmuteSelf;
            // 设置-锁定课堂
            let isLockMeet = message.isLockMeet || "0";
            queryValues += "&isLockMeet=" + isLockMeet;
            //会议开始时间
            let meetTime = message.meetTime || new Date().getTime();
            queryValues += "&meetTime=" + meetTime;
            //成员数量
            let membersNumber = message.membersNumber || "0";
            queryValues += "&membersNumber=" + membersNumber;
            //未读消息数
            let chatNumber = message.chatNumber || "0";
            queryValues += "&chatNumber=" + chatNumber;
            
            // 投屏相关参数
            let screenType = message.type || "1";
            let screenInfo = message.info || "";
            
            // 窗口工具的坐标
            let screenToolsX = 0;
            let screenToolsY = 0;
            if (screenType == "1") {
                if (screenInfo && screenInfo.displayId) {
                    // 是否是mac
                    if (process.platform === 'darwin') {
                        let screenInfoTemp = activeWinHelper.getScreenByIdSync(screenInfo.displayId.id);
                        if (screenInfoTemp) {
                            screenToolsX = screenInfoTemp.x;
                            screenToolsY = screenInfoTemp.y;
                        }
                    } else {
                        screenToolsX = screenInfo.displayId.x;
                        screenToolsY = screenInfo.displayId.y;
                    }
                }
            } else if (screenType == "2") {
                if (screenInfo && screenInfo.windowId) {
                    try {
                        let windowInfoTemp = activeWinHelper.getByHidSync(screenInfo.windowId);
                        if (windowInfoTemp) {
                            let windowXTemp = windowInfoTemp.bounds.x || 0;
                            if (windowInfoTemp.screens && windowInfoTemp.screens.length > 0) {
                                // 处理多屏幕
                                for (let i = 0; i < windowInfoTemp.screens.length; i++) {
                                    let screensInfoTemp = windowInfoTemp.screens[i];
                                    if (windowXTemp >= screensInfoTemp.x && windowXTemp < (screensInfoTemp.x + screensInfoTemp.width)) {
                                        screenToolsX = screensInfoTemp.x;
                                        screenToolsY = screensInfoTemp.y;
                                        winWidthTemp = screensInfoTemp.width;
                                        winHeightTemp = screensInfoTemp.height;
                                    }
                                }
                            }
                        }
                    } catch (e) {
                        console.error(e);
                    }
                }
            }
            // 创建窗口
            screenToolsWindow = new BrowserWindow({
                "width": winWidthTemp,
                "height": winHeightTemp,
                "x": screenToolsX,
                "y": screenToolsY,
                "webPreferences": {
                    "nodeIntegration": true,
                    "enableRemoteModule": true
                },
                "frame": false,
                "center": true,
                "movable": false,
                "hasShadow": false,
                "resizable": false,
                "alwaysOnTop": true,
                "skipTaskbar": true,
                "transparent": true,
                "autoHideMenuBar": true,
                "enableLargerThanScreen": true,
            });
            // 引入主入口界面
            if (useLocalTools) {
                // 引用本地比较快
                screenToolsWindow.loadFile(path.join(path.resolve(__dirname, ".."), "/view/box.html"), {"search": queryValues});
            } else {
                // 引用在线便于更新
                screenToolsWindow.loadURL(config.getUrlPathConfigVal("menu_box_url") + queryValues);
            }
            // win直接全屏,macos直接简单全屏
            if (process.platform === 'darwin') {
                //screenToolsWindow.setSize(winWidthTemp, winHeightTemp);
                //screenToolsWindow.setContentSize(winWidthTemp, winHeightTemp);
                //screenToolsWindow.setSimpleFullScreen(true);
                //screenToolsWindow.maximize();
                screenToolsWindow.setAlwaysOnTop(true, 'screen-saver') // mac
                screenToolsWindow.setVisibleOnAllWorkspaces(true) // mac
            } else {
                //screenToolsWindow.setSize(winWidthTemp, winHeightTemp);
                //screenToolsWindow.setContentSize(winWidthTemp, winHeightTemp);
                screenToolsWindow.setFullScreen(true);
            }
            if (config.getConfigVal("meet_debug") || config.getConfigVal("debug")) {
                // 打开开发者工具
                screenToolsWindow.webContents.openDevTools();
                screenToolsWindow.setFullScreen(false);
                winWidthTemp = 800;
                winHeightTemp = 600;
                screenToolsWindow.setSize(winWidthTemp, winHeightTemp);
                screenToolsWindow.setContentSize(winWidthTemp, winHeightTemp);
                // 会议居中
                meetWindowTemp.center();
            }
            // 需要加上转发不然会失效
            screenToolsWindow.setIgnoreMouseEvents(true, {forward: true});
            // 失去焦点处理-针对mac 测试后效果不理想
            /*screenToolsWindow.on('blur', function () {
                screenToolsWindow.setIgnoreMouseEvents(true, {forward: true});
            });*/
            // 当窗口关闭前触发
            screenToolsWindow.on("close", function (e) {
                // 先判断是否存在对象
                e.sender.webContents.executeJavaScript("typeof beforeWindowClose").then((result) => {
                    if (result !== "undefined") {
                        // 存在执行此方法获取返回值
                        e.sender.webContents.executeJavaScript("beforeWindowClose()").then((result) => {
                            if (result !== "1") {
                                //将screenToolsWindow置为null
		                        global.sharedWindow.windowMap.delete(screenToolsWindowUUID);
                                e.sender.destroy();
                            }
                        });
                    } else {
                        // 不存在直接销毁
                        //将screenToolsWindow置为null
                        global.sharedWindow.windowMap.delete(screenToolsWindowUUID);
                        e.sender.destroy();
                    }
                })
                e.preventDefault();
            });
            // 组装发送参数
            let finishLoadSendValue = {
                "cmd": "dataInfo",
                "qrcode": qrcode,
                "qrcodeUrl": qrcodeUrl,
                "qrcodeTips": qrcodeTips,
                "screenType": screenType,
                "screenInfo": screenInfo,
                "screenToolsX": screenToolsX,
                "screenToolsY": screenToolsY
            };
            // 当窗口加载完毕后-发送邀请码信息
            screenToolsWindow.webContents.on("did-stop-loading", () => {
                screenToolsWindow.webContents.send(meetToolsMessageFormMainChannel, finishLoadSendValue);
            });
            // 放入窗口集合中
            global.sharedWindow.windowMap.set(screenToolsWindowUUID, screenToolsWindow);
        }
    } else if ("stopScreen" == message.cmd) {
        let screenToolsWindow = global.sharedWindow.windowMap.get(screenToolsWindowUUID);
        if (screenToolsWindow) {
            // 获取窗口集合中
            let meetWindowTemp = global.sharedWindow.windowMap.get(meetWindowUUID);
            if (meetWindowTemp) {
                // 改变大小前先居中，避免多屏幕位置跑偏
                meetWindowTemp.center();
                // 获取窗口原参数
                let meetWindowOptionsTemp = meetWindowTemp.webContents.browserWindowOptions;
                // 更新会议窗口信息
                meetWindowTemp.setMinimumSize(meetWindowOptionsTemp.minWidth, meetWindowOptionsTemp.minHeight);
                meetWindowTemp.setSize(meetWindowOptionsTemp.width, meetWindowOptionsTemp.height);
                meetWindowTemp.setContentSize(meetWindowOptionsTemp.width, meetWindowOptionsTemp.height);
                if (process.platform === 'darwin') {
                    // 不显示红绿灯
                    //meetWindowTemp.setWindowButtonVisibility(false);
                }
                meetWindowTemp.setResizable(true);
                meetWindowTemp.center();
                meetWindowTemp.show();
            }
            //将screenToolsWindow置为null
            global.sharedWindow.windowMap.delete(screenToolsWindowUUID);
            // 销毁窗口
            screenToolsWindow.destroy();
        }
    } else if ("changeMeetWindowSize" == message.cmd) {
        let windowWidthTemp = message.windowWidth;
        let windowHeightTemp = message.windowHeight;
        if (!windowWidthTemp || !windowHeightTemp) {
            return;
        }
        // 获取窗口集合中
        let meetWindowTemp = global.sharedWindow.windowMap.get(meetWindowUUID);
        if (meetWindowTemp) {
            // 更新会议窗口信息
            meetWindowTemp.setMinimumSize(windowWidthTemp, windowHeightTemp);
            meetWindowTemp.setSize(windowWidthTemp, windowHeightTemp);
            meetWindowTemp.setContentSize(windowWidthTemp, windowHeightTemp);
            meetWindowTemp.setResizable(false);
            meetWindowTemp.show();
        }
    } else if ("choseScreen" == message.cmd) {
        // 当前桌面
        let displays = message.displays || "";
        // 当前窗口
        let winplays = message.winplays || "";
        // 传递参数
        let queryValues = "?_t=0";
        //语言language中文,1英文
        let language = message.language || "language";
        queryValues += "&language=" + language;
        // 打开选择窗口
        let choseWindowTemp = global.sharedWindow.windowMap.get(choseScreenWindowUUID);
        if (!choseWindowTemp) {
            let windowOptionsTemp = {
                "width": 1100,
                "height": 750,
                "webPreferences": {
                    "nodeIntegration": true,
                    "enableRemoteModule": true
                },
                "frame": false,
                "center": true,
                "autoHideMenuBar": true,
                "maximizable": false,
                "minimizable": false,
                "resizable": false,
                "fullscreenable": false,
            };
            // 父子窗口
            let meetWindowTemp = global.sharedWindow.windowMap.get(meetWindowUUID);
            if (meetWindowTemp) {
                windowOptionsTemp.parent = meetWindowTemp;
            }
            // 创建窗口
            choseWindowTemp = new BrowserWindow(windowOptionsTemp);
            // 引用本地比较快
            choseWindowTemp.loadFile(path.join(path.resolve(__dirname, ".."), "/view/choseScreen.html"), {"search": queryValues});

            if (config.getConfigVal("debug")) {
                // 打开开发者工具
                choseWindowTemp.webContents.openDevTools();
            }
            if (config.getConfigVal("meet_debug")) {
                // 打开开发者工具
                choseWindowTemp.webContents.openDevTools();
            }
            // 所有窗口句柄
            let windowIds = new Array();
            // 当前窗口
            let hwndTemp = choseWindowTemp.getNativeWindowHandle();
            windowIds.push(hwndTemp.readUInt32LE(0));
            if (global.sharedWindow.windowMap.size > 0) {
                // 循环判断窗口
                global.sharedWindow.windowMap.forEach(function (value, key) {
                    hwndTemp = value.getNativeWindowHandle();
                    windowIds.push(hwndTemp.readUInt32LE(0));
                    //TODO mac暂时不能直接取到
                });
            }
            // 组装发送参数
            let finishLoadSendValue = {
                "cmd": "choseData",
                "language": language,
                "displays": displays,
                "winplays": winplays,
                "windowIds": windowIds,
            };
            // 当窗口加载完毕后-发送邀请码信息
            choseWindowTemp.webContents.on("did-stop-loading", () => {
                choseWindowTemp.webContents.send(meetChosesMessageFormMainChannel, finishLoadSendValue);
            });
	        // 当窗口关闭前触发
	        choseWindowTemp.on("close", function (e) {
		        //将choseScreenWindow置为null
		        global.sharedWindow.windowMap.delete(choseScreenWindowUUID);
		        e.sender.destroy();
	        });
            // 放入窗口集合中
            global.sharedWindow.windowMap.set(choseScreenWindowUUID, choseWindowTemp);
        }
    } else if ("choseScreenData" == message.cmd) {
        // 发送可选择窗口数据
        let choseWindowTemp = global.sharedWindow.windowMap.get(choseScreenWindowUUID);
        if (choseWindowTemp) {
            if (global.sharedWindow.windowMap.size > 0) {
                // 所有窗口句柄
                let windowIds = new Array();
                // 循环判断窗口
                global.sharedWindow.windowMap.forEach(function (value, key) {
                    let hwndTemp = value.getNativeWindowHandle();
                    windowIds.push(hwndTemp.readUInt32LE(0));
                });
                message.windowIds = windowIds;
            }
            choseWindowTemp.webContents.send(meetChosesMessageFormMainChannel, message);
        }
    } else if ("openVideoBox" == message.cmd) {
        if (typeof message.uid == "undefined") {
            return;
        }
        // 更新下数据
        message.cmd = "videoData";
        let widthTemp = message.width || 320;
        if (widthTemp) {
            widthTemp = parseInt(widthTemp);
        }
        let heightTemp = message.height || 200;
        if (heightTemp) {
            heightTemp = parseInt(heightTemp) + 30;
        }
        // 打开选择窗口
        let openVideoBoxWindowTemp = global.sharedWindow.windowMap.get(openVideoBoxWindowUUID);
        if (!openVideoBoxWindowTemp) {
            if (!message.init) {
                return;
            }
            // 创建窗口
            openVideoBoxWindowTemp = new BrowserWindow({
                "width": widthTemp,
                "height": heightTemp,
                "webPreferences": {
                    "nodeIntegration": true,
                    "enableRemoteModule": true
                },
                "frame": false,
                "center": true,
                "maximizable": true,
                "minimizable": true,
                "resizable": true,
                "transparent": true,
                "autoHideMenuBar": true,
            });
            // 引用本地比较快
            openVideoBoxWindowTemp.loadFile(path.join(path.resolve(__dirname, ".."), "/view/videoBox.html"));

            if (config.getConfigVal("debug")) {
                // 打开开发者工具
                openVideoBoxWindowTemp.webContents.openDevTools();
            }
            if (config.getConfigVal("meet_debug")) {
                // 打开开发者工具
                openVideoBoxWindowTemp.webContents.openDevTools();
            }
            // 当窗口加载完毕后-发送信息
            openVideoBoxWindowTemp.webContents.on("did-stop-loading", () => {
                openVideoBoxWindowTemp.webContents.send(meetVideoMessageFormMainChannel, message);
            });
            // 当窗口关闭前触发
            openVideoBoxWindowTemp.on("close", function (e) {
                e.sender.destroy();
            });
            // 当窗口关闭时触发
            openVideoBoxWindowTemp.on("closed", function () {
                if (mainWindow != null) {
                    if (global.sharedWindow.windowMap.size == 2) {
                        //显示父窗口
                        mainWindow.show();
                    }
                }
                //将choseScreenWindow置为null
                global.sharedWindow.windowMap.delete(openVideoBoxWindowUUID);
            });
            // 放入窗口集合中
            global.sharedWindow.windowMap.set(openVideoBoxWindowUUID, openVideoBoxWindowTemp);
        } else {
            // 初始化更新窗口大小
            if (message.init) {
                openVideoBoxWindowTemp.center();
                openVideoBoxWindowTemp.setMinimumSize(widthTemp, heightTemp);
                openVideoBoxWindowTemp.setSize(widthTemp, heightTemp);
                openVideoBoxWindowTemp.setContentSize(widthTemp, heightTemp);
                openVideoBoxWindowTemp.show();
            }
            openVideoBoxWindowTemp.webContents.send(meetVideoMessageFormMainChannel, message);
        }
    } else {
        // 直接转发到工具栏页面,由页面处理
        // 获取窗口集合中
        let screenToolsWindowTemp = global.sharedWindow.windowMap.get(screenToolsWindowUUID);
        if (!screenToolsWindowTemp) {
            return;
        }
        // 直接转发,由页面处理
        try {
            screenToolsWindowTemp.webContents.send(meetToolsMessageFormMainChannel, message);
        } catch (e) {
            console.error(e);
        }
    }
});

/**
 *顶部投屏工具栏相关-工具栏发送消息到会议
 */
//ipcMain收到meetTools信号
ipcMain.on("meetTools", function (sys, message) {
    if (!message || !message.cmd) {
        return;
    }
    // 获取窗口集合中
    let meetWindowTemp = global.sharedWindow.windowMap.get(meetWindowUUID);
    if (!meetWindowTemp) {
        return;
    }
    if (config.getConfigVal("debug")) {
        logger.debug("[MainProcessHelper][_meetTools_]主进程main.js收到投屏指令信号 指令 " + JSON.stringify(message));
    }
    message.debug = config.getConfigVal("debug");
    message.meet_debug = config.getConfigVal("meet_debug");
    // 直接转发,由页面处理
    meetWindowTemp.webContents.send(meetToolsFormMainChannel, message);
});

/**
 *选择投屏窗口相关-选择投屏窗口发送消息到会议
 */
//ipcMain收到meetChoses信号
ipcMain.on("meetChoses", function (sys, message) {
    if (!message || !message.cmd) {
        return;
    }
    // 获取窗口集合中
    let meetWindowTemp = global.sharedWindow.windowMap.get(meetWindowUUID);
    if (!meetWindowTemp) {
        return;
    }
    if (config.getConfigVal("debug")) {
        logger.debug("[MainProcessHelper][_meetChoses_]主进程main.js收到投屏指令信号 指令 " + JSON.stringify(message));
    }
    message.debug = config.getConfigVal("debug");
    message.meet_debug = config.getConfigVal("meet_debug");
    // 直接转发,由页面处理
    meetWindowTemp.webContents.send(meetToolsFormMainChannel, message);
});

/**
 *视屏窗口相关-视屏窗口发送消息到会议
 */
//ipcMain收到meetChoses信号
ipcMain.on("meetVideo", function (sys, message) {
    if (!message || !message.cmd) {
        return;
    }
    // 获取窗口集合中
    let meetWindowTemp = global.sharedWindow.windowMap.get(meetWindowUUID);
    if (!meetWindowTemp) {
        // 主窗口不存在关闭视屏窗口
        let openVideoBoxWindowTemp = global.sharedWindow.windowMap.get(openVideoBoxWindowUUID);
        if (openVideoBoxWindowTemp) {
            openVideoBoxWindowTemp.close();
        }
        return;
    }
    if (config.getConfigVal("debug")) {
        logger.debug("[MainProcessHelper][_meetVideo_]主进程main.js收到投屏指令信号 指令 " + JSON.stringify(message));
    }
    message.debug = config.getConfigVal("debug");
    message.meet_debug = config.getConfigVal("meet_debug");
    // 直接转发,由页面处理
    meetWindowTemp.webContents.send(meetToolsFormMainChannel, message);
});

module.exports = {createMainWindow, getMainWindow, openNewWindow};
