# Rust Language Support

Full Rust development support for Sindri IDE — syntax, intelligence, and debugging in one extension.

## Features

### Syntax highlighting

Tree-sitter grammar for Rust providing precise, incremental syntax highlighting.

### Language Server — rust-analyzer

- Hover documentation
- Inline type hints
- Go-to-definition and find-references
- Code completions with documentation
- Inline diagnostics (errors, warnings, clippy lints)
- Code actions and quick fixes
- Rename symbol

### Debugger — LLDB

- Breakpoints (line, conditional, logpoint)
- Step in / step over / step out
- Variable inspection and watch expressions
- Call stack and thread views

## Requirements

- **rust-analyzer** on `PATH` — install via `rustup component add rust-analyzer`
- **lldb-vscode** for debugging — `brew install llvm` on macOS, `apt install lldb` on Linux

## Example

```rust
use std::fmt;

#[derive(Debug)]
pub enum ParseError {
    UnexpectedToken { found: String, expected: &'static str },
    UnexpectedEof,
}

impl fmt::Display for ParseError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::UnexpectedToken { found, expected } => {
                write!(f, "expected {expected}, found `{found}`")
            }
            Self::UnexpectedEof => write!(f, "unexpected end of input"),
        }
    }
}
```

> **Status:** Scaffolded — requires the Sindri extension host (in development). The `dist/extension.js` entry point and grammar WASM file will be added once the host is ready.
