import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('cacheApi', {
  getCacheSnapshot: () => ipcRenderer.invoke('cache:get-snapshot'),
  addText: (text: string) => ipcRenderer.invoke('cache:add', text),
  accessText: (text: string) => ipcRenderer.invoke('cache:access', text),
  setPolicy: (policy: 'lru' | 'lfu') => ipcRenderer.invoke('cache:set-policy', policy),
})
