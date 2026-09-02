import CacheEntry from "./CacheEntry.ts";
import { DLLNode } from "./DoublyLinkedList.ts";
import LRUCache from "./LRUCache.ts";
import LFUCache from "./LFUCache.ts";
import Trie from "./Trie.ts";

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
    trie: Trie;

    evictExcessEntries(): void {
        while(this.nodesByText.size > this.capacity){
            let removedEntry: CacheEntry | null, removedNodes: NodesByPolicy | undefined;
            if(this.activePolicy === "lru"){
                removedEntry = this.lruCache.removeLruNode();
                if(removedEntry){
                    removedNodes = this.nodesByText.get(removedEntry.text);
                    if(removedNodes) this.lfuCache.removeNode(removedNodes.lfuNode);
                }
            }
            else{
                removedEntry = this.lfuCache.removeLfuNode();
                if(removedEntry){
                    removedNodes = this.nodesByText.get(removedEntry.text);
                    if(removedNodes) this.lruCache.removeNode(removedNodes.lruNode);
                }
            }

            if(removedEntry) {
                this.nodesByText.delete(removedEntry.text);
                this.trie.delete(removedEntry.text);
            }
        }
    }

    setCapacity(newCapacity: number): void {
        if (newCapacity < 0) {
            throw new Error("Capacity must be a non-negative integer");
        }
        
        this.capacity = newCapacity;
        this.evictExcessEntries();
    }

    put(text: string){
        if(text === "" || this.capacity===0) return;

        let nodesByPolicy = this.nodesByText.get(text);
        if(nodesByPolicy) {this.get(text); return;} 

        const cacheEntry = new CacheEntry(text);
        nodesByPolicy = {
            "lruNode": new DLLNode<CacheEntry>(cacheEntry),
            "lfuNode": new DLLNode<CacheEntry>(cacheEntry),
        }

        this.lruCache.put(nodesByPolicy.lruNode);
        this.lfuCache.put(nodesByPolicy.lfuNode);
        this.trie.insert(text);
        this.nodesByText.set(text, nodesByPolicy);
        
        this.evictExcessEntries();
    }

    get(text: string){
        const nodesByPolicy = this.nodesByText.get(text);
        if(nodesByPolicy){
            this.lruCache.get(nodesByPolicy.lruNode);
            this.lfuCache.get(nodesByPolicy.lfuNode);
        }
    }

    delete(text: string): boolean {
        const nodesByPolicy = this.nodesByText.get(text);
        if (!nodesByPolicy) return false;

        this.lruCache.removeNode(nodesByPolicy.lruNode);
        this.lfuCache.removeNode(nodesByPolicy.lfuNode);
        this.trie.delete(text);

        this.nodesByText.delete(text);

        return true;
    }

    getEntries(): CacheEntry[] {
        if (this.activePolicy === "lru") {
            return this.lruCache.getEntries();
        }

        return this.lfuCache.getEntries();
    }

    prefixSearch(prefix: string): string[] {
        return this.trie.prefixSearch(prefix);
    }

    clear(): void{
        this.nodesByText.clear();
        this.lruCache.clear();
        this.lfuCache.clear();
        this.trie.clear();
    }

    constructor(capacity: number) {
        if (capacity < 0) {
            throw new Error("Capacity must be a non-negative integer");
        }

        this.capacity = capacity;
        this.nodesByText = new Map<string, NodesByPolicy>();
        this.lruCache = new LRUCache();
        this.lfuCache = new LFUCache();
        this.activePolicy = "lru";
        this.trie = new Trie();
    }
}
