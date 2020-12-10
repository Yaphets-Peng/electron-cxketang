const fs = require("fs");
const os = require("os");
const path = require("path");
const readline = require("readline");

function main() {
    // 读取产品配置文件
    let productFilePath = path.join(path.resolve(__dirname, ".."), "product/product.json");
    let productData = fs.readFileSync(productFilePath, "utf-8");
    if (productData) {
        // 交互对话框
        productData = JSON.parse(productData);
        // 实际ua版本号
        let uaVersion = productData.uaVersion;
        //强制替换对象
        productData = productData.productInfos;
        for (let productKey in productData) {
            process.stdout.write(productKey + "、" + productData[productKey].schoolName + "\n");
        }
        let rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question("请选择产品Id(直接回车默认选择3)\n", (response) => {
            // 产品ID
            let productId = "3";
            // 验证一下
            if (response) {
                productId = response;
            }
            // 产品信息
            let productObject = productData[productId];
            if (!productObject) {
                throw new Error("请检查所输入产品Id[" + response + "]是否存在于文件[" + productFilePath + "]中");
                return;
            }
            console.log("当前选择产品ID为", response, productObject, uaVersion);
            befor_all(productId, productObject, uaVersion);
            rl.close();
        });
    }
}


async function befor_all(productId, productObject, uaVersion) {
    if (!productId || !productObject || !uaVersion) {
        throw new Error("请检查参数是否正确");
        return;
    }
    // 编译信息部分
    let version = "";
    let appId = "";
    // 配置文件
    let packageFilePath = path.join(path.resolve(__dirname, ".."), "package.json");
    //将json文件读出来获取版本号
    let packageData = fs.readFileSync(packageFilePath, "utf-8");
    if (packageData) {
        let packageJson = JSON.parse(packageData);
        
        // 系统版本信息
        let appIdInfo = os.type().replace("Windows_NT", "winAppId").replace("Darwin", "macAppId");
        // 获取包名
        appIdInfo = productObject[appIdInfo];
        if (!appIdInfo) {
            throw new Error("请检查包名参数是否正确");
            return;
        }
        
        // 更新项目名称
        packageJson.name = productObject.name;
        // 更新版本号
        packageJson.version = productObject.version;
        // 更新应用包名
        packageJson.build.appId = appIdInfo;
        // 更新文件说明
        packageJson.description = productObject.description;
        // 更新应用名称
        packageJson.build.productName = productObject.productName;
        // 更新应用版权
        packageJson.build.copyright = productObject.copyright;
        // 更新打包输出文件名
        packageJson.build.artifactName = productObject.filePrefix + "_${version}.${ext}";
        // 更新打包输出目录
        packageJson.build.directories.output = "build/" + productId + "/${os}";

        version = packageJson.version;
        appId = packageJson.build.appId;

        if (!version) {
            throw new Error("package.json版本号version字段为空");
            return;
        }
        if (!appId) {
            throw new Error("package.json应用appId字段为空");
            return;
        }

        let packageDataStr = JSON.stringify(packageJson, null, 2);
        fs.writeFileSync(packageFilePath, packageDataStr, "utf-8");
        console.log("package.json更新信息完成");
    }

    //替换常用系统标识
    let osName = os.type().replace("Windows_NT", "Windows").replace("Darwin", "Macintosh; Intel Mac OS X");
    let cusotmOsName = os.type().replace("Windows_NT", "windows").replace("Darwin", "MacOS");
    let osVersion = os.release();
    let osArch = os.arch();

    // 配置文件
    let configFilePath = path.join(path.resolve(__dirname, ".."), "app/config/appconfig.json");
    // 获取本次时间
    let dateTime = dateFormat(new Date(), "yyyyMMddHHmm");

    //将json文件读出来更新编译时间
    let configData = fs.readFileSync(configFilePath, "utf-8");
    if (configData) {
        let configJson = JSON.parse(configData);
        // 客户端表示字符串
        let protocol = configJson.protocol;

        let oldProductId = configJson.productId;
        // if (productId != oldProductId) {
        console.log("开始替换产品对应文件,[" + oldProductId + "]->[" + productId + "]");
        // 获取产品对应图标目录
        let iconsDirectoryPathForProduct = path.join(path.resolve(__dirname, ".."), "product/" + productId);
        if (fs.existsSync(iconsDirectoryPathForProduct)) {
            // 项目默认的图标目录
            let iconsDirectoryPath = path.join(path.resolve(__dirname, ".."), "app/icons");
            // 删除目录
            deleteDirectory(iconsDirectoryPath);
            iconsDirectoryPath = path.join(path.resolve(__dirname, ".."), "app");
            // 拷贝目录
            copyDirectory(iconsDirectoryPathForProduct, iconsDirectoryPath);
            console.log("替换产品对应文件完成,[" + oldProductId + "]->[" + productId + "]");
        }
        // }

        // 更新时间
        configJson.buildTime = dateTime;
        // 更新产品id
        configJson.productId = productId;
        // 更新内置窗口标题
        configJson.title = productObject.title;
        // 更新ua
        configJson.userAgent = `Mozilla/5.0 (${osName};${osArch};${osVersion}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.121 Safari/537.36 KeTangVersion/${version} ${appId}/${protocol}_${uaVersion}_${productId}_${cusotmOsName}_${dateTime}`;

        let configDataStr = JSON.stringify(configJson, null, 2);
        fs.writeFileSync(configFilePath, configDataStr, "utf-8");
        console.log("appconfig.json更新时间戳完成buildTime=" + dateTime);
    } else {
        throw new Error("appconfig.json更新时间戳失败");
        return;
    }
}

// 生成固定日期格式
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

// 递归拷贝目录
function copyDirectory(src, dest) {
    if (fs.existsSync(dest) == false) {
        fs.mkdirSync(dest);
    }
    if (fs.existsSync(src) == false) {
        return false;
    }
    // console.log("src:" + src + ", dest:" + dest);
    // 拷贝新的内容进去
    let dirs = fs.readdirSync(src);
    dirs.forEach(function (item) {
        let item_path = path.join(src, item);
        let temp = fs.statSync(item_path);
        if (temp.isFile()) {
            // 是文件
            // console.log("Item Is File:" + item);
            fs.copyFileSync(item_path, path.join(dest, item));
        } else if (temp.isDirectory()) {
            // 是目录
            // console.log("Item Is Directory:" + item);
            copyDirectory(item_path, path.join(dest, item));
        }
    });
}

// 递归删除目录
function deleteDirectory(dir) {
    if (fs.existsSync(dir) == true) {
        let files = fs.readdirSync(dir);
        files.forEach(function (item) {
            let item_path = path.join(dir, item);
            // console.log(item_path);
            if (fs.statSync(item_path).isDirectory()) {
                deleteDirectory(item_path);
            } else {
                fs.unlinkSync(item_path);
            }
        });
        fs.rmdirSync(dir);
    }
}

main();