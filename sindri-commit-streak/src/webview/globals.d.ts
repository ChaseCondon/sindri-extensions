// Globals injected into the webview iframe by WebviewPanelHost (sindri-ide).
// These are NOT available in the extension host — webview-side only.

declare function acquireSindriApi(): {
  postMessage(msg: unknown): void;
  onMessage(handler: (data: unknown) => void): void;
};

// Allow SCSS imports — processed by esbuild-sass-plugin at build time.
declare module "*.scss";
