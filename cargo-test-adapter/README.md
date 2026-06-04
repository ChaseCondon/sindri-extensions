# Cargo Test Adapter

Integrates `cargo test` into the Sindri test runner.

- Discovers tests via `cargo test -- --list`
- Runs individual tests or the full suite from the Sindri UI
- Streams output and maps failures back to source locations

**Status:** Scaffolded — requires the Sindri extension host and Test & Task Adapter API (in development).
