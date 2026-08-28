export default class CacheEntry {
    text: string;
    frequency: number;

    constructor(text: string) {
        this.text = text;
        this.frequency = 1;
    }
}