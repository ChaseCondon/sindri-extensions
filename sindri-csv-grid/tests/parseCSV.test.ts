import { describe, expect, it } from "bun:test";
import { parseCSV, sortRows } from "../src/webview/lib/parseCSV";

describe("parseCSV", () => {
  it("parses a simple two-row CSV", () => {
    expect(parseCSV("name,age\nAlice,30")).toEqual([
      ["name", "age"],
      ["Alice", "30"],
    ]);
  });

  it("handles CRLF line endings", () => {
    expect(parseCSV("a,b\r\n1,2\r\n")).toEqual([["a", "b"], ["1", "2"]]);
  });

  it("handles quoted fields with commas", () => {
    expect(parseCSV('city,desc\nNYC,"Big, loud city"')).toEqual([
      ["city", "desc"],
      ["NYC", "Big, loud city"],
    ]);
  });

  it("handles escaped double-quotes inside quoted fields", () => {
    expect(parseCSV('a\n"say ""hello"""')).toEqual([["a"], ['say "hello"']]);
  });

  it("handles empty fields", () => {
    expect(parseCSV("a,b,c\n1,,3")).toEqual([["a", "b", "c"], ["1", "", "3"]]);
  });

  it("strips a trailing empty row from terminal newline", () => {
    expect(parseCSV("a,b\n1,2\n").length).toBe(2);
  });

  it("returns empty array for empty input", () => {
    expect(parseCSV("")).toEqual([]);
  });
});

describe("sortRows", () => {
  const data = [["Alice", "30"], ["Charlie", "25"], ["Bob", "35"]];

  it("sorts strings ascending", () => {
    const result = sortRows(data, 0, true);
    expect(result.map(r => r[0])).toEqual(["Alice", "Bob", "Charlie"]);
  });

  it("sorts strings descending", () => {
    const result = sortRows(data, 0, false);
    expect(result.map(r => r[0])).toEqual(["Charlie", "Bob", "Alice"]);
  });

  it("sorts numerically when all values are numeric", () => {
    const result = sortRows(data, 1, true);
    expect(result.map(r => r[1])).toEqual(["25", "30", "35"]);
  });

  it("does not mutate the input array", () => {
    const original = [...data];
    sortRows(data, 0, true);
    expect(data).toEqual(original);
  });
});
