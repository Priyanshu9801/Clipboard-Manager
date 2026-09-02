"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("cacheApi", {
  getCacheSnapshot: () => electron.ipcRenderer.invoke("cache:get-snapshot"),
  accessText: (text) => electron.ipcRenderer.invoke("cache:access", text),
  setPolicy: (policy) => electron.ipcRenderer.invoke("cache:set-policy", policy),
  deleteText: (text) => electron.ipcRenderer.invoke("cache:delete", text),
  clearHistory: () => electron.ipcRenderer.invoke("cache:clear-history"),
  setCapacity: (newCapacity) => electron.ipcRenderer.invoke("cache:set-capacity", newCapacity),
  searchByPrefix: (prefix) => electron.ipcRenderer.invoke("cache:prefix-search", prefix),
  onClipboardUpdated: (callback) => {
    const listener = (_event, snapshot) => {
      callback(snapshot);
    };
    electron.ipcRenderer.on("clipboard:updated", listener);
    return () => {
      electron.ipcRenderer.removeListener("clipboard:updated", listener);
    };
  }
});
