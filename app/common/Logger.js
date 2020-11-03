/**
 *on Linux: ~/.config/{app name}/logs/{process type}.log
 *on macOS: ~/Library/Logs/{app name}/{process type}.log
 *on Windows: %USERPROFILE%\AppData\Roaming\{app name}\logs\{process type}.log
 */
//使用electron-log作为全局日志模块
const logger = require('electron-log');

// 日志文件等级，默认值：silly
//logger.transports.file.level = 'debug';
// 日志控制台等级，默认值：silly
//logger.transports.console.level = 'debug';
// 日志文件名，默认：main.log
logger.transports.file.fileName = 'cxketang.log';
// 日志格式，默认：[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}
logger.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';
// 日志大小，默认：1048576（1M），达到最大上限后，备份文件并重命名为：main.old.log，有且仅有一个备份文件
logger.transports.file.maxSize = 1048576;
// 日志文件位置：C:\Users\%USERPROFILE%\AppData\Roaming\Electron\logs
// 完整的日志路径：logger.transports.file.file，优先级高于 appName、fileName

/**
 * error级别
 * @kind AnyProcess [任意进程调用]
 * @param {any} data 日志数据
 */
function error(data) {
    logger.error(data);
}

/**
 * warn级别
 * @kind AnyProcess [任意进程调用]
 * @param {any} data 日志数据
 */
function warn(data) {
    logger.warn(data);
}

/**
 * info级别
 * @kind AnyProcess [任意进程调用]
 * @param {any} data 日志数据
 */
function info(data) {
    logger.info(data);
}

/**
 * verbose级别
 * @kind AnyProcess [任意进程调用]
 * @param {any} data 日志数据
 */
function verbose(data) {
    logger.verbose(data);
}

/**
 * debug级别
 * @kind AnyProcess [任意进程调用]
 * @param {any} data 日志数据
 */
function debug(data) {
    logger.debug(data);
}


/**
 * silly级别
 * @kind AnyProcess [任意进程调用]
 * @param {any} data 日志数据
 */
function silly(data) {
    logger.silly(data);
}

/**
 * 获取日志路径
 */
function getLogPath() {
    return logger.transports.file.getFile().path;
}

//对外暴露方法
module.exports = {
    error,
    warn,
    info,
    verbose,
    debug,
    silly,
    getLogPath,
};
