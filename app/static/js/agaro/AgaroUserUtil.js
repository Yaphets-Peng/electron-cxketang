var AgaroUserUtil = {
    userId: "",//会议中用户id
    userIdLimit: 1000000000,// 用户id区间标识
}

// 获取真实用户id用于通用处理puid
AgaroUserUtil.getRealPuid = function (id, isNumber) {
    let isNumberFlag = false;
    if (isNumber) {
        isNumberFlag = true;
    }
    try {
        if (id) {
            let tempId = parseInt(id);
            if (tempId > AgaroUserUtil.userIdLimit) {
                tempId = tempId - AgaroUserUtil.userIdLimit;
                if (isNumberFlag) {
                    return tempId;
                }
                return tempId + "";
            }
        }
    } catch (e) {
    }
    if (isNumberFlag) {
        return parseInt(id);
    }
    return id + "";
}

// 判断是否是音视频流id
AgaroUserUtil.isVideoId = function (id) {
    try {
        if (id) {
            let tempId = parseInt(id);
            //大于userIdLimit则不是
            if (tempId <= AgaroUserUtil.userIdLimit) {
                return true;
            }
        }
    } catch (e) {
    }
    return false;
}

// 判断是否是投屏流id
AgaroUserUtil.isScreenId = function (id) {
    try {
        if (id) {
            var tempId = parseInt(id);
            //小于userIdLimit则不是
            if (tempId > AgaroUserUtil.userIdLimit) {
                return true;
            }
        }
    } catch (e) {
    }
    return false;
}

// 获取投屏用户id用于投屏处理id
AgaroUserUtil.getScreenPuid = function (puid, isNumber) {
    let isNumberFlag = false;
    if (isNumber) {
        isNumberFlag = true;
    }
    try {
        if (puid) {
            let tempPuid = parseInt(puid);
            tempPuid = tempPuid + AgaroUserUtil.userIdLimit;
            if (isNumberFlag) {
                return tempPuid;
            }
            return tempPuid + "";
        }
    } catch (e) {
    }
    if (isNumberFlag) {
        return parseInt(puid);
    }
    return puid + "";
}

module.exports = AgaroUserUtil;