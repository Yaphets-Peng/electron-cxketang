require('dotenv').config()
const fs = require("fs");
const qs = require("qs");
const path = require("path");
const axios = require("axios");
const child = require('child_process');

exports.default = async function afterAllArtifactBuild(result) {
    let files = result.artifactPaths;

    let dateTime = getConfigVal("buildTime");

    // pkg是否公证
    let isNotarize = false;

    for (let i = 0; i < files.length; i++) {
        let filePath = files[i];
        let suffix = filePath.substr(filePath.lastIndexOf(".") + 1);
        // 是否改名字
        let isRename = false;
        if (suffix === "exe") {
            isRename = true;
        } else if (suffix === "pkg") {
            isRename = true;
            isNotarize = true;
        }
        // 开发环境
        if (process.env.NODE_ENV === "dev") {
            isNotarize = false;
        }
        //改名
        if (isRename) {
            let newname = filePath.replace(`.${suffix}`, `_${dateTime}.${suffix}`);
            fs.rename(filePath, newname, function (err) {
                if (err) {
                    console.error(filePath, "重命名失败,", err);
                } else {
                    // 成功后,如果需要pkg公证
                    if (isNotarize) {
                        let appBundleId = result.configuration.appId;
                        let {appleId, ascProvider, appleIdPassword} = process.env;
                        let cmd = `xcrun altool --notarize-app --primary-bundle-id "${appBundleId}" --username "${appleId}" --password "${appleIdPassword}" --asc-provider "${ascProvider}" -t osx --file ${newname}`;
                        console.log("开始公证命令", cmd);
                        child.exec(cmd, function (err, sto) {
                            console.log(newname, "公证结果", sto, "异常信息", err);
                            if (!err) {
                                sendSuccess(newname);
                            }
                        });
                    }
                }
            });
        }
    }
}

// 发送构建完成结果
async function sendSuccess(fileName) {
    let msgObj = {"type": "txt", "msg": "超星课堂打包完成" + fileName};
    let msg = JSON.stringify(msgObj);
    let sendUrl = "http://learn.chaoxing.com/apis/im/sendMsg?target_type=users&users=44677393&fromuid=26793493";
    await axios.post(sendUrl, qs.stringify({"msg": msg}), {"headers": {"Content-Type": "application/x-www-form-urlencoded"}});
}

/**
 * 读取配置项并返回配置数据
 * @kind AnyProcess [任意进程调用]
 * @param {string} configname 配置项名称
 */
function getConfigVal(configname) {
    // 配置文件
    let config_file_path = path.join(path.resolve(__dirname, ".."), "app/config/buildInfo.json");
    let json_config_ = fs.readFileSync(config_file_path);
    let config_obj_ = JSON.parse(json_config_);
    return config_obj_[configname];
}