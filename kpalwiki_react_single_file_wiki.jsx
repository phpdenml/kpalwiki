// kpalwiki - single-file React wiki
// Drop this component into a React app (Create React App / Vite) and render <KpalWiki />
// Requirements:
//  - Tailwind CSS (or remove Tailwind classes)
//  - npm install marked
// Optional deployment: this works on Vercel or GitHub Pages as a single-page app.

import React, { useEffect, useState, useMemo } from "react";
import { marked } from "marked";

// Utility: persist to localStorage
const STORAGE_KEY = "kpalwiki_pages_v1";

function loadPages() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultPages();
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load pages", e);
    return defaultPages();
  }
}

function savePages(pages) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
}

function defaultPages() {
  return {
    Home: {
      title: "Home",
      content:
        "# Welcome to kpalwiki\n\nThis is your local wiki. Create pages, edit content in Markdown, and search instantly. Pages are stored in your browser's localStorage. Export or import JSON to backup or share.",
      updated: Date.now(),
    },
    About: {
      title: "About",
      content:
        "# About kpalwiki\n\nkpalwiki is a lightweight, single-user wiki prototype. Use it as a notes app, documentation store, or personal knowledge base.",
      updated: Date.now(),
    },
  };
}

export default function KpalWiki() {
  const [pages, setPages] = useState(() => loadPages());
  const [current, setCurrent] = useState("Home");
  const [editing, setEditing] = useState(false);
  const [editorContent, setEditorContent] = useState("");
  const [search, setSearch] = useState("");
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    // initialize editor content when current changes
    if (pages[current]) setEditorContent(pages[current].content);
  }, [current]);

  useEffect(() => {
    savePages(pages);
  }, [pages]);

  const pageList = useMemo(() => Object.keys(pages).sort(), [pages]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pageList;
    return pageList.filter((t) => {
      const p = pages[t];
      return (
        t.toLowerCase().includes(q) ||
        (p.content && p.content.toLowerCase().includes(q))
      );
    });
  }, [pageList, search, pages]);

  function createPage(title) {
    const t = title.trim();
    if (!t) return alert("Please provide a page title.");
    if (pages[t]) return alert("A page with that title already exists.");
    const next = { ...pages, [t]: { title: t, content: "# " + t + "\n\nWrite your content here.", updated: Date.now() } };
    setPages(next);
    setCurrent(t);
    setEditing(true);
    setNewTitle("");
  }

  function saveCurrent() {
    const next = { ...pages, [current]: { ...pages[current], content: editorContent, updated: Date.now() } };
    setPages(next);
    setEditing(false);
  }

  function removePage(title) {
    if (!confirm(`Delete page "${title}"? This cannot be undone.`)) return;
    const copy = { ...pages };
    delete copy[title];
    setPages(copy);
    setCurrent(Object.keys(copy)[0] || "");
  }

  function renamePage(oldTitle, newTitleRaw) {
    const newTitle = newTitleRaw.trim();
    if (!newTitle) return alert("Title cannot be empty");
    if (newTitle === oldTitle) return; // nothing
    if (pages[newTitle]) return alert("A page with that title already exists.");
    const copy = { ...pages };
    copy[newTitle] = { ...copy[oldTitle], title: newTitle };
    delete copy[oldTitle];
    setPages(copy);
    setCurrent(newTitle);
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(pages, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kpalwiki-export.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJSON(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (typeof imported !== "object") throw new Error("Invalid format");
        if (!confirm("Importing will merge pages. Continue?")) return;
        const merged = { ...pages, ...imported };
        setPages(merged);
        alert("Import complete. New pages added/merged.");
      } catch (err) {
        alert("Failed to import JSON: " + err.message);
      }
    };
    reader.readAsText(file);
  }

  function cloneAsNew(title) {
    const newName = prompt("New page title for clone of " + title + "", title + " (copy)");
    if (!newName) return;
    if (pages[newName]) return alert("A page with that title already exists.");
    const copy = { ...pages, [newName]: { ...pages[title], title: newName, updated: Date.now() } };
    setPages(copy);
    setCurrent(newName);
    setEditing(true);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <aside className="md:col-span-1 bg-white rounded-2xl shadow p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold">kpalwiki</h1>
            <button
              className="text-xs px-3 py-1 border rounded-full"
              onClick={() => {
                setPages(defaultPages());
                setCurrent("Home");
              }}
              title="Reset to example pages"
            >
              Reset
            </button>
          </div>

          <div className="mb-3">
            <input
              placeholder="Search pages or content..."
              className="w-full text-sm border rounded px-3 py-2"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-2 mb-3">
            <input
              className="flex-1 text-sm border rounded px-3 py-2"
              placeholder="New page title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createPage(newTitle)}
            />
            <button className="px-3 py-2 bg-indigo-600 text-white rounded" onClick={() => createPage(newTitle)}>
              Create
            </button>
          </div>

          <div className="flex-1 overflow-auto">
            <ul className="space-y-1">
              {filtered.map((t) => (
                <li key={t}>
                  <button
                    className={`w-full text-left px-3 py-2 rounded flex items-center justify-between ${t === current ? "bg-indigo-50" : "hover:bg-gray-100"}`}
                    onClick={() => {
                      setCurrent(t);
                      setEditing(false);
                    }}
                  >
                    <span className="truncate">{t}</span>
                    <span className="text-xs text-gray-500">{new Date(pages[t].updated).toLocaleDateString()}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-3 border-t mt-3 flex flex-col gap-2">
            <div className="flex gap-2">
              <button className="flex-1 px-2 py-2 border rounded" onClick={() => exportJSON()}>
                Export JSON
              </button>
              <label className="flex-1 text-center border rounded px-2 py-2 cursor-pointer">
                Import JSON
                <input
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={(e) => e.target.files && importJSON(e.target.files[0])}
                />
              </label>
            </div>
            <div className="text-xs text-gray-500">Pages stored locally. To collaborate, export and push to a repo.</div>
          </div>
        </aside>

        {/* Main */}
        <main className="md:col-span-3 bg-white rounded-2xl shadow p-6 flex flex-col">
          {!current ? (
            <div className="text-center text-gray-500">No pages yet. Create one from the left panel.</div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold mb-1">{current}</h2>
                  <div className="text-sm text-gray-500">Last updated: {new Date(pages[current].updated).toLocaleString()}</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    className="px-3 py-2 border rounded"
                    onClick={() => {
                      setEditing((v) => !v);
                      setEditorContent(pages[current].content);
                    }}
                  >
                    {editing ? "Cancel" : "Edit"}
                  </button>
                  <button
                    className="px-3 py-2 border rounded"
                    onClick={() => cloneAsNew(current)}
                    title="Duplicate page"
                  >
                    Duplicate
                  </button>
                  <button
                    className="px-3 py-2 text-red-600 border rounded"
                    onClick={() => removePage(current)}
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="mt-4 flex gap-6">
                <div className="flex-1">
                  {editing ? (
                    <div>
                      <textarea
                        className="w-full h-64 border rounded p-3 font-mono text-sm"
                        value={editorContent}
                        onChange={(e) => setEditorContent(e.target.value)}
                      />

                      <div className="flex gap-2 mt-3">
                        <button className="px-4 py-2 bg-indigo-600 text-white rounded" onClick={saveCurrent}>
                          Save
                        </button>
                        <button
                          className="px-4 py-2 border rounded"
                          onClick={() => {
                            const newName = prompt("Rename page:", current);
                            if (newName) renamePage(current, newName);
                          }}
                        >
                          Rename
                        </button>
                        <button
                          className="px-4 py-2 border rounded"
                          onClick={() => setEditorContent("")}
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: marked.parse(pages[current].content || "") }} />
                  )}
                </div>

                <aside className="w-80 hidden md:block">
                  <div className="bg-gray-50 border rounded p-3">
                    <h3 className="font-semibold mb-2">Quick links</h3>
                    <ul className="text-sm space-y-1">
                      <li>
                        <button
                          className="text-left w-full"
                          onClick={() => {
                            setCurrent("Home");
                            setEditing(false);
                          }}
                        >
                          Home
                        </button>
                      </li>
                      <li>
                        <button
                          className="text-left w-full"
                          onClick={() => {
                            setCurrent("About");
                            setEditing(false);
                          }}
                        >
                          About
                        </button>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-4 bg-gray-50 border rounded p-3">
                    <h3 className="font-semibold mb-2">Page preview (search match)</h3>
                    <div className="text-sm text-gray-600">Type in search to filter pages. Click a page to view it.</div>
                  </div>
                </aside>
              </div>
            </>
          )}
        </main>
      </div>

      <footer className="text-center text-xs text-gray-500 mt-6">kpalwiki — simple local wiki • Built with ❤️</footer>
    </div>
  );
}
