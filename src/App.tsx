import { FormEvent, useState, useEffect } from "react";
import { CacheSnapshot } from "../shared/types";
import "./App.css";
import { Settings } from "lucide-react";

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



function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 5 5" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="M7 7l1 13h8l1-13" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="8" y="8" width="11" height="11" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </svg>
  );
}

function SearchClearIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 7l10 10" />
      <path d="M17 7 7 17" />
    </svg>
  );
}

function ClearHistoryIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 7h14" />
      <path d="M9 7V4h6v3" />
      <path d="M7 7l1 13h8l1-13" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
  );
}

// function SettingsIcon() {
//   return (
//     <svg viewBox="0 0 24 24" aria-hidden="true">
//       <circle cx="12" cy="12" r="3" />
//       <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-2.5V20a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H6v-2.5h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V5h2.5v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v2.5h-.2a1.7 1.7 0 0 0-1.6 1Z" />
//     </svg>
//   );
// }



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

  if (!cacheSnapshot) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <span>Loading clipboard history...</span>
      </div>
    );
  }

  const isSearching = submittedPrefix !== "";
  const displayedEntries = isSearching
    ? searchResults
    : cacheSnapshot.entries.map((entry) => entry.text);

  return (
    <main className="app">
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon">
            <CopyIcon />
          </div>

          <div>
            <h1 className="app-title">
              ClipBro
              <span
                className="info-badge"
                aria-label="How it works"
                title="The app continuously monitors your clipboard. An entry is added or accessed only when the clipboard changes to a new text. Copying text that's already on your clipboard won't make any difference."
              >
                How it works?
              </span>
            </h1>

            {/* <h1>Clipboard Manager</h1>

            <Info
              className="info-icon"
              aria-label="• The app adds an entry only when the clipboard changes to a different text, not when the same text is copied again. • The app saves clipboard changes only while it is running."
            /> */}

            <p>
              Your clipboard history, organized intelligently.
            </p>
          </div>
        </div>

        <div className="capacity-badge">
          <span className={`status-dot ${cacheSnapshot.capacity === 0 ? "paused" : ""}`} />
          {cacheSnapshot.capacity === 0
            ? "History paused"
            : `${cacheSnapshot.entries.length} / ${cacheSnapshot.capacity}`}
        </div>
      </header>

      <section className="toolbar">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-wrapper">
            <SearchIcon />

            <input
              value={prefix}
              onChange={(event) => setPrefix(event.target.value)}
              placeholder="Search clipboard history..."
              aria-label="Search clipboard history"
            />

            {(submittedPrefix || prefix) && (
              <button
                type="button"
                className="clear-search-button"
                onClick={() => {
                  setPrefix("");
                  handleClearSearch();
                }}
                aria-label="Clear search"
                title="Clear search"
              >
                <SearchClearIcon />
              </button>
            )}
          </div>

          <button
            type="submit"
            className="search-button"
            aria-label="Search"
            title="Search"
          >
            <SearchIcon />
          </button>
        </form>
      </section>

      <section className="settings-panel">
        <div className="setting-group">
          <div className="setting-label">
            <span className="setting-icon">
              <Settings />
            </span>

            <div>
              <strong>Eviction policy</strong>
              <span>Choose how older entries are removed.</span>
            </div>
          </div>

          <div className="policy-toggle">
            <button
              className={
                cacheSnapshot.activePolicy === "lru"
                  ? "policy-button active"
                  : "policy-button"
              }
              onClick={() => handlePolicyChange("lru")}
              title="Least recently used items are removed first."
            >
              LRU
            </button>

            <button
              className={
                cacheSnapshot.activePolicy === "lfu"
                  ? "policy-button active"
                  : "policy-button"
              }
              onClick={() => handlePolicyChange("lfu")}
              title="Least frequently used items are removed first."
            >
              LFU
            </button>
          </div>
        </div>

        <div className="setting-divider" />

        <div className="setting-group">
          <div className="setting-label">
            <div>
              <strong>Cache capacity</strong>
              <span>
                Maximum number of clipboard entries to retain.
              </span>
            </div>
          </div>

          <div className="capacity-control">
            <select
              value={selectedCapacity}
              onChange={(event) =>
                setSelectedCapacity(Number(event.target.value))
              }
              aria-label="Cache capacity"
            >
              {CAPACITY_OPTIONS.map((capacity) => (
                <option key={capacity} value={capacity}>
                  {capacity}
                </option>
              ))}
            </select>

            <button
              className="icon-button apply-button"
              onClick={handleSetCapacity}
              aria-label="Apply capacity"
              title="Apply capacity"
            >
              ✓
            </button>
          </div>
        </div>

        <button
          className="clear-history-button"
          onClick={handleClearHistory}
          disabled={cacheSnapshot.entries.length === 0}
          aria-label="Clear history"
          title="Clear history"
        >
          <ClearHistoryIcon />
          <span>Clear history</span>
        </button>
      </section>

      <section className="history">
        <div className="history-header">
          {isSearching ? (
            <>
              <div>
                <h2>Search results</h2>
                <p>
                  Matching{" "}
                  <span className="highlight">
                    "{submittedPrefix}"
                  </span>
                </p>
              </div>

              <span className="result-count">
                {searchResults.length}{" "}
                {searchResults.length === 1 ? "result" : "results"}
              </span>
            </>
          ) : (
            <>
              <div>
                <h2>Clipboard history</h2>
                <p>Your most recently used entries.</p>
              </div>

              {cacheSnapshot.entries.length > 0 && (
                <span className="result-count">
                  {cacheSnapshot.entries.length}{" "}
                  {cacheSnapshot.entries.length === 1
                    ? "entry"
                    : "entries"}
                </span>
              )}
            </>
          )}
        </div>

        {displayedEntries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              {isSearching ? <SearchIcon /> : <CopyIcon />}
            </div>

            <h3>
              {isSearching
                ? "No matching entries"
                : "No saved entries yet"}
            </h3>

            <p>
              {isSearching
                ? `Nothing starts with "${submittedPrefix}".`
                : "Copy something to your clipboard and it will appear here."}
            </p>
          </div>
        ) : (
          <ul className="entry-list">
            {displayedEntries.map((entryText) => (
              <li className="entry-card" key={entryText}>
                <div className="entry-content">
                  <code>{entryText}</code>
                </div>

                <div className="entry-actions">
                  <button
                    className="entry-action use-action"
                    onClick={() => handleAccess(entryText)}
                    aria-label="Use clipboard entry"
                    title="Copy to clipboard"
                  >
                    <CopyIcon />
                    <span>Use</span>
                  </button>

                  <button
                    className="entry-action delete-action"
                    onClick={() => handleDelete(entryText)}
                    aria-label="Delete clipboard entry"
                    title="Delete entry"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export default App
