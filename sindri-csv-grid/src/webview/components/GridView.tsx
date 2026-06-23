import { useRef } from "react";
import { sortRows } from "../lib/parseCSV";
import type { SortState } from "../lib/types";

interface Props {
  rows: string[][];
  sort: SortState;
  onSort: (col: number) => void;
  onCellChange: (rowIndex: number, colIndex: number, value: string) => void;
}

export function GridView({ rows, sort, onSort, onCellChange }: Props) {
  const [header, ...data] = rows;
  const sorted = sort ? sortRows(data, sort.col, sort.asc) : data;

  // Track the original (pre-sort) row index so edits land on the right row.
  const sortedIndices = sort
    ? sortRows(data.map((r, i) => [...r, String(i)]), sort.col, sort.asc).map(r => Number(r[r.length - 1]))
    : data.map((_, i) => i);

  return (
    <div className="grid-area">
      <table>
        <thead>
          <tr>
            {header.map((h, ci) => (
              <th
                key={ci}
                className={sort?.col === ci ? "sorted" : ""}
                onClick={() => onSort(ci)}
              >
                <EditableCell
                  value={h}
                  onChange={val => onCellChange(0, ci, val)}
                  isHeader
                />
                <span className="sort-icon">
                  {sort?.col === ci ? (sort.asc ? " ▲" : " ▼") : " ↕"}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, sortedRi) => {
            const originalRi = sortedIndices[sortedRi] + 1; // +1 for header offset
            return (
              <tr key={originalRi}>
                {header.map((_, ci) => (
                  <td key={ci}>
                    <EditableCell
                      value={row[ci] ?? ""}
                      onChange={val => onCellChange(originalRi, ci, val)}
                    />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function EditableCell({ value, onChange, isHeader = false }: {
  value: string;
  onChange: (v: string) => void;
  isHeader?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  function handleBlur() {
    const newVal = ref.current?.textContent ?? "";
    if (newVal !== value) onChange(newVal);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      ref.current?.blur();
    }
    if (e.key === "Escape") {
      if (ref.current) ref.current.textContent = value;
      ref.current?.blur();
    }
  }

  return (
    <span
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={`cell-content${isHeader ? " cell-header" : ""}`}
    >
      {value}
    </span>
  );
}
