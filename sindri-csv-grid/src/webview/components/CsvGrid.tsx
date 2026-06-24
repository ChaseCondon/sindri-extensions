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
        // File just loaded — clean state
        api.postMessage({ type: "dirty", isDirty: false });
      } else if (msg.type === "noFile") {
        setLoadState("noFile");
        setRows([]);
        setRawContent("");
      }
    });
    api.postMessage({ type: "ready" });

    // Cmd/Ctrl+S → save
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        // rawContent is captured by closure; use functional update to get latest
        setRawContent(prev => {
          api.postMessage({ type: "save", content: prev });
          return prev;
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [api]);

  const handleSort = useCallback((col: number) => {
    setSort(prev => prev?.col === col ? { col, asc: !prev.asc } : { col, asc: true });
  }, []);

  const handleCellChange = useCallback((ri: number, ci: number, value: string) => {
    setRows(prev => {
      const next = prev.map(r => [...r]);
      next[ri][ci] = value;
      const csv = serializeCSV(next);
      setRawContent(csv);
      api?.postMessage({ type: "dirty", isDirty: true });
      return next;
    });
    setSort(null);
  }, [api]);

  const handleAddRow = useCallback(() => {
    setRows(prev => {
      const cols = prev[0]?.length ?? 1;
      const next = [...prev, Array(cols).fill("")];
      setRawContent(serializeCSV(next));
      api?.postMessage({ type: "dirty", isDirty: true });
      return next;
    });
  }, [api]);

  const handleAddCol = useCallback(() => {
    setRows(prev => {
      const next = prev.map(r => [...r, ""]);
      setRawContent(serializeCSV(next));
      api?.postMessage({ type: "dirty", isDirty: true });
      return next;
    });
  }, [api]);

  const handleDeleteRow = useCallback((ri: number) => {
    setRows(prev => {
      if (prev.length <= 2) return prev; // keep at least header + 1 data row
      const next = prev.filter((_, i) => i !== ri);
      setRawContent(serializeCSV(next));
      return next;
    });
    setSort(null);
  }, []);

  const handleDeleteCol = useCallback((ci: number) => {
    setRows(prev => {
      if ((prev[0]?.length ?? 0) <= 1) return prev; // keep at least 1 column
      const next = prev.map(r => r.filter((_, i) => i !== ci));
      setRawContent(serializeCSV(next));
      return next;
    });
  }, []);

  const handleRawChange = useCallback((value: string) => {
    setRawContent(value);
    const parsed = parseCSV(value);
    setRows(parsed.length >= 1 ? parsed : [[""]]);
    setSort(null);
    api?.postMessage({ type: "dirty", isDirty: true });
  }, [api]);

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
        <div className="mode-toggle">
          <button className={`btn ${mode === "grid" ? "btn-primary" : "btn-secondary"}`} onClick={() => setMode("grid")}>Grid</button>
          <button className={`btn ${mode === "raw" ? "btn-primary" : "btn-secondary"}`} onClick={() => setMode("raw")}>Raw</button>
        </div>
      </div>
      {mode === "grid" ? (
        rows.length > 0
          ? <GridView
              rows={rows}
              sort={sort}
              onSort={handleSort}
              onCellChange={handleCellChange}
              onAddRow={handleAddRow}
              onAddCol={handleAddCol}
              onDeleteRow={handleDeleteRow}
              onDeleteCol={handleDeleteCol}
            />
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
