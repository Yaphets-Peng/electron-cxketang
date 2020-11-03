const fs = require("fs");
const os = require("os");
const path = require("path");

async function befor_all() {
    let version = "";
    // 配置文件
    let packageFilePath = path.join(path.resolve(__dirname, ".."), "package.json");
    //将json文件读出来获取版本号
    let packageData = fs.readFileSync(packageFilePath, "utf-8");
    if (packageData) {
        let packageJson = JSON.parse(packageData);
        version = packageJson.version;
    }

    if (!version) {
        console.error("package.json版本号version字段为空");
    }

    //替换常用系统标识
    let osName = os.type().replace("Windows_NT", "Windows").replace("Darwin", "Macintosh; Intel Mac OS X");
    let cusotmOsName = os.type().replace("Windows_NT", "windows").replace("Darwin", "Mac OS X");
    let osVersion = os.release();

    // 配置文件
    let configFilePath = path.join(path.resolve(__dirname, ".."), "app/config/appconfig.json");
    // 获取本次时间
    let dateTime = dateFormat(new Date(), "yyyyMMddHHmm");

    //将json文件读出来更新编译时间
    let configData = fs.readFileSync(configFilePath, "utf-8");
    if (configData) {
        let configJson = JSON.parse(configData);
        //客户端表示字符串
        let protocol = configJson.protocol;

        // 更新时间
        configJson.buildTime = dateTime;

        // 更新ua
        configJson.userAgent = `Mozilla/5.0 (${osName}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.121 Safari/537.36 ${protocol}_${version}_${cusotmOsName}${osVersion}_${dateTime}`;

        let dataStr = JSON.stringify(configJson, null, 2);
        fs.writeFileSync(configFilePath, dataStr, "utf-8");
        console.log("appconfig.json更新时间戳完成buildTime=" + dateTime);
    } else {
        console.error("appconfig.json更新时间戳失败");
    }
}


function dateFormat(date, fmt) {
    let o = {
        'M+': date.getMonth() + 1,
        'd+': date.getDate(),
        'H+': date.getHours(),
        'm+': date.getMinutes(),
        's+': date.getSeconds(),
        'S+': date.getMilliseconds()
    };
    //因为date.getFullYear()出来的结果是number类型的,所以为了让结果变成字符串型，下面有两种方法：
    if (/(y+)/.test(fmt)) {
        //第一种：利用字符串连接符“+”给date.getFullYear()+''，加一个空字符串便可以将number类型转换成字符串。
        fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
    }
    for (var k in o) {
        if (new RegExp('(' + k + ')').test(fmt)) {
            //第二种：使用String()类型进行强制数据类型转换String(date.getFullYear())，这种更容易理解。
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (('00' + o[k]).substr(String(o[k]).length)));
        }
    }
    return fmt;
};

befor_all();