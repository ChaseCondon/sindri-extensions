import { useState, useCallback } from "react";
import { InputView } from "./InputView";
import { GridView } from "./GridView";
import type { SortState } from "../lib/types";

export function CsvGrid() {
  const [rows, setRows] = useState<string[][] | null>(null);
  const [sort, setSort] = useState<SortState>(null);

  const handleParsed = useCallback((parsed: string[][]) => {
    setRows(parsed);
    setSort(null);
  }, []);

  const handleSort = useCallback((col: number) => {
    setSort(prev =>
      prev?.col === col ? { col, asc: !prev.asc } : { col, asc: true },
    );
  }, []);

  const handleClear = useCallback(() => {
    setRows(null);
    setSort(null);
  }, []);

  if (rows) {
    return (
      <GridView
        rows={rows}
        sort={sort}
        onSort={handleSort}
        onClear={handleClear}
      />
    );
  }
  return <InputView onParsed={handleParsed} />;
}
