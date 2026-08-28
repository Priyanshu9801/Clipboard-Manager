// import { FormEvent, useState } from "react";
// import CacheEntry from "./core/CacheEntry.ts";
// import { CacheManager } from "./core/CacheManager.ts";
// import "./App.css";

// function App() {
//   const [manager] = useState(() => new CacheManager(10));
//   const [text, setText] = useState("");
//   const [entries, setEntries] = useState<CacheEntry[]>([]);

//   function refreshEntries() {
//       setEntries(manager.getEntries());
//   }

//   function handleAdd(event: FormEvent) {
//       event.preventDefault();

//       const trimmedText = text.trim();
//       if (trimmedText === "") return;

//       manager.put(trimmedText);
//       setText("");
//       refreshEntries();
//   }

//   function handleAccess(text: string) {
//       manager.get(text);
//       refreshEntries();
//   }

//   function handlePolicyChange(policy: "lru" | "lfu") {
//       manager.activePolicy = policy;
//       refreshEntries();
//   }

//   return (
//     <>
//       <main className="app">
//         <h1>Clipboard Manager</h1>
//         <p>Manual cache testing — capacity: {manager.capacity}</p>

//         <section className="controls">
//             <span>Eviction policy:</span>

//             <button
//                 className={manager.activePolicy === "lru" ? "selected" : ""}
//                 onClick={() => handlePolicyChange("lru")}
//             >
//                 LRU
//             </button>

//             <button
//                 className={manager.activePolicy === "lfu" ? "selected" : ""}
//                 onClick={() => handlePolicyChange("lfu")}
//             >
//                 LFU
//             </button>
//         </section>

//         <form onSubmit={handleAdd} className="add-form">
//             <input
//                 value={text}
//                 onChange={(event) => setText(event.target.value)}
//                 placeholder="Enter text to simulate a clipboard copy"
//             />
//             <button type="submit">Add</button>
//         </form>

//         <section className="history">
//           <h2>Cached entries ({entries.length})</h2>

//           {entries.length === 0 ? (
//               <p>No cached entries yet.</p>
//           ) : (
//               <ul className="entry-list">
//                   {entries.map((entry) => (
//                       <li key={entry.text}>
//                           <button onClick={() => handleAccess(entry.text)}>
//                               Use
//                           </button>

//                           <code>{entry.text}</code>

//                           <span>Frequency: {entry.frequency}</span>
//                       </li>
//                   ))}
//               </ul>
//           )}
//         </section>
//       </main>
//     </>
//   )
// }

// export default App
