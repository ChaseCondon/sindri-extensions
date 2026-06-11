# Changesets

This directory contains pending changeset files created by `bun run changeset`.

Each file declares which extensions changed and what kind of version bump they need
(`patch` / `minor` / `major`). Files are consumed by the release pipeline when
the Version PR is merged to `main`.

**Do not edit these files by hand** — use `bun run changeset add` instead.

See [CONTRIBUTING.md](../CONTRIBUTING.md#release-pipeline) for the full workflow.
