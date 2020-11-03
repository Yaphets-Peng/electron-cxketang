/*主进程*/
//用于维护electron声明周期的组件
const {app, Menu} = require("electron");
const config = require("./common/Config"); //引入全局配置组件
const logger = require("./common/Logger");
const helper = require("./process/MainProcessHelper");
/* ↓app对象生命周期维护开始↓ */

/**
 * app对象生命周期及事件
 * @see https://electronjs.org/docs/api/app
 */

// 处理多开
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
    return;
} else {
    app.on("second-instance", (event, commandLine, workingDirectory) => {
        // 当运行第二个实例时,将会聚焦到myWindow这个窗口
        if (helper.getMainWindow()) {
            if (helper.getMainWindow().isMinimized()) {
                helper.getMainWindow().restore();
            }
            helper.getMainWindow().focus();
        }
    });
}

// 加入协议唤醒
const PROTOCOL = config.getConfigVal("protocol");

if (app.isPackaged) {
    app.setAsDefaultProtocolClient(PROTOCOL);
} else {
    // 本地调试模式非打包开启
    const path = require("path")
    app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [path.resolve(process.argv[1])]);
}

// 协议回调钩子
if (process.platform === 'darwin') {
    // mac
    app.on("open-url", function (event, urlStr) {
        logger.info("mac-protocol-" + urlStr);
        handleUrlFromWeb(urlStr);
    });
} else {
    // win
    app.on("second-instance", async (event, argv) => {
        logger.info("win-protocol-" + argv);
        handleArgvFromWeb(argv);
    });
}

// window 系统中执行网页调起应用时，处理协议传入的参数
const handleArgvFromWeb = (argv) => {
    const prefix = `${PROTOCOL}://`;
    // 开发阶段，跳过前两个参数（`electron.exe .`）
    // 打包后，跳过第一个参数（`myapp.exe`）
    const offset = app.isPackaged ? 1 : 2;
    const url = argv.find((arg, i) => i >= offset && arg.toLowerCase().startsWith(prefix.toLowerCase()));
    if (url) {
        handleUrlFromWeb(url);
    }
};

// 进行处理网页传来 url 参数，参数自定义，以下为示例
// 示例调起应用的 url 为ChaoxingClassroomPc://name=名字&type=类型&shareId=1585876954860136091
const handleUrlFromWeb = (urlStr) => {
    if (urlStr) {
        const urlObj = new URL(urlStr);
        if (urlObj) {
            const host = urlObj.host;
            if (host) {
                // 判断下是否登录
                if (helper.isLogin()) {
                    let open_type = getProtocolQueryString(host, "open_type");
                    // 协议打开会议
                    if (open_type === "enterMeeting") {
                        let meet_uuid = getProtocolQueryString(host, "meet_uuid");
                        let meet_clazzid = getProtocolQueryString(host, "meet_clazzid");
                        if (meet_uuid) {
                            if (helper.getMainWindow() !== null) {
                                let open_meet_url = config.getConfigVal("meet_url").replace("{uuid}", meet_uuid).replace("{classId}", meet_clazzid);
                                let openMeetinScript = "window.open('" + open_meet_url + "')";
                                helper.getMainWindow().webContents.executeJavaScript(openMeetinScript);
                            }
                        }
                    }
                }
            }
        }
    }
};

//获取Protocol中的参数
const getProtocolQueryString = (search, name) => {
    let reg = new RegExp(`(^|&)${name}=([^&]*)(&|$)`)
    let r = search && search.match(reg)
    if (r != null) return r[2];
    return ''
}

/**
 * 添加对协议链接的处理， 用于实现网页调起客户端逻辑
 */
// 当应用启动完成后，主动判断应用是否是从网页中调起
const _handleAfterReady = () => {
    // windows如果是通过url schema启动则发出时间处理
    // 启动参数超过1个才可能是通过url schema启动
    if (process.argv.length > 1) {
        if (!app.isReady()) {
            app.once("browser-window-created", () => {
                // app 未打开时，通过 open-url打开 app，此时可能还没 ready，需要延迟发送事件
                // 此段ready延迟无法触发 service/app/ open-url 处理，因为saga初始化需要时间
                app.emit("second-instance", null, process.argv);
            });
        } else {
            app.emit("second-instance", null, process.argv);
        }
    }
};


// 清空菜单
//Menu.setApplicationMenu(null);
// mac保留复制粘贴
if (process.platform === 'darwin') {
    const template = [
        {
            label: "Application",
            submenu: [
                {
                    label: "Quit", accelerator: "Command+Q", click: function () {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: "Edit",
            submenu: [
                {label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:"},
                {label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:"},
            ]
        }
    ];
    Menu.setApplicationMenu(Menu.buildFromTemplate(template))
} else {
    Menu.setApplicationMenu(null)
}

// 这个方法将会在electron初始化完成后被调用
// 某些API只能在初始化之后(此状态之后)被调用
app.on("ready", () => {
    helper.createMainWindow();
    _handleAfterReady();
});

// 当所有窗口关闭时关闭应用程序
app.on("window-all-closed", function () {
    if (process.platform !== "darwin") {
        logger.info("点击窗口关闭按钮");
        app.quit();
    }
});

//当应用程序准备退出时执行动作
app.on("will-quit", () => {
    logger.info("程序即将退出");

});

//当应用程序激活时，通常在macOS下
app.on("activate", function () {
    //如果当前没有窗口被激活，则创建窗口
    if (helper.getMainWindow() === null) {
        helper.createMainWindow();
    }
});

/* ↑app对象生命周期维护结束↑ */
