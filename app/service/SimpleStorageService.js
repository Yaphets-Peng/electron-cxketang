/**
 * 使用localStorage保存简单数据持久化到本地
 * @param {string} key 保存的数据键
 * @param {string} value 保存的数据值
 * @return {boolean} [true]
 */
function saveData(key, value) {
  window.localStorage.setItem(key, value);
  return true;
}

/**
 * 获取保存在localStorage中的数据
 * @param {string} key 获取数据的键
 * @return {string} 获取数据的值
 */
function getData(key) {
  return window.localStorage.getItem(key);
}

/**
 * 根据key删除数据
 * @param {string} key 获取数据的键
 * @return {boolean} [true]
 */
function removeData(key) {
  window.localStorage.removeItem(key);
  return true;
}

module.exports = {
  saveData,
  getData,
  removeData,
};
