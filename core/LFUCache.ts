import {DLLNode, DoublyLinkedList} from "./DoublyLinkedList.ts";
import CacheEntry from "./CacheEntry.ts"

export default class LFUCache {
    frequencyMap: Map<number, DoublyLinkedList<CacheEntry>>;
    minFreq: number;
    
    get(node: DLLNode<CacheEntry>){
        if(!node.data) return;
        this.removeNode(node, false);

        ++node.data.frequency;

        let newList = this.frequencyMap.get(node.data.frequency);
        if(!newList){
            newList = new DoublyLinkedList<CacheEntry>();
            this.frequencyMap.set(node.data.frequency, newList);
        }
        newList.addToFront(node);
    }

    put(node: DLLNode<CacheEntry>){
        let firstTimeList = this.frequencyMap.get(1);
        if(!firstTimeList){
            firstTimeList = new DoublyLinkedList<CacheEntry>();
            this.frequencyMap.set(1, firstTimeList); 
        }
        
        firstTimeList.addToFront(node);
        this.minFreq=1;
    }

    removeNode(node: DLLNode<CacheEntry>, permanent: boolean){
        if(!node.data) return;
        let list = this.frequencyMap.get(node.data.frequency);

        if(list){
            list.remove(node);
        }

        if(list?.isEmpty()){
            this.frequencyMap.delete(node.data.frequency);

            if((!permanent) && (node.data.frequency===this.minFreq)){
                ++this.minFreq; 
            }
        }
    }

    removeLfuNode(): CacheEntry | null{
        let list = this.frequencyMap.get(this.minFreq);
        if(list){
            const removedNode = list.removeLast();
            if(list.isEmpty()) this.frequencyMap.delete(this.minFreq);
            if(removedNode) return removedNode.data;
        }
        return null;
    }

    getEntries(): CacheEntry[] {
        const entries: CacheEntry[] = [];

        const frequencies = [...this.frequencyMap.keys()].sort((a, b) => b - a);

        for (const frequency of frequencies) {
            const list = this.frequencyMap.get(frequency);

            if (list) {
                entries.push(...list.toArray());
            }
        }

        return entries;
    }

    constructor(){
        this.frequencyMap = new Map<number, DoublyLinkedList<CacheEntry>>();
        this.minFreq=1;
    }
}