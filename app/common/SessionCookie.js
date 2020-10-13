const Store = require("electron-store");

const store = new Store();
const sessionCookieStoreKey = "cookies.loginWindow";

function getSession() {
  let session_ = store.get(sessionCookieStoreKey) || [];
  return session_;
}

function saveSession(cookies) {
  store.set(sessionCookieStoreKey, cookies);
}

function clearSession() {
  store.delete(sessionCookieStoreKey);
}

module.exports = {
  getSession,
  saveSession,
  clearSession,
};
