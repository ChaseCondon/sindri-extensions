/**
 * Sindri extension host API — ADR-0015 §4.
 *
 * Ambient declarations only. No imports needed in extensions — `sindri` is injected
 * as a global by the QuickJS host. Include this file via tsconfig `include` or
 * reference it with `/// <reference path="..." />`.
 *
 * Only namespaces declared here are implemented in the host today.
 * Stubs for future namespaces (sindri.editor, sindri.lsp, etc.) are included for
 * type-ahead but will throw at runtime until their host implementations land.
 */

// ─── Shared types ────────────────────────────────────────────────────────────

declare interface ExtensionContext {
  /** Disposables registered here are cleaned up when the extension deactivates. */
  subscriptions: { dispose(): void }[];
}

/** Mirror of env.rs ProcessSpec (ADR-0009 / ADR-0014). */
declare interface ProcessSpec {
  argv: string[];
  cwd?: string;
  env?: Record<string, string>;
  stdin?: "null" | "inherit";
}

declare interface ExecOutput {
  code: number | null;
  stdout: string;
  stderr: string;
}

// ─── sindri.commands (M1) ────────────────────────────────────────────────────

declare interface SindriCommands {
  register(id: string, handler: (...args: unknown[]) => unknown): void;
  execute(id: string, ...args: unknown[]): Promise<unknown>;
}

// ─── sindri.env (M2) ─────────────────────────────────────────────────────────

declare interface SindriEnvFs {
  read(path: string): Promise<string>;
  glob(pattern: string): Promise<string[]>;
  exists(path: string): Promise<boolean>;
}

declare interface SindriEnv {
  fs: SindriEnvFs;
  exec(cmd: string, ...args: string[]): Promise<ExecOutput>;
}

// ─── sindri.ui (ADR-0026) ────────────────────────────────────────────────────

declare interface StatusBarItem {
  text: string;
  tooltip: string;
  show(): void;
  hide(): void;
  dispose(): void;
}

declare interface SindriUi {
  createStatusBarItem(id: string, options?: { text?: string; tooltip?: string }): StatusBarItem;
}

// ─── sindri.events (M3) ──────────────────────────────────────────────────────

declare interface SindriEvents {
  on(eventId: string, handler: (payload: unknown) => void): void;
  emit(eventId: string, payload: unknown): void;
}

// ─── Global injection ────────────────────────────────────────────────────────

declare const sindri: {
  /** Command registry — register and execute named commands. Implemented in M1. */
  commands: SindriCommands;
  /** Environment access — all FS and process calls must go through here (ADR-0009). Implemented in M2. */
  env: SindriEnv;
  /** Event bus — broadcast and subscribe to typed events. Implemented in M3. */
  events: SindriEvents;
  /** UI components — status bar items, tree views, webview panels (ADR-0026). */
  ui: SindriUi;
};
