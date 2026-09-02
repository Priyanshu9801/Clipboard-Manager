import { ipcRenderer, contextBridge } from 'electron'
import { CacheSnapshot } from "../shared/types";

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('cacheApi', {
  getCacheSnapshot: () => ipcRenderer.invoke('cache:get-snapshot'),
  accessText: (text: string) => ipcRenderer.invoke('cache:access', text),
  setPolicy: (policy: 'lru' | 'lfu') => ipcRenderer.invoke('cache:set-policy', policy),
  deleteText: (text: string) => ipcRenderer.invoke('cache:delete', text),
  clearHistory: () => ipcRenderer.invoke('cache:clear-history'),
  setCapacity: (newCapacity: number) => ipcRenderer.invoke('cache:set-capacity', newCapacity),
  searchByPrefix: (prefix: string) => ipcRenderer.invoke('cache:prefix-search', prefix),

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
