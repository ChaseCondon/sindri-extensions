/**
 * RFC 4180-compatible CSV parser.
 * Handles quoted fields, escaped double-quotes (""), and CRLF/LF/CR line endings.
 * Returns an array of rows, where each row is an array of field strings.
 * The first row is the header.
 */
export function parseCSV(raw: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuote = false;
  let i = 0;

  while (i < raw.length) {
    const ch = raw[i];
    if (inQuote) {
      if (ch === '"' && raw[i + 1] === '"') { field += '"'; i += 2; }
      else if (ch === '"')                  { inQuote = false; i++; }
      else                                  { field += ch; i++; }
    } else {
      if      (ch === '"')                          { inQuote = true; i++; }
      else if (ch === ',')                          { row.push(field); field = ""; i++; }
      else if (ch === '\r' && raw[i + 1] === '\n') { row.push(field); rows.push(row); field = ""; row = []; i += 2; }
      else if (ch === '\n' || ch === '\r')          { row.push(field); rows.push(row); field = ""; row = []; i++; }
      else                                          { field += ch; i++; }
    }
  }

  if (field !== "" || row.length > 0) { row.push(field); rows.push(row); }

  // Strip trailing empty row produced by a terminal newline
  const last = rows[rows.length - 1];
  if (last?.length === 1 && last[0] === "") rows.pop();

  return rows;
}

export function sortRows(data: string[][], col: number, asc: boolean): string[][] {
  return [...data].sort((a, b) => {
    const av = a[col] ?? "", bv = b[col] ?? "";
    const an = Number(av), bn = Number(bv);
    const cmp = !isNaN(an) && !isNaN(bn) ? an - bn : av.localeCompare(bv);
    return asc ? cmp : -cmp;
  });
}
