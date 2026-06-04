# English (United States)

The canonical reference locale for Sindri IDE — the default language and the authoritative source of UI string keys for translators creating other locale packs.

## Purpose

This extension serves two roles:

- **Default locale** — ships with Sindri and activates automatically for English-speaking users
- **Translator reference** — every UI string key is defined here with its English value; translators fork this extension and replace values with their target language

## Creating a translation

Fork this extension, rename the `id` to `yourname.lang-XX` (where `XX` is the BCP 47 language tag), update `name` and `description`, and replace the English string values in the translations file.

```json
{
  "$schema": "../manifest.schema.json",
  "id": "yourname.lang-fr",
  "name": "Français",
  "version": "1.0.0",
  "publisher": "yourname",
  "description": "French localisation pack for Sindri IDE.",
  "categories": ["Localisation"],
  "permissions": [],
  "engines": { "sindri": ">=0.1.0" },
  "main": "dist/extension.js"
}
```

## String key examples

```json
{
  "workbench.openFolder": "Open Folder",
  "workbench.newFile": "New File",
  "editor.save": "Save",
  "editor.saveAll": "Save All",
  "marketplace.install": "Install",
  "marketplace.uninstall": "Uninstall",
  "settings.title": "Settings"
}
```

> **Status:** Scaffolded — requires the Sindri extension host and localisation API (in development). The string key schema will be finalised before the first stable release.
