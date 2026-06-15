import { createRoot } from "react-dom/client";
import { CsvGrid } from "./components/CsvGrid";
import "./styles.scss";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("[csv-grid] #root element not found");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const api = (window as any).acquireSindriApi?.() ?? null;

createRoot(rootEl).render(<CsvGrid api={api} />);
