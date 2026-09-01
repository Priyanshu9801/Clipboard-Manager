import {DLLNode, DoublyLinkedList} from "./DoublyLinkedList.ts";
import CacheEntry from "./CacheEntry.ts"

export default class LRUCache {
    list: DoublyLinkedList<CacheEntry>;
    
    get(node: DLLNode<CacheEntry>){
        this.list.remove(node);
        this.list.addToFront(node);
    }

    put(node: DLLNode<CacheEntry>){
        this.list.addToFront(node);
    }

    removeNode(node: DLLNode<CacheEntry>){
        this.list.remove(node);
    }

    removeLruNode(): CacheEntry | null {
        const removedNode = this.list.removeLast();
        if(removedNode) return removedNode.data;
        else return null;
    }

    clear(): void {
        this.list.head.prev = this.list.tail;
        this.list.tail.next = this.list.head;
    }

    getEntries(): CacheEntry[] {
        return this.list.toArray();
    }

    constructor(){
        this.list = new DoublyLinkedList<CacheEntry>();
    }
}