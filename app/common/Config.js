const fs = require("fs");
const config_file_path = __dirname + "/../config/appconfig.json";
const build_config_file_path = __dirname + "/../config/buildInfo.json";

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
 * 读取配置项并返回配置数据
 * @kind AnyProcess [任意进程调用]
 * @param {string} configname 配置项名称
 */
function getBuildConfigVal(configname) {
  let json_config_ = fs.readFileSync(build_config_file_path);
  let config_obj_ = JSON.parse(json_config_);
  return config_obj_[configname];
}

module.exports = {
  getConfigVal,
  getBuildConfigVal,
};
