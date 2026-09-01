import { ipcRenderer, contextBridge } from 'electron'
import { CacheSnapshot } from "../shared/types";

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('cacheApi', {
  getCacheSnapshot: () => ipcRenderer.invoke('cache:get-snapshot'),
  addText: (text: string) => ipcRenderer.invoke('cache:add', text),
  accessText: (text: string) => ipcRenderer.invoke('cache:access', text),
  setPolicy: (policy: 'lru' | 'lfu') => ipcRenderer.invoke('cache:set-policy', policy),

  onClipboardUpdated: (callback: (snapshot: CacheSnapshot) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, snapshot: CacheSnapshot) => {
      callback(snapshot);
    }

    ipcRenderer.on('clipboard:updated', listener);

    return () => {
      ipcRenderer.removeListener('clipboard:updated', listener);
    }
  },
})
