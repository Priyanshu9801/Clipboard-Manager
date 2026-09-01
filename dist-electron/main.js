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
  clear() {
    this.list.head.prev = this.list.tail;
    this.list.tail.next = this.list.head;
  }
  getEntries() {
    return this.list.toArray();
  }
}
class FreqList {
  constructor(freq) {
    __publicField(this, "freq");
    __publicField(this, "entries");
    __publicField(this, "prev");
    __publicField(this, "next");
    this.freq = freq;
    this.entries = new DoublyLinkedList();
    this.prev = null;
    this.next = null;
  }
}
class LFUCache {
  constructor() {
    // Sentinels:
    // tail <-> least frequent ... most frequent <-> head
    __publicField(this, "head");
    __publicField(this, "tail");
    __publicField(this, "frequencyMap", /* @__PURE__ */ new Map());
    this.head = new FreqList(Infinity);
    this.tail = new FreqList(0);
    this.head.prev = this.tail;
    this.tail.next = this.head;
  }
  put(node) {
    if (!node.data) return;
    let freqList = this.frequencyMap.get(1);
    if (!freqList) {
      freqList = new FreqList(1);
      this.insertFrequencyList(freqList, this.tail);
      this.frequencyMap.set(1, freqList);
    }
    freqList.entries.addToFront(node);
  }
  get(node) {
    if (!node.data) return;
    const currentFreq = node.data.frequency;
    const currentFreqList = this.frequencyMap.get(currentFreq);
    if (!currentFreqList) return;
    currentFreqList.entries.remove(node);
    node.data.frequency = currentFreq + 1;
    let previousFreqList = currentFreqList;
    if (currentFreqList.entries.isEmpty()) {
      previousFreqList = currentFreqList.prev;
      this.removeFrequencyList(currentFreqList);
      this.frequencyMap.delete(currentFreq);
    }
    let nextFreqList = this.frequencyMap.get(node.data.frequency);
    if (!nextFreqList) {
      nextFreqList = new FreqList(node.data.frequency);
      this.insertFrequencyList(nextFreqList, previousFreqList);
      this.frequencyMap.set(node.data.frequency, nextFreqList);
    }
    nextFreqList.entries.addToFront(node);
  }
  removeNode(node) {
    if (!node.data) return;
    const freq = node.data.frequency;
    const freqList = this.frequencyMap.get(freq);
    if (!freqList) return;
    freqList.entries.remove(node);
    if (freqList.entries.isEmpty()) {
      this.removeFrequencyList(freqList);
      this.frequencyMap.delete(freq);
    }
  }
  removeLfuNode() {
    const leastFreqList = this.tail.next;
    if (!leastFreqList || leastFreqList === this.head) {
      return null;
    }
    const removedNode = leastFreqList.entries.removeLast();
    if (!removedNode) return null;
    if (leastFreqList.entries.isEmpty()) {
      this.removeFrequencyList(leastFreqList);
      this.frequencyMap.delete(leastFreqList.freq);
    }
    return removedNode.data;
  }
  clear() {
    this.frequencyMap.clear();
    this.head.prev = this.tail;
    this.tail.next = this.head;
  }
  getEntries() {
    const entries = [];
    let current = this.head.prev;
    while (current && current !== this.tail) {
      entries.push(...current.entries.toArray());
      current = current.prev;
    }
    return entries;
  }
  insertFrequencyList(newFreqList, previousFreqList) {
    const nextFreqList = previousFreqList.next;
    newFreqList.prev = previousFreqList;
    newFreqList.next = nextFreqList;
    previousFreqList.next = newFreqList;
    nextFreqList.prev = newFreqList;
  }
  removeFrequencyList(freqList) {
    const previousFreqList = freqList.prev;
    const nextFreqList = freqList.next;
    previousFreqList.next = nextFreqList;
    nextFreqList.prev = previousFreqList;
    freqList.prev = null;
    freqList.next = null;
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
          if (removedNodes) this.lfuCache.removeNode(removedNodes.lfuNode);
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
  delete(text) {
    const nodesByPolicy = this.nodesByText.get(text);
    if (!nodesByPolicy) return false;
    this.lruCache.removeNode(nodesByPolicy.lruNode);
    this.lfuCache.removeNode(nodesByPolicy.lfuNode);
    this.nodesByText.delete(text);
    return true;
  }
  getEntries() {
    if (this.activePolicy === "lru") {
      return this.lruCache.getEntries();
    }
    return this.lfuCache.getEntries();
  }
  clear() {
    this.nodesByText.clear();
    this.lruCache.clear();
    this.lfuCache.clear();
  }
}
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
const cacheManager = new CacheManager(5);
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
ipcMain.handle("cache:delete", (_event, text) => {
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
