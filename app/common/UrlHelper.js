// 根据name获取地址栏的参数值
function getQueryString(name) {
    let reg = new RegExp(`(^|&)${name}=([^&]*)(&|$)`)
    let hash = window.location.href
    let search = hash.split('?')
    let r = search[1] && search[1].match(reg)
    if (r != null) return r[2];
    return ''
}

// 拼接参数至url
function queryString(url, query) {
    let str = []
    for (let key in query) {
        str.push(key + '=' + query[key])
    }
    let paramStr = str.join('&')
    let joinStr = url.indexOf("?") > -1 ? "&" : "?";
    return paramStr ? `${url}${joinStr}${paramStr}` : url
}

module.exports = {
    getQueryString,
    queryString,
}