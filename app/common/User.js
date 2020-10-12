const Store = require("electron-store");

const store = new Store();
const userInfoStoreKey = "userInfo";
const uidKey = "UID";
const vcKey = "vc";
const vc3Key = "vc3";
const dKey = "_d";

function getVal(configname) {
  let userInfo_ = store.get(userInfoStoreKey) || {};
  return userInfo_[configname];
}

function getUID() {
  return getVal(uidKey);
}

function getVC() {
  return getVal(vcKey);
}

function getVC3() {
  return getVal(vc3Key);
}

function getD() {
  return getVal(dKey);
}

function getUIDKey() {
  return uidKey;
}

function getVCKey() {
  return vcKey;
}

function getVC3Key() {
  return vc3Key;
}

function getDKey() {
  return dKey;
}

function saveUserInfo(UID, vc, vc3, d) {
  let data = { "UID": UID, "vc": vc, "vc3": vc3, "_d": d };
  store.set(userInfoStoreKey, data);
}

function clearUserInfo() {
  store.delete(userInfoStoreKey);
}

function isLogin() {
  let UIDval = getUID();
  if (typeof UIDval === "undefined" || UIDval == null || UIDval === "") {
    return false;
  }
  return true;
}

module.exports = {
  getUID,
  getUIDKey,
  getVC,
  getVCKey,
  getVC3,
  getVC3Key,
  getD,
  getDKey,
  saveUserInfo,
  clearUserInfo,
  isLogin,
};
