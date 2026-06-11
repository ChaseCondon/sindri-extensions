import { sortRows } from "../lib/parseCSV";
import type { SortState } from "../lib/types";

interface Props {
  rows: string[][];
  sort: SortState;
  onSort: (col: number) => void;
  onClear: () => void;
}

export function GridView({ rows, sort, onSort, onClear }: Props) {
  const [header, ...data] = rows;
  const sorted = sort ? sortRows(data, sort.col, sort.asc) : data;

  return (
    <div className="grid-view">
      <div className="toolbar">
        <span className="toolbar-title">CSV Grid</span>
        <span className="toolbar-info">
          {data.length} row{data.length !== 1 ? "s" : ""} ×{" "}
          {header.length} col{header.length !== 1 ? "s" : ""}
        </span>
        <button className="btn btn-secondary" onClick={onClear}>
          Clear
        </button>
      </div>
      <div className="grid-area">
        <table>
          <thead>
            <tr>
              {header.map((h, i) => (
                <th
                  key={i}
                  className={sort?.col === i ? "sorted" : ""}
                  onClick={() => onSort(i)}
                >
                  {h}
                  <span className="sort-icon">
                    {sort?.col === i ? (sort.asc ? " ▲" : " ▼") : " ↕"}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, ri) => (
              <tr key={ri}>
                {header.map((_, ci) => (
                  <td key={ci} title={row[ci] ?? ""}>
                    {row[ci] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
