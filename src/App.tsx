import { FormEvent, useState, useEffect } from "react";
import { CacheSnapshot } from "../shared/types";
import "./App.css";

declare global {
  interface Window {
    cacheApi: {
      getCacheSnapshot: () => Promise<CacheSnapshot>;
      accessText: (text: string) => Promise<void>;
      setPolicy: (policy: 'lru' | 'lfu') => Promise<CacheSnapshot>;
      deleteText: (text: string) => Promise<CacheSnapshot>;
      clearHistory: () => Promise<CacheSnapshot>;
      setCapacity: (newCapacity: number) => Promise<CacheSnapshot>;
      searchByPrefix: (prefix: string) => Promise<string[]>;
      onClipboardUpdated: (callback: (snapshot: CacheSnapshot) => void) => () => void;
    };
  }
}

const CAPACITY_OPTIONS = [0, 1, 5, 10, 50, 100, 500, 1000];

function App() {
  const [cacheSnapshot, setCacheSnapshot] = useState<CacheSnapshot | null>(null); 
  const [selectedCapacity, setSelectedCapacity] = useState<number>(0);
  const [prefix, setPrefix] = useState("");
  const [submittedPrefix, setSubmittedPrefix] = useState<string>("");
  const [searchResults, setSearchResults] = useState<string[]>([]);

  useEffect(() => {
    window.cacheApi.getCacheSnapshot().then((snapshot) => {
      setCacheSnapshot(snapshot);
      setSelectedCapacity(snapshot.capacity);
    });
  }, []);

  useEffect(() => {
    const removeListener = window.cacheApi.onClipboardUpdated((snapshot: CacheSnapshot) => {
      setCacheSnapshot(snapshot);
    })

    return removeListener;
  }, [])

  function handleClearSearch() {
    setSubmittedPrefix("");
    setSearchResults([]);
  }

  function handleAccess(entryText: string) {
    window.cacheApi.accessText(entryText);
    handleClearSearch();
  }

  async function handlePolicyChange(policy: 'lru' | 'lfu') {
    if(cacheSnapshot && cacheSnapshot.activePolicy === policy) return;
    
    const newSnapshot = await window.cacheApi.setPolicy(policy);
    setCacheSnapshot(newSnapshot);
    handleClearSearch();
  }
  
  async function handleDelete(text: string){
    const newSnapshot = await window.cacheApi.deleteText(text);
    setCacheSnapshot(newSnapshot);
    handleClearSearch();
  }

  async function handleClearHistory(){
    if(!cacheSnapshot || cacheSnapshot.entries.length === 0) return;

    const newSnapshot = await window.cacheApi.clearHistory();
    setCacheSnapshot(newSnapshot);
    handleClearSearch();
  }

  async function handleSetCapacity(){
    if(cacheSnapshot && selectedCapacity === cacheSnapshot.capacity) return;

    const newSnapshot = await window.cacheApi.setCapacity(selectedCapacity);
    setCacheSnapshot(newSnapshot);
    handleClearSearch();
  }

  async function handleSearch(event: FormEvent) {
    event.preventDefault();
    if(!prefix) return;

    setSubmittedPrefix(prefix);
    const results = await window.cacheApi.searchByPrefix(prefix);
    setSearchResults(results);
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

          <div>
            <label htmlFor="capacity-dropdown">Cache Capacity: </label>
            <select 
              id="capacity-dropdown"
              value={selectedCapacity} 
              onChange={(e) => setSelectedCapacity(Number(e.target.value))}
            >
              {CAPACITY_OPTIONS.map(cap => (
                <option key={cap} value={cap}>{cap}</option>
              ))}
            </select>
            <button onClick={handleSetCapacity}>
              Set Capacity
            </button>
          </div>

          <button onClick={handleClearHistory}>
            Clear History
          </button>
        </section>

        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-wrapper">
              <input
                value={prefix}
                onChange={(event) => setPrefix(event.target.value)}
                placeholder="Search clipboard history"
              />

              {
                (submittedPrefix || prefix) && (
                  <button
                    type="button"
                    className="clear-search-button"
                    onClick={() => {setPrefix(""); handleClearSearch();}}
                    aria-label="Clear search"
                    title="Clear search"
                  >
                    ×
                  </button>
                )
              }
            
          </div>
          <button type="submit">Search</button>
        </form>

        <section className="history">
          {submittedPrefix === "" ? (
            <>
              {cacheSnapshot.entries.length === 0 ? (
                <p>No cached entries yet.</p>
              ) : (
                <>
                  <h2>{cacheSnapshot.entries.length} Cached entries:</h2>

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
                </>
              )}
            </>
          ) : (
            <>
              {searchResults.length === 0 ? (
                <p>No matching entries found for {`'${submittedPrefix}'`}.</p>
              ) : (
                <>
                  <h2>{searchResults.length} results for {`'${submittedPrefix}'`}:</h2>

                  <ul className="entry-list">
                    {searchResults.map((entryText) => (
                      <li key={entryText}>
                        <button onClick={() => handleAccess(entryText)}>
                          Use
                        </button>

                        <button onClick={() => handleDelete(entryText)}>
                          Delete
                        </button>

                        <code>{entryText}</code>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </section>
      </main>
    </>
  );
}

export default App
