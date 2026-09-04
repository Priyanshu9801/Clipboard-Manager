class TrieNode {
    children: Map<string, TrieNode>;
    parent: TrieNode | null;
    entryCount: number;
    isEnd: boolean;

    constructor(parent: TrieNode | null = null) {
        this.children = new Map<string, TrieNode>();
        this.parent = parent;
        this.entryCount = 0;
        this.isEnd = false;
    }
}

export default class Trie {
    private root: TrieNode;

    constructor() {
        this.root = new TrieNode();
    }

    insert(text: string): void {
        if (text === "") return;

        let current = this.root;

        for (const ch of text) {
            let next = current.children.get(ch);

            if (!next) {
                next = new TrieNode(current);
                current.children.set(ch, next);
            }

            current = next;
            current.entryCount++;
        }

        current.isEnd = true;
    }

    prefixSearch(prefix: string): string[] {
        let current = this.root;

        for (const ch of prefix) {
            const next = current.children.get(ch);

            if (!next) {
                return [];
            }

            current = next;
        }

        const results: string[] = [];
        const currentText = Array.from(prefix);

        this.collectEntries(current, currentText, results);

        return results;
    }

    private collectEntries(begin: TrieNode, currentText: string[], results: string[]): void {
        interface StackEntry{
            node: TrieNode,
            iterator: MapIterator<[string, TrieNode]>,
        }
        
        const stack: StackEntry[] = [];
        stack.push({node: begin, iterator: begin.children.entries()});

        while(stack.length>0){
            const {node, iterator} = stack.at(-1)!;
            const next = iterator.next();
            
            if(next.done){
                if(node.isEnd) results.push(currentText.join(""));
                currentText.pop();
                stack.pop();
                continue;
            }
            
            const nextNode = next.value[1];
            currentText.push(next.value[0]);
            stack.push({node: nextNode, iterator: nextNode.children.entries()});
        }
        
        return;
    }

    delete(text: string): void {
        if (text === "") return;

        let current = this.root;

        for (const ch of text) {
            const next = current.children.get(ch);

            if (!next) return;

            current = next;
            current.entryCount--;

            if (current.entryCount === 0) {
                current.parent!.children.delete(ch);
                return;
            }
        }

        current.isEnd = false;
    }

    clear(): void {
        this.root = new TrieNode();
    }
}