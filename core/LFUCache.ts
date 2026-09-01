import {DLLNode, DoublyLinkedList} from "./DoublyLinkedList.ts";
import CacheEntry from "./CacheEntry.ts"

class FreqList {
  freq: number;
  entries: DoublyLinkedList<CacheEntry>;
  prev: FreqList | null;
  next: FreqList | null;

  constructor(freq: number) {
    this.freq = freq;
    this.entries = new DoublyLinkedList<CacheEntry>();
    this.prev = null;
    this.next = null;
  }
}

export default class LFUCache {
  // Sentinels:
  // tail <-> least frequent ... most frequent <-> head
  private head: FreqList;
  private tail: FreqList;

  private frequencyMap: Map<number, FreqList> = new Map();

  constructor() {
    this.head = new FreqList(Infinity);
    this.tail = new FreqList(0);

    this.head.prev = this.tail;
    this.tail.next = this.head;
  }

  put(node: DLLNode<CacheEntry>) {
    if(!node.data) return;

    let freqList = this.frequencyMap.get(1);

    if (!freqList) {
      freqList = new FreqList(1);
      this.insertFrequencyList(freqList, this.tail);
      this.frequencyMap.set(1, freqList);
    }

    freqList.entries.addToFront(node);
  }

  get(node: DLLNode<CacheEntry>) {
    if (!node.data) return;

    const currentFreq = node.data.frequency;
    const currentFreqList = this.frequencyMap.get(currentFreq);

    if (!currentFreqList) return;

    currentFreqList.entries.remove(node);

    node.data.frequency = currentFreq + 1;

    let previousFreqList = currentFreqList;

    if (currentFreqList.entries.isEmpty()) {
      // Preserve prev BEFORE removing currentFreqList.
      previousFreqList = currentFreqList.prev!;

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

  removeNode(node: DLLNode<CacheEntry>) {
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

  removeLfuNode(): CacheEntry | null {
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

  clear(): void {
    this.frequencyMap.clear();
    this.head.prev = this.tail;
    this.tail.next = this.head;
  }

  getEntries(): CacheEntry[] {
    const entries: CacheEntry[] = [];

    let current = this.head.prev;

    while (current && current !== this.tail) {
      entries.push(...current.entries.toArray());
      current = current.prev;
    }

    return entries;
  }

  private insertFrequencyList(newFreqList: FreqList, previousFreqList: FreqList) {
    const nextFreqList = previousFreqList.next!;

    newFreqList.prev = previousFreqList;
    newFreqList.next = nextFreqList;

    previousFreqList.next = newFreqList;
    nextFreqList.prev = newFreqList;
  }

  private removeFrequencyList(freqList: FreqList) {
    const previousFreqList = freqList.prev!;
    const nextFreqList = freqList.next!;

    previousFreqList.next = nextFreqList;
    nextFreqList.prev = previousFreqList;

    freqList.prev = null;
    freqList.next = null;
  }
}