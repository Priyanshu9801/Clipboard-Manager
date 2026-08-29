"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("cacheApi", {
  getCacheSnapshot: () => electron.ipcRenderer.invoke("cache:get-snapshot"),
  addText: (text) => electron.ipcRenderer.invoke("cache:add", text),
  accessText: (text) => electron.ipcRenderer.invoke("cache:access", text),
  setPolicy: (policy) => electron.ipcRenderer.invoke("cache:set-policy", policy)
});
