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

    private collectEntries(node: TrieNode, currentText: string[], results: string[]): void {
        if (node.isEnd) {
            results.push(currentText.join(""));
        }

        for (const [ch, child] of node.children) {
            currentText.push(ch);

            this.collectEntries(child, currentText, results);

            currentText.pop();
        }
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