# English (United Kingdom)

British English localisation for Sindri IDE — adapts US English UI strings to British English spelling and terminology. The reference sample for creating a localisation pack.

## What this example demonstrates

| API | Usage |
| --- | --- |
| `sindri.ui.registerLocale` | Register a locale with a translations map |
| Locale override | Translate a subset of keys — untranslated keys fall back to `en-us` |

## What it changes

A localisation pack only needs to provide the strings that differ. The main differences between `en-us` and `en-gb`:

| US English | British English |
| --- | --- |
| Color | Colour |
| Customize | Customise |
| Recognize | Recognise |
| Favorite | Favourite |
| Center | Centre |
| Program | Programme (context-dependent) |
| Localization | Localisation |

## Status

⏳ **Blocked on localisation API** — `sindri.ui.registerLocale` is not yet implemented. This folder is a scaffold. String key definitions and source will be added when the localisation API ships.

## Creating your own localisation

Fork this extension, update the `id` to `yourname.lang-XX` (BCP 47 language tag), and replace the string values with your target language. Only provide keys that differ from `en-us` — Sindri falls back to the base locale for any missing keys.
