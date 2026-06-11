import "./styles.scss";
import App from "./components/App.svelte";

const target = document.getElementById("root");
if (!target) throw new Error("[commit-streak] #root element not found");

new App({ target });
