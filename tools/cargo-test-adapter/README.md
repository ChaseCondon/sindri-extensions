# Cargo Test Adapter

Integrates `cargo test` into the Sindri test runner — discover, run, and see results inline without leaving the editor.

## Features

- **Test discovery** — runs `cargo test -- --list` to find all tests in the workspace
- **Run individual tests** — click any test in the panel to run it in isolation
- **Run full suite** — run all tests in the current package or workspace
- **Streaming output** — live output streamed as tests execute
- **Inline results** — pass/fail indicators shown in the gutter next to each `#[test]`
- **Failure navigation** — click a failure to jump to the failing assertion

## Example output

```text
running 4 tests
test parser::tests::parses_empty_input ... ok
test parser::tests::rejects_unclosed_bracket ... ok
test registry::tests::deduplicates_entries ... ok
test registry::tests::returns_none_for_missing ... FAILED

failures:

---- registry::tests::returns_none_for_missing stdout ----
thread 'registry::tests::returns_none_for_missing' panicked at 'assertion failed'
```

## Requirements

- A Rust workspace with `cargo` on `PATH`
- Tests using the standard `#[test]` attribute or `#[tokio::test]` for async tests

> **Status:** Scaffolded — requires the Sindri extension host and Test & Task Adapter API (in development).
