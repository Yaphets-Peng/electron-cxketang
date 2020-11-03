//用于创建原生浏览器窗口的组件对象
const {app, BrowserWindow, Tray, Menu} = require("electron"); //引入electron
const path = require("path"); //原生库path模块

const {v4: uuidv4} = require('uuid');// 引入uuid工具类
const md5 = require('md5');// 引入md5工具类
const logger = require("../common/Logger"); //引入全局日志组件
const config = require("../common/Config"); //引入全局配置组件
const sessionCookie = require("../common/SessionCookie"); //引入全局sessionCookie组件

// 为了保证一个对全局windows对象的引用，就必须在方法体外声明变量
// 否则当方法执行完成时就会被JavaScript的垃圾回收机制清理
let mainWindow = null;
let tray = null;
// 主窗口uuid和level
const mainWindowUUID = "mainWindow";
const mainWindowLevel = 1;

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
    mainWindowConfig.icon = path.join(
        path.resolve(__dirname, ".."),
        config.getConfigVal("icon")
    );
    // 放入窗口唯一值
    mainWindowConfig.customUUID = windowUUID;
    mainWindowConfig.customLevel = windowLevel;
    mainWindow = new BrowserWindow(mainWindowConfig);

    // 引入主入口界面
    mainWindow.loadURL(config.getConfigVal("main_url"));

    if (config.getConfigVal("debug")) {
        // 打开开发者工具
        mainWindow.webContents.openDevTools();
    }

    // 删除菜单
    mainWindow.removeMenu();

    // 放入窗口集合中
    global.sharedWindow.windowMap.set(windowUUID, mainWindow);

    // 窗口监控
    all_win_event(mainWindow);

    // 当窗口关闭时触发
    mainWindow.on("closed", function () {
        logger.info("[MainProcessHelper][_mainWindow_.on._closed_]渲染窗口关闭");
        //将全局mainWindow置为null
        global.sharedWindow.windowMap.delete(windowUUID);
        mainWindow = null;
    });

    // 窗口关闭回调
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
        /*mainWindow.hide();
        mainWindow.setSkipTaskbar(true);
        event.preventDefault();*/
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
    });
}

// 返回是否登录
function isLogin() {
    if (!sessionCookie.isLogin()) {
        return false;
    }
    return true;
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
        // 当前窗口值
        let nowWindowUUID = event.sender.browserWindowOptions.customUUID;
        let nowWindowLevel = event.sender.browserWindowOptions.customLevel;
        // 生成窗口唯一uuid值
        let windowUUID = md5(url);
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
            let isAddMeeting = false;
            let isPreloadJs = false;
            if (url.startsWith(config.getConfigVal("open_meet_url"))) {
                // 如果是会议
                isMeeting = true;
                isPreloadJs = true;
            } else if (url.startsWith(config.getConfigVal("open_add_url"))) {
                // 如果是加入会议
                isAddMeeting = true;
                isPreloadJs = true;
            }

            // 注入js脚本
            if (isPreloadJs) {
                // 开启nodejs
                webWindowConfig.webPreferences.nodeIntegration = true;
                webWindowConfig.webPreferences.enableRemoteModule = true;
                // 关闭请求跨域限制
                //webWindowConfig.webPreferences.webSecurity = false;
                // 注入脚本
                webWindowConfig.webPreferences.preload = path.join(path.resolve(__dirname, ".."), "/controller/preload.js");
            }
            // 放入窗口唯一uuid值
            webWindowConfig.customUUID = windowUUID;
            webWindowConfig.customLevel = windowLevel;
            webWindowConfig.customParentUUID = nowWindowUUID;
            webWindowConfig.customParentLevel = nowWindowLevel;
            // 是否需要刷新父页面
            if (url.startsWith(config.getConfigVal("meet_setting_url"))) {
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
            if (isAddMeeting) {
                if (config.getConfigVal("meet_debug")) {
                    childWindow.webContents.openDevTools();
                }
            }
            childWindow.loadURL(url);
            logger.info("[MainProcessHelper][new-window]新视图 " + url + " 已加载");
            // 放入窗口集合中
            global.sharedWindow.windowMap.set(windowUUID, childWindow);
            //绑定事件
            all_win_event(childWindow);
            // 如果父窗口是一级
            if (nowWindowLevel === mainWindowLevel && mainWindow != null) {
                //隐藏父窗口
                mainWindow.hide();
            }
            // 如果是会议界面加入关闭判断
            if (isMeeting || isAddMeeting) {
                // 当子窗口关闭前触发
                childWindow.on("close", function (e) {
                    // 先判断是否存在对象
                    e.sender.webContents.executeJavaScript("typeof beforeWindowClose").then((result) => {
                        if (result !== "undefined") {
                            // 存在执行此方法获取返回值
                            e.sender.webContents.executeJavaScript("beforeWindowClose()").then((result) => {
                                if (result !== "1") {
                                    e.sender.destroy();
                                }
                            });
                        } else {
                            // 不存在直接销毁
                            e.sender.destroy();
                        }
                    })
                    e.preventDefault();
                });
            }
            // 当子窗口关闭时触发
            childWindow.on("closed", function () {
                logger.info("[MainProcessHelper][_childWindow_.on._closed_]渲染窗口关闭url=" + url);
                if (nowWindowLevel === mainWindowLevel && mainWindow != null) {
                    if (webWindowConfig.customParentRefresh) {
                        // 刷新主窗口页面
                        mainWindow.webContents.reloadIgnoringCache();
                    }
                    //显示父窗口
                    mainWindow.show();
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
        //判断是否开启菜单
        if (url.startsWith(config.getConfigVal("menu_url"))) {
            //nowWindow.setMenu(;);
        }
        logger.info("[MainProcessHelper][will-navigate]新视图 " + url + " 已加载");
    });
    // 拦截重定向
    win.webContents.on("will-redirect", function (event, url, isInPlace, isMainFrame, frameProcessId, frameRoutingId) {
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

module.exports = {createMainWindow, getMainWindow, openNewWindow, isLogin};
