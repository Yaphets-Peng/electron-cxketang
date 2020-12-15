require('dotenv').config()
const {notarize} = require('electron-notarize')

exports.default = async function notarizing(context) {
    const appName = context.packager.appInfo.productFilename
    const {electronPlatformName, appOutDir} = context
    if (electronPlatformName !== 'darwin') {
        return;
    }
    // 开发环境-暂时不公正app，直接后续公证pkg或dmg 2020-11-18
    if (process.env.NODE_ENV === "dev") {
        return;
    } else {
        return;
    }

    let appPath = `${appOutDir}/${appName}.app`
    let appBundleId = context.packager.info._configuration.appId;
    //let {appleId, ascProvider, appleIdPassword} = process.env
    let appleId = "2156955368@qq.com";
    let ascProvider = "7U3C65Y5PJ";
    let appleIdPassword = "wtwm-opav-pfty-wvat";

    return await notarize({
        appBundleId,
        appPath,
        ascProvider,
        appleId,
        appleIdPassword
    })
}