import { FormEvent, useState, useEffect } from "react";
// import CacheEntry from "./core/CacheEntry.ts";
// import { CacheManager } from "./core/CacheManager.ts";
import "./App.css";

interface CacheEntry {
  text: string,
  frequency: number,
}

interface CacheSnapshot {
  capacity: number,
  activePolicy: "lru" | "lfu",
  entries: CacheEntry[],
}

declare global {
  interface Window {
    cacheApi: {
      getCacheSnapshot: () => Promise<CacheSnapshot>;
      addText: (text: string) => Promise<CacheSnapshot>;
      accessText: (text: string) => Promise<CacheSnapshot>;
      setPolicy: (policy: 'lru' | 'lfu') => Promise<CacheSnapshot>;
    };
  }
}

function App() {
  const [cacheSnapshot, setCacheSnapshot] = useState<CacheSnapshot | null>(null); 
  const [text, setText] = useState("");

  useEffect(() => {
    window.cacheApi.getCacheSnapshot().then((snapshot) => {
      setCacheSnapshot(snapshot);
    });
  }, []);

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    if (text.trim() === "") return;
    const newSnapshot = await window.cacheApi.addText(text);
    setCacheSnapshot(newSnapshot);
    setText("");
  }

  async function handleAccess(entryText: string) {
    const newSnapshot = await window.cacheApi.accessText(entryText);
    setCacheSnapshot(newSnapshot);
  }

  async function handlePolicyChange(policy: 'lru' | 'lfu') {
    if(cacheSnapshot && cacheSnapshot.activePolicy === policy) return;
    
    const newSnapshot = await window.cacheApi.setPolicy(policy);
    setCacheSnapshot(newSnapshot);
  }
  
  if(!cacheSnapshot){
    return (<h1>Loading....Please Wait</h1>);
  }

  return (
    <>
      <main className="app">
        <h1>Clipboard Manager</h1>
        <p>Capacity: {cacheSnapshot.capacity}</p>

        <section className="controls">
          <span>Eviction policy:</span>

          <button
            className={cacheSnapshot.activePolicy === "lru" ? "selected" : ""}
            onClick={() => handlePolicyChange("lru")}
          >
            LRU
          </button>

          <button
            className={cacheSnapshot.activePolicy === "lfu" ? "selected" : ""}
            onClick={() => handlePolicyChange("lfu")}
          >
            LFU
          </button>
        </section>

        <form onSubmit={handleAdd} className="add-form">
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Add text"
          />
          <button type="submit">Add</button>
        </form>

        <section className="history">
          <h2>Cached entries ({cacheSnapshot.entries.length})</h2>

          {cacheSnapshot.entries.length === 0 ? (
            <p>No cached entries yet.</p>
          ) : (
            <ul className="entry-list">
              {cacheSnapshot.entries.map((entry) => (
                <li key={entry.text}>
                  <button onClick={() => handleAccess(entry.text)}>
                    Use
                  </button>

                  <code>{entry.text}</code>

                  <span>Frequency: {entry.frequency}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}

export default App
