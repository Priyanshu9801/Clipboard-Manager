import { app, BrowserWindow, ipcMain, clipboard } from 'electron'
// import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import CacheManager from "../core/CacheManager.ts"

// const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

const cacheManager = new CacheManager(5);
let lastClipboardText = clipboard.readText();
let clipboardMonitor: NodeJS.Timeout | null = null;

function getCacheSnapshot() {
    return {
        capacity: cacheManager.capacity,
        activePolicy: cacheManager.activePolicy,
        entries: cacheManager.getEntries().map((entry) => ({
            text: entry.text,
            frequency: entry.frequency,
        })),
    };
}

ipcMain.handle("cache:get-snapshot", () => {
    return getCacheSnapshot();
});

ipcMain.handle("cache:add", (_event, text: string) => {
    cacheManager.put(text);
    return getCacheSnapshot();
});

ipcMain.handle("cache:access", (_event, text: string) => {
    clipboard.writeText(text);
});

ipcMain.handle("cache:set-policy", (_event, policy: string) => {
    if (policy !== "lru" && policy !== "lfu") {
        throw new Error("Invalid eviction policy.");
    }

    cacheManager.activePolicy = policy;
    return getCacheSnapshot();
});

ipcMain.handle("cache:delete", (_event, text: string) => {
    cacheManager.delete(text);
    return getCacheSnapshot();
});

ipcMain.handle("cache:clear-history", (_event) => {
    cacheManager.clear();
    return getCacheSnapshot();
});

function startClipboardMonitor() {
  if (clipboardMonitor) return;

  clipboardMonitor = setInterval(() => {
    const currentText = clipboard.readText();
    //console.log(clipboard.availableFormats()); //For debugging

    if (!currentText || currentText === lastClipboardText) {
      return;
    }

    console.log(
      JSON.stringify(currentText),
      currentText.length
    ); //For debugging

    lastClipboardText = currentText;
    cacheManager.put(currentText);

    if (win) {
      win.webContents.send("clipboard:updated", getCacheSnapshot());
    }
  }, 500);
}

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  startClipboardMonitor();

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('before-quit', () => {
  if (clipboardMonitor) {
    clearInterval(clipboardMonitor);
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)
