# ClipBro

> A lightweight desktop clipboard manager with configurable LRU/LFU history and fast prefix search.

ClipBro continuously monitors the system clipboard and keeps a configurable history of copied text. Choose between **Least Recently Used (LRU)** and **Least Frequently Used (LFU)** eviction policies to control how entries are retained.

## Features

* 📋 **Automatic clipboard monitoring** — captures new text copied to the clipboard in real time.
* ⚡ **LRU & LFU caching** — switch between two O(1) cache-based eviction strategies.
* 🔎 **Prefix search** — Trie-based search for quickly finding clipboard entries.
* ⚙️ **Configurable capacity** — supports history sizes from 0 to 1000 entries.
* 🗑️ **Entry management** — delete individual entries or clear the entire history.
* 🖥️ **Desktop application** — built with Electron and React.
* 📦 **Windows installer** — packaged as a standalone Windows application.

## Tech Stack

* **Electron** — desktop application & system clipboard access
* **React + TypeScript** — user interface
* **Vite** — development & production builds
* **Lucide React** — interface icons

## Data Structures

ClipBro's core functionality is built around custom data structures:

* **Doubly Linked List** — O(1) insertion, removal, and cache reordering.
* **Hash Maps** — O(1) entry lookup and cache-node management.
* **LRU Cache** — removes the least recently used entry when capacity is exceeded.
* **LFU Cache** — removes the least frequently used entry using frequency buckets.
* **Trie** — enables prefix-based clipboard search.

The Trie operates on Unicode code points and uses an **iterative DFS** for result collection, avoiding call-stack overflow when searching through very large clipboard entries.

## Getting Started

### Prerequisites

* Node.js
* npm

### Development

```bash
git clone <https://github.com/Priyanshu9801/Clipboard-Manager>
cd clipboard-manager
npm install
npm run dev
```

### Build

Create a production build:

```bash
npm run build
```

The Windows installer is generated in the `release/` directory.

## Architecture

ClipBro keeps cache and application state in the Electron **main process**, while the React renderer communicates with it through a narrow IPC interface exposed by the preload layer.

```text
              Clipboard
                  ↓
          Clipboard Monitor
                  ↓
            CacheManager
         ┌────────┼────────┐
         ↓        ↓        ↓
        LRU      LFU      Trie
       Cache    Cache       ↓
                         Prefix Search
```

## Roadmap

Potential future improvements include persistent clipboard history, richer clipboard content support, and grapheme-aware prefix searching.

## License

See `LICENSE` for details.
