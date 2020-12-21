const fs = require("fs");
const config_file_path = __dirname + "/../config/appconfig.json";

/**
 * 读取配置项并返回配置数据
 * @kind AnyProcess [任意进程调用]
 * @param {string} configname 配置项名称
 */
function getConfigVal(configname) {
    let json_config_ = fs.readFileSync(config_file_path);
    let config_obj_ = JSON.parse(json_config_);
    return config_obj_[configname];
}

/**
 * 获取打开链接地址
 */
function getUrlPathConfigVal(configname) {
    let json_config_ = fs.readFileSync(config_file_path);
    let config_obj_ = JSON.parse(json_config_);
    // 获取根域名
    let domainTemp = config_obj_["domain"];
    if (!domainTemp) {
        return "";
    }
    // 获取指定url地址
    let configValueTemp = config_obj_[configname];
    if (!configValueTemp) {
        return "";
    }
    // 拼接后返回
    return domainTemp + configValueTemp;
}


module.exports = {
    getConfigVal,
    getUrlPathConfigVal
};
