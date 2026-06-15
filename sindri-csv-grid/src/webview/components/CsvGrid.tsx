import { useState, useEffect, useCallback } from "react";
import { GridView } from "./GridView";
import { parseCSV } from "../lib/parseCSV";
import type { SortState } from "../lib/types";

interface SindriApi {
  postMessage(msg: unknown): void;
  onMessage(handler: (data: unknown) => void): void;
}

type ViewMode = "grid" | "raw";
type LoadState = "idle" | "loaded" | "noFile";

export function CsvGrid({ api }: { api: SindriApi | null }) {
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [rows, setRows] = useState<string[][] | null>(null);
  const [rawContent, setRawContent] = useState("");
  const [filename, setFilename] = useState("CSV Grid");
  const [sort, setSort] = useState<SortState>(null);
  const [mode, setMode] = useState<ViewMode>("grid");

  useEffect(() => {
    if (!api) return;
    api.onMessage((data: unknown) => {
      const msg = data as { type: string; content?: string; path?: string };
      if (msg.type === "file" && msg.content != null) {
        const parsed = parseCSV(msg.content);
        setRawContent(msg.content);
        setFilename(msg.path?.split("/").pop() ?? "file.csv");
        setRows(parsed.length >= 2 ? parsed : null);
        setSort(null);
        setLoadState("loaded");
      } else if (msg.type === "noFile") {
        setLoadState("noFile");
        setRows(null);
        setRawContent("");
      }
    });
    api.postMessage({ type: "ready" });
  }, [api]);

  const handleSort = useCallback((col: number) => {
    setSort(prev => prev?.col === col ? { col, asc: !prev.asc } : { col, asc: true });
  }, []);

  if (loadState === "idle") {
    return <div className="empty-state"><p className="dim">Loading…</p></div>;
  }
  if (loadState === "noFile") {
    return (
      <div className="empty-state">
        <p>Open a <code>.csv</code> or <code>.tsv</code> file to view it here.</p>
      </div>
    );
  }

  const header = rows?.[0] ?? [];
  const data = rows?.slice(1) ?? [];

  return (
    <div className={mode === "grid" ? "grid-view" : "raw-view"}>
      <div className="toolbar">
        <span className="toolbar-title">{filename}</span>
        <span className="toolbar-info">
          {rows ? `${data.length} rows × ${header.length} cols` : "parse error"}
        </span>
        <div className="mode-toggle">
          <button className={`btn ${mode === "grid" ? "btn-primary" : "btn-secondary"}`} onClick={() => setMode("grid")}>Grid</button>
          <button className={`btn ${mode === "raw" ? "btn-primary" : "btn-secondary"}`} onClick={() => setMode("raw")}>Raw</button>
        </div>
      </div>
      {mode === "grid" ? (
        rows
          ? <GridView rows={rows} sort={sort} onSort={handleSort} onClear={() => {}} />
          : <div className="empty-state"><p className="dim">Need at least a header row and one data row.</p></div>
      ) : (
        <div className="raw-area"><textarea readOnly value={rawContent} spellCheck={false} /></div>
      )}
    </div>
  );
}
