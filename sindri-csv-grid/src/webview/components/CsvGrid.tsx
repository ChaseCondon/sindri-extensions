import { useState, useEffect, useCallback } from "react";
import { GridView } from "./GridView";
import { parseCSV, serializeCSV } from "../lib/parseCSV";
import type { SortState } from "../lib/types";

interface SindriApi {
  postMessage(msg: unknown): void;
  onMessage(handler: (data: unknown) => void): void;
}

type ViewMode = "grid" | "raw";
type LoadState = "idle" | "loaded" | "noFile";

export function CsvGrid({ api }: { api: SindriApi | null }) {
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [rows, setRows] = useState<string[][]>([]);
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
        setRows(parsed.length >= 1 ? parsed : [[""]]);
        setSort(null);
        setLoadState("loaded");
      } else if (msg.type === "noFile") {
        setLoadState("noFile");
        setRows([]);
        setRawContent("");
      }
    });
    api.postMessage({ type: "ready" });
  }, [api]);

  const handleSort = useCallback((col: number) => {
    setSort(prev => prev?.col === col ? { col, asc: !prev.asc } : { col, asc: true });
  }, []);

  const handleCellChange = useCallback((ri: number, ci: number, value: string) => {
    setRows(prev => {
      const next = prev.map(r => [...r]);
      next[ri][ci] = value;
      setRawContent(serializeCSV(next));
      return next;
    });
    setSort(null);
  }, []);

  const handleAddRow = useCallback(() => {
    setRows(prev => {
      const cols = prev[0]?.length ?? 1;
      const next = [...prev, Array(cols).fill("")];
      setRawContent(serializeCSV(next));
      return next;
    });
  }, []);

  const handleAddCol = useCallback(() => {
    setRows(prev => {
      const next = prev.map(r => [...r, ""]);
      setRawContent(serializeCSV(next));
      return next;
    });
  }, []);

  const handleRawChange = useCallback((value: string) => {
    setRawContent(value);
    const parsed = parseCSV(value);
    setRows(parsed.length >= 1 ? parsed : [[""]]);
    setSort(null);
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

  const header = rows[0] ?? [];
  const dataRows = rows.slice(1);

  return (
    <div className="csv-shell">
      <div className="toolbar">
        <span className="toolbar-title">{filename}</span>
        <span className="toolbar-info">
          {dataRows.length} rows × {header.length} cols
        </span>
        <div className="toolbar-actions">
          <button className="btn btn-secondary" onClick={handleAddRow} title="Add row">+ Row</button>
          <button className="btn btn-secondary" onClick={handleAddCol} title="Add column">+ Col</button>
        </div>
        <div className="mode-toggle">
          <button className={`btn ${mode === "grid" ? "btn-primary" : "btn-secondary"}`} onClick={() => setMode("grid")}>Grid</button>
          <button className={`btn ${mode === "raw" ? "btn-primary" : "btn-secondary"}`} onClick={() => setMode("raw")}>Raw</button>
        </div>
      </div>
      {mode === "grid" ? (
        rows.length > 0
          ? <GridView rows={rows} sort={sort} onSort={handleSort} onCellChange={handleCellChange} />
          : <div className="empty-state"><p className="dim">Need at least a header row.</p></div>
      ) : (
        <div className="raw-area">
          <textarea
            value={rawContent}
            onChange={e => handleRawChange(e.target.value)}
            spellCheck={false}
          />
        </div>
      )}
    </div>
  );
}
