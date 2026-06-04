# Sindri Aurora

A deep purple and teal dark theme for Sindri IDE — high contrast where it counts, muted chrome around it.

## Palette

| Role | Colour | Hex |
| --- | --- | --- |
| Background | Deep ink | `#0B0A18` |
| Panel | Dark navy | `#0E0D1F` |
| Accent | Violet | `#B06CFF` |
| Keywords | Soft lavender | `#C490FF` |
| Strings | Teal | `#00D4B4` |
| Functions | Light purple | `#E0B0FF` |
| Numbers | Sky blue | `#79B8FF` |
| Comments | Muted blue-grey | `#3E3460` |
| Danger | Coral | `#FF5A6E` |

## Preview

```typescript
// Sindri Aurora — TypeScript example
import { createSignal } from "solid-js";

interface User {
  id: string;
  name: string;
  role: "admin" | "viewer";
}

export function useUser(id: string) {
  const [user, setUser] = createSignal<User | null>(null);
  const [loading, setLoading] = createSignal(true);

  async function fetchUser(): Promise<void> {
    const res = await fetch(`/api/users/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    setUser(await res.json());
    setLoading(false);
  }

  return { user, loading, fetchUser };
}
```

```rust
// Sindri Aurora — Rust example
use std::collections::HashMap;

#[derive(Debug, Clone)]
pub struct Registry<T> {
    entries: HashMap<String, T>,
}

impl<T: Clone> Registry<T> {
    pub fn new() -> Self {
        Self { entries: HashMap::new() }
    }

    pub fn register(&mut self, id: impl Into<String>, value: T) {
        self.entries.insert(id.into(), value);
    }

    pub fn get(&self, id: &str) -> Option<&T> {
        self.entries.get(id)
    }
}
```

## Installation

Install from Settings → Extensions → Marketplace, then switch to it under Settings → Appearance → Colour theme.
