import { useState, useCallback } from "react";
import { parseCSV } from "../lib/parseCSV";

interface Props {
  onParsed: (rows: string[][]) => void;
}

export function InputView({ onParsed }: Props) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const tryParse = useCallback(
    (text: string) => {
      const rows = parseCSV(text.trim());
      if (rows.length >= 2) {
        onParsed(rows);
      } else if (text.trim()) {
        setError("Need at least a header row and one data row.");
      }
    },
    [onParsed],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const text = e.clipboardData.getData("text/plain");
      setValue(text);
      tryParse(text);
    },
    [tryParse],
  );

  return (
    <div className="input-view">
      <div className="toolbar">
        <span className="toolbar-title">CSV Grid</span>
        <span className="toolbar-info">{error}</span>
        <button className="btn btn-primary" onClick={() => tryParse(value)}>
          Parse →
        </button>
      </div>
      <div className="input-area">
        <textarea
          value={value}
          onChange={e => {
            setValue(e.target.value);
            setError("");
          }}
          onPaste={handlePaste}
          placeholder="Paste CSV data here…"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
