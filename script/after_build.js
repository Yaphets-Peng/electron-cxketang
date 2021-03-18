require('dotenv').config()
const fs = require("fs");
const qs = require("qs");
const path = require("path");
const axios = require("axios");
const child = require('child_process');
const schedule = require('node-schedule');
let job;
let queryNum = 0;

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
		} else if (suffix === "dmg") {
			isRename = true;
			isNotarize = true;
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
			let renameData = fs.renameSync(filePath, newname);
			console.log(renameData);
			// 成功后,如果需要pkg公证
			if (isNotarize) {
				let appBundleId = result.configuration.appId;
				//let {appleId, ascProvider, appleIdPassword} = process.env;
				let appleId = "2156955368@qq.com";
				let ascProvider = "7U3C65Y5PJ";
				let appleIdPassword = "wtwm-opav-pfty-wvat";
				let cmd = `xcrun altool --notarize-app --primary-bundle-id "${appBundleId}" --username "${appleId}" --password "${appleIdPassword}" --asc-provider "${ascProvider}" -t osx --file ${newname}`;
				console.log("开始公证命令", cmd);
				let notarizeData = child.execSync(cmd).toString("utf-8");
				//let notarizeData = "No errors uploading RequestUUID = 4af76410-6755-4dc4-92c3-636dcc599769";
				console.log(newname, "公证结果", notarizeData);
				// 不存在表示异常
				if (notarizeData.indexOf("No errors uploading") == -1) {
					await sendError(newname, notarizeData)
					return;
				}
				let RequestUUID = notarizeData.substring(notarizeData.indexOf("RequestUUID = ")).replace("RequestUUID = ", "").trim();
				if (RequestUUID) {
					job = schedule.scheduleJob('5 * * * * *', () => {
						try {
							let resultData = queryNotarization(RequestUUID, appleId, appleIdPassword);
							if (resultData.indexOf("Status Code: 0") > -1) {
								console.log(newname, "公证查询结果", resultData);
								sendSuccess(newname, resultData);
								schedule.cancelJob(job);
							} else if (resultData.indexOf("Status: in progress") > -1 && queryNum < 15) {
								// 继续查询
								queryNum++;
							} else {
								console.log(newname, "公证查询结果", resultData);
								sendError(newname, resultData);
								schedule.cancelJob(job);
							}
						} catch (e) {
							console.log(e);
						}
					});
				}
			}
		}
	}
}

// 查询公正结果
function queryNotarization(RequestUUID, appleId, appleIdPassword) {
	let cmdTemp = `xcrun altool --notarization-info "${RequestUUID}" --username "${appleId}" --password "${appleIdPassword}"`;
	//xcrun altool --notarization-info 8e79be73-8f5b-474f-bd85-b7f25a8c25eb -u "2156955368@qq.com" -p "wtwm-opav-pfty-wvat"
	console.log("开始公证查询命令", cmdTemp);
	return child.execSync(cmdTemp).toString("utf-8");
}

// 发送构建完成结果
async function sendSuccess(fileName, message) {
	let msgObj = {"type": "txt", "msg": "超星课堂打包完成" + fileName + ",返回信息" + (message || "")};
	let msg = JSON.stringify(msgObj);
	let sendUrl = "http://learn.chaoxing.com/apis/im/sendMsg?target_type=users&users=44677393&fromuid=26793493";
	await axios.post(sendUrl, qs.stringify({"msg": msg}), {"headers": {"Content-Type": "application/x-www-form-urlencoded"}});
}

// 发送构建完成结果
async function sendError(fileName, message) {
	let msgObj = {"type": "txt", "msg": "超星课堂打包异常,请查看" + fileName + ",返回信息" + (message || "")};
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
	let config_file_path = path.join(path.resolve(__dirname, ".."), "app/config/appconfig.json");
	let json_config_ = fs.readFileSync(config_file_path);
	let config_obj_ = JSON.parse(json_config_);
	return config_obj_[configname];
}