import { createRoot } from "react-dom/client";
import { CsvGrid } from "./components/CsvGrid";
import "./styles.scss";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("[csv-grid] #root element not found");

createRoot(rootEl).render(<CsvGrid />);
