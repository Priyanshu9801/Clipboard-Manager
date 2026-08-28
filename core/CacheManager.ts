import CacheEntry from "./CacheEntry.ts";
import { DLLNode } from "./DoublyLinkedList.ts";
import LRUCache from "./LRUCache.ts";
import LFUCache from "./LFUCache.ts";

type ActivePolicy = "lru" | "lfu";

interface NodesByPolicy {
    lruNode: DLLNode<CacheEntry>;
    lfuNode: DLLNode<CacheEntry>;
}

export default class CacheManager {
    capacity: number;
    nodesByText: Map<string, NodesByPolicy>;
    lruCache: LRUCache;
    lfuCache: LFUCache;
    activePolicy: ActivePolicy;

    put(text: string){
        if(text === "") return;

        let nodesByPolicy = this.nodesByText.get(text);
        if(nodesByPolicy) {this.get(text); return;} 

        const cacheEntry = new CacheEntry(text);
        nodesByPolicy = {
            "lruNode": new DLLNode<CacheEntry>(cacheEntry),
            "lfuNode": new DLLNode<CacheEntry>(cacheEntry),
        }

        if(this.nodesByText.size === this.capacity){
            let removedEntry, removedNodes;
            if(this.activePolicy === "lru"){
                removedEntry = this.lruCache.removeLruNode();
                if(removedEntry){
                    removedNodes = this.nodesByText.get(removedEntry.text);
                    if(removedNodes) this.lfuCache.removeNode(removedNodes.lfuNode, true);
                }
            }
            else{
                removedEntry = this.lfuCache.removeLfuNode();
                if(removedEntry){
                    removedNodes = this.nodesByText.get(removedEntry.text);
                    if(removedNodes) this.lruCache.removeNode(removedNodes.lruNode);
                }
            }

            if(removedEntry) this.nodesByText.delete(removedEntry.text);
        }

        this.lruCache.put(nodesByPolicy.lruNode);
        this.lfuCache.put(nodesByPolicy.lfuNode);
        this.nodesByText.set(text, nodesByPolicy);
    }

    get(text: string){
        const nodesByPolicy = this.nodesByText.get(text);
        if(nodesByPolicy){
            this.lruCache.get(nodesByPolicy.lruNode);
            this.lfuCache.get(nodesByPolicy.lfuNode);
        }
    }

    getEntries(): CacheEntry[] {
        if (this.activePolicy === "lru") {
            return this.lruCache.getEntries();
        }

        return this.lfuCache.getEntries();
    }

    constructor(capacity: number) {
        if (capacity <= 0) {
            throw new Error("Capacity must be greater than 0");
        }

        this.capacity = capacity;
        this.nodesByText = new Map<string, NodesByPolicy>();
        this.lruCache = new LRUCache();
        this.lfuCache = new LFUCache();
        this.activePolicy = "lru";
    }
}
