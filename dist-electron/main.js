var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { clipboard, ipcMain, app, BrowserWindow } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
class CacheEntry {
  constructor(text) {
    __publicField(this, "text");
    __publicField(this, "frequency");
    this.text = text;
    this.frequency = 1;
  }
}
class DLLNode {
  constructor(data = null) {
    __publicField(this, "data");
    __publicField(this, "prev");
    __publicField(this, "next");
    this.data = data;
    this.prev = null;
    this.next = null;
  }
}
class DoublyLinkedList {
  constructor() {
    __publicField(this, "head");
    __publicField(this, "tail");
    this.head = new DLLNode();
    this.tail = new DLLNode();
    this.head.prev = this.tail;
    this.tail.next = this.head;
  }
  addToFront(node) {
    node.prev = this.head.prev;
    node.next = this.head;
    if (this.head.prev !== null) {
      this.head.prev.next = node;
    }
    this.head.prev = node;
  }
  remove(node) {
    const prevNode = node.prev;
    const nextNode = node.next;
    if (prevNode !== null) {
      prevNode.next = nextNode;
    }
    if (nextNode !== null) {
      nextNode.prev = prevNode;
    }
    node.prev = null;
    node.next = null;
  }
  removeLast() {
    const node = this.tail.next;
    if (node === this.head) {
      return null;
    }
    if (node !== null) this.remove(node);
    return node;
  }
  isEmpty() {
    return this.head.prev === this.tail;
  }
  toArray() {
    const entries = [];
    let current = this.head.prev;
    while (current !== null && current !== this.tail) {
      if (current.data !== null) {
        entries.push(current.data);
      }
      current = current.prev;
    }
    return entries;
  }
}
class LRUCache {
  constructor() {
    __publicField(this, "list");
    this.list = new DoublyLinkedList();
  }
  get(node) {
    this.list.remove(node);
    this.list.addToFront(node);
  }
  put(node) {
    this.list.addToFront(node);
  }
  removeNode(node) {
    this.list.remove(node);
  }
  removeLruNode() {
    const removedNode = this.list.removeLast();
    if (removedNode) return removedNode.data;
    else return null;
  }
  getEntries() {
    return this.list.toArray();
  }
}
class LFUCache {
  constructor() {
    __publicField(this, "frequencyMap");
    __publicField(this, "minFreq");
    this.frequencyMap = /* @__PURE__ */ new Map();
    this.minFreq = 1;
  }
  get(node) {
    if (!node.data) return;
    this.removeNode(node, false);
    ++node.data.frequency;
    let newList = this.frequencyMap.get(node.data.frequency);
    if (!newList) {
      newList = new DoublyLinkedList();
      this.frequencyMap.set(node.data.frequency, newList);
    }
    newList.addToFront(node);
  }
  put(node) {
    let firstTimeList = this.frequencyMap.get(1);
    if (!firstTimeList) {
      firstTimeList = new DoublyLinkedList();
      this.frequencyMap.set(1, firstTimeList);
    }
    firstTimeList.addToFront(node);
    this.minFreq = 1;
  }
  removeNode(node, permanent) {
    if (!node.data) return;
    let list = this.frequencyMap.get(node.data.frequency);
    if (list) {
      list.remove(node);
    }
    if (list == null ? void 0 : list.isEmpty()) {
      this.frequencyMap.delete(node.data.frequency);
      if (!permanent && node.data.frequency === this.minFreq) {
        ++this.minFreq;
      }
    }
  }
  removeLfuNode() {
    let list = this.frequencyMap.get(this.minFreq);
    if (list) {
      const removedNode = list.removeLast();
      if (list.isEmpty()) this.frequencyMap.delete(this.minFreq);
      if (removedNode) return removedNode.data;
    }
    return null;
  }
  getEntries() {
    const entries = [];
    const frequencies = [...this.frequencyMap.keys()].sort((a, b) => b - a);
    for (const frequency of frequencies) {
      const list = this.frequencyMap.get(frequency);
      if (list) {
        entries.push(...list.toArray());
      }
    }
    return entries;
  }
}
class CacheManager {
  constructor(capacity) {
    __publicField(this, "capacity");
    __publicField(this, "nodesByText");
    __publicField(this, "lruCache");
    __publicField(this, "lfuCache");
    __publicField(this, "activePolicy");
    if (capacity <= 0) {
      throw new Error("Capacity must be greater than 0");
    }
    this.capacity = capacity;
    this.nodesByText = /* @__PURE__ */ new Map();
    this.lruCache = new LRUCache();
    this.lfuCache = new LFUCache();
    this.activePolicy = "lru";
  }
  put(text) {
    if (text === "") return;
    let nodesByPolicy = this.nodesByText.get(text);
    if (nodesByPolicy) {
      this.get(text);
      return;
    }
    const cacheEntry = new CacheEntry(text);
    nodesByPolicy = {
      "lruNode": new DLLNode(cacheEntry),
      "lfuNode": new DLLNode(cacheEntry)
    };
    if (this.nodesByText.size === this.capacity) {
      let removedEntry, removedNodes;
      if (this.activePolicy === "lru") {
        removedEntry = this.lruCache.removeLruNode();
        if (removedEntry) {
          removedNodes = this.nodesByText.get(removedEntry.text);
          if (removedNodes) this.lfuCache.removeNode(removedNodes.lfuNode, true);
        }
      } else {
        removedEntry = this.lfuCache.removeLfuNode();
        if (removedEntry) {
          removedNodes = this.nodesByText.get(removedEntry.text);
          if (removedNodes) this.lruCache.removeNode(removedNodes.lruNode);
        }
      }
      if (removedEntry) this.nodesByText.delete(removedEntry.text);
    }
    this.lruCache.put(nodesByPolicy.lruNode);
    this.lfuCache.put(nodesByPolicy.lfuNode);
    this.nodesByText.set(text, nodesByPolicy);
  }
  get(text) {
    const nodesByPolicy = this.nodesByText.get(text);
    if (nodesByPolicy) {
      this.lruCache.get(nodesByPolicy.lruNode);
      this.lfuCache.get(nodesByPolicy.lfuNode);
    }
  }
  getEntries() {
    if (this.activePolicy === "lru") {
      return this.lruCache.getEntries();
    }
    return this.lfuCache.getEntries();
  }
}
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
const cacheManager = new CacheManager(10);
let lastClipboardText = clipboard.readText();
let clipboardMonitor = null;
function getCacheSnapshot() {
  return {
    capacity: cacheManager.capacity,
    activePolicy: cacheManager.activePolicy,
    entries: cacheManager.getEntries().map((entry) => ({
      text: entry.text,
      frequency: entry.frequency
    }))
  };
}
ipcMain.handle("cache:get-snapshot", () => {
  return getCacheSnapshot();
});
ipcMain.handle("cache:add", (_event, text) => {
  cacheManager.put(text);
  return getCacheSnapshot();
});
ipcMain.handle("cache:access", (_event, text) => {
  clipboard.writeText(text);
});
ipcMain.handle("cache:set-policy", (_event, policy) => {
  if (policy !== "lru" && policy !== "lfu") {
    throw new Error("Invalid eviction policy.");
  }
  cacheManager.activePolicy = policy;
  return getCacheSnapshot();
});
function startClipboardMonitor() {
  if (clipboardMonitor) return;
  clipboardMonitor = setInterval(() => {
    const currentText = clipboard.readText();
    console.log(clipboard.availableFormats());
    if (!currentText || currentText === lastClipboardText) {
      return;
    }
    console.log(
      JSON.stringify(currentText),
      currentText.length
    );
    lastClipboardText = currentText;
    cacheManager.put(currentText);
    if (win) {
      win.webContents.send("clipboard:updated", getCacheSnapshot());
    }
  }, 500);
}
let win;
function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname$1, "preload.mjs")
    }
  });
  startClipboardMonitor();
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("before-quit", () => {
  if (clipboardMonitor) {
    clearInterval(clipboardMonitor);
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(createWindow);
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
