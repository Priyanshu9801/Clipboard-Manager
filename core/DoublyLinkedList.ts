export class DLLNode<T> {
    data: T | null;
    prev: DLLNode<T> | null;
    next: DLLNode<T> | null;

    constructor(data: T | null = null) {
        this.data = data;
        this.prev = null;
        this.next = null;
    }
}

export class DoublyLinkedList<T> {
    head: DLLNode<T>;
    tail: DLLNode<T>;

    addToFront(node: DLLNode<T>): void {
        node.prev=this.head.prev;
        node.next=this.head;

        if(this.head.prev !== null){
            this.head.prev.next=node;
        }

        this.head.prev=node;
    }

    remove(node: DLLNode<T>): void {
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

    removeLast(): DLLNode<T> | null {
        const node = this.tail.next;

        if (node === this.head) {
            return null;
        }

        if(node !== null) this.remove(node);

        return node;
    }

    isEmpty(): boolean {
        return (this.head.prev === this.tail);
    }

    toArray(): T[] {
        const entries: T[] = [];
        let current = this.head.prev;

        while (current !== null && current !== this.tail) {
            if (current.data !== null) {
                entries.push(current.data);
            }

            current = current.prev;
        }

        return entries;
    }

    constructor() {
        this.head = new DLLNode<T>();
        this.tail = new DLLNode<T>();

        this.head.prev = this.tail;
        this.tail.next = this.head;
    }
}