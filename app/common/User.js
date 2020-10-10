const fs = require("fs");
const config_file_path = __dirname + "/../config/env.json";

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

function getUserId() {
  return getConfigVal("user_id");
}

function saveUserId(userId) {
  var data = { user_id: userId };
  var jsonObj = JSON.stringify(data);
  fs.writeFile(config_file_path, jsonObj, function (err) {
    if (err) {
      console.log(err);
    } else {
      console.log("file success！！！");
    }
  });
}

function isLogin() {
  var user_id = getUserId();
  if (typeof user_id === "undefined" || user_id == null || user_id === "") {
    return false;
  }
  return true;
}

module.exports = {
  getUserId,
  saveUserId,
  isLogin,
};
