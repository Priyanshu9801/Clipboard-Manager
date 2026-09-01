import { FormEvent, useState, useEffect } from "react";
import { CacheSnapshot } from "../shared/types";
import "./App.css";

declare global {
  interface Window {
    cacheApi: {
      getCacheSnapshot: () => Promise<CacheSnapshot>;
      addText: (text: string) => Promise<CacheSnapshot>;
      accessText: (text: string) => Promise<void>;
      setPolicy: (policy: 'lru' | 'lfu') => Promise<CacheSnapshot>;
      deleteText: (text: string) => Promise<CacheSnapshot>;
      clearHistory: () => Promise<CacheSnapshot>;
      onClipboardUpdated: (callback: (snapshot: CacheSnapshot) => void) => () => void;
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

  useEffect(() => {
    const removeListener = window.cacheApi.onClipboardUpdated((snapshot: CacheSnapshot) => {
      setCacheSnapshot(snapshot);
    })

    return removeListener;
  }, [])

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    if (!text) return;
    const newSnapshot = await window.cacheApi.addText(text);
    setCacheSnapshot(newSnapshot);
    setText("");
  }

  function handleAccess(entryText: string) {
    window.cacheApi.accessText(entryText);
  }

  async function handlePolicyChange(policy: 'lru' | 'lfu') {
    if(cacheSnapshot && cacheSnapshot.activePolicy === policy) return;
    
    const newSnapshot = await window.cacheApi.setPolicy(policy);
    setCacheSnapshot(newSnapshot);
  }
  
  async function handleDelete(text: string){
    const newSnapshot = await window.cacheApi.deleteText(text);
    setCacheSnapshot(newSnapshot);
  }

  async function handleClearHistory(){
    const newSnapshot = await window.cacheApi.clearHistory();
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

          <button onClick={handleClearHistory}>
            Clear History
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

                  <button onClick={() => handleDelete(entry.text)}>
                    Delete
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
