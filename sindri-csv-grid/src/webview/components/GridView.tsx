import { useRef } from "react";
import { sortRows } from "../lib/parseCSV";
import type { SortState } from "../lib/types";

interface Props {
  rows: string[][];
  sort: SortState;
  onSort: (col: number) => void;
  onCellChange: (rowIndex: number, colIndex: number, value: string) => void;
  onAddRow: () => void;
  onAddCol: () => void;
  onDeleteRow: (rowIndex: number) => void;
  onDeleteCol: (colIndex: number) => void;
}

export function GridView({ rows, sort, onSort, onCellChange, onAddRow, onAddCol, onDeleteRow, onDeleteCol }: Props) {
  const [header, ...data] = rows;
  const sorted = sort ? sortRows(data, sort.col, sort.asc) : data;

  // Track original (pre-sort) row indices so edits and deletes land on the right row.
  const sortedIndices = sort
    ? sortRows(data.map((r, i) => [...r, String(i)]), sort.col, sort.asc).map(r => Number(r[r.length - 1]))
    : data.map((_, i) => i);

  return (
    <div className="grid-area">
      <table>
        <thead>
          <tr>
            {header.map((h, ci) => (
              <th key={ci} className={sort?.col === ci ? "sorted" : ""}>
                <div className="th-content" onClick={() => onSort(ci)}>
                  <EditableCell
                    value={h}
                    onChange={val => onCellChange(0, ci, val)}
                    isHeader
                    stopPropagation
                  />
                  <span className="sort-icon">
                    {sort?.col === ci ? (sort.asc ? "▲" : "▼") : "↕"}
                  </span>
                  <button
                    className="inline-btn delete-btn"
                    title="Delete column"
                    onClick={e => { e.stopPropagation(); onDeleteCol(ci); }}
                  >×</button>
                </div>
              </th>
            ))}
            <th className="add-col-th">
              <button className="inline-btn add-btn" title="Add column" onClick={onAddCol}>+</button>
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, sortedRi) => {
            const originalRi = sortedIndices[sortedRi] + 1; // +1 for header
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
                <td className="row-action-cell">
                  <button
                    className="inline-btn delete-btn"
                    title="Delete row"
                    onClick={() => onDeleteRow(originalRi)}
                  >×</button>
                </td>
              </tr>
            );
          })}
          <tr className="add-row-tr">
            <td colSpan={(header.length ?? 0) + 1}>
              <button className="add-row-btn" onClick={onAddRow}>+ row</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function EditableCell({ value, onChange, isHeader = false, stopPropagation = false }: {
  value: string;
  onChange: (v: string) => void;
  isHeader?: boolean;
  stopPropagation?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  function handleBlur() {
    const newVal = ref.current?.textContent ?? "";
    if (newVal !== value) onChange(newVal);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ref.current?.blur(); }
    if (e.key === "Escape") { if (ref.current) ref.current.textContent = value; ref.current?.blur(); }
  }

  return (
    <span
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onClick={stopPropagation ? e => e.stopPropagation() : undefined}
      className={`cell-content${isHeader ? " cell-header" : ""}`}
    >
      {value}
    </span>
  );
}
