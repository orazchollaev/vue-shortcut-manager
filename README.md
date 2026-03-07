# vue-shortcut-manager

> Zero-config keyboard shortcut manager for Vue 3. No plugin, no `main.ts` setup needed.

[![npm version](https://img.shields.io/npm/v/vue-shortcut-manager?color=42b883&label=npm)](https://www.npmjs.com/package/vue-shortcut-manager)
[![npm downloads](https://img.shields.io/npm/dm/vue-shortcut-manager?color=42b883)](https://www.npmjs.com/package/vue-shortcut-manager)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![vue](https://img.shields.io/badge/vue-3.x-42b883.svg)](https://vuejs.org/)

---

## Features

- **Zero setup** — just import and use, no `app.use()` needed
- `useShortcut()` — register a single shortcut
- `useShortcuts()` — register multiple shortcuts at once
- `useShortcutScope()` — activate a named scope while component is mounted
- `useShortcutList()` — reactive list of all shortcuts
- `<ShortcutCheatsheet />` — built-in modal, open with `shift+?`
- **Sequence shortcuts** — `g h`, `g i` style combos
- **`whenFocused`** — only fire when a specific element is focused
- **Conflict detection** — warns on duplicate key registrations
- **Auto cleanup** — unregisters on component unmount
- Full TypeScript support

---

## Install

```bash
pnpm add vue-shortcut-manager
# or
npm install vue-shortcut-manager
# or
yarn add vue-shortcut-manager
```

**No `main.ts` changes needed.** The manager initializes itself on the first composable call.

---

## Usage

### Basic shortcut

```vue
<script setup lang="ts">
import { useShortcut } from "vue-shortcut-manager";

useShortcut("ctrl+k", () => openSearch(), {
  description: "Open search",
});
</script>
```

### Multiple shortcuts

```vue
<script setup lang="ts">
import { useShortcuts } from "vue-shortcut-manager";

useShortcuts([
  { key: "ctrl+s", handler: save, description: "Save" },
  { key: "ctrl+z", handler: undo, description: "Undo" },
  { key: "ctrl+shift+z", handler: redo, description: "Redo" },
]);
</script>
```

### Scoped shortcuts

Scope activates when the component mounts and restores the previous scope on unmount.

```vue
<script setup lang="ts">
import { useShortcutScope, useShortcut } from "vue-shortcut-manager";

useShortcutScope("editor");

useShortcut("ctrl+b", toggleBold, {
  scope: "editor",
  description: "Bold",
});
</script>
```

### Sequence shortcuts

Press keys within 1 second of each other.

```vue
<script setup lang="ts">
import { useShortcut } from "vue-shortcut-manager";

useShortcut("g h", () => router.push("/"), { description: "Go home" });
useShortcut("g i", () => router.push("/inbox"), { description: "Go inbox" });
</script>
```

### whenFocused — only fire when an element is focused

```vue
<template>
  <input ref="searchInput" placeholder="Search..." />
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useShortcut } from "vue-shortcut-manager";

const searchInput = ref<HTMLElement | null>(null);

useShortcut("escape", () => clearSearch(), {
  whenFocused: searchInput,
  description: "Clear search",
});

useShortcut("ctrl+enter", () => submitSearch(), {
  whenFocused: searchInput,
  description: "Submit search",
});
</script>
```

Also works with raw `HTMLElement`:

```ts
useShortcut("ctrl+enter", submit, {
  whenFocused: document.getElementById("myInput"),
});
```

### Cheatsheet modal

Add `<ShortcutCheatsheet />` anywhere in your app. Press `shift+?` to open it.

```vue
<template>
  <RouterView />
  <ShortcutCheatsheet />
</template>

<script setup lang="ts">
import { ShortcutCheatsheet } from "vue-shortcut-manager";
</script>
```

Custom toggle key:

```vue
<ShortcutCheatsheet toggle-key="ctrl+/" />
```

### Reactive shortcut list (custom cheatsheet)

```vue
<script setup lang="ts">
import { useShortcutList } from "vue-shortcut-manager";

const { shortcuts } = useShortcutList(); // all scopes
const { shortcuts } = useShortcutList("editor"); // filtered by scope
</script>
```

---

## API

### `useShortcut(key, handler, options?)`

| Option        | Type                                              | Description                       |
| ------------- | ------------------------------------------------- | --------------------------------- |
| `description` | `string`                                          | Label shown in cheatsheet         |
| `scope`       | `string`                                          | Scope name (default: `'global'`)  |
| `whenFocused` | `Ref<HTMLElement \| null> \| HTMLElement \| null` | Only fire when element is focused |

### `useShortcuts(shortcuts[])`

Same as calling `useShortcut` multiple times. Each item accepts the same options.

### `useShortcutScope(scope)`

Activates `scope` on mount, restores previous scope on unmount.

### `useShortcutList(scope?)`

Returns `{ shortcuts }` — a computed ref of `RegisteredShortcut[]`.

### `<ShortcutCheatsheet toggle-key="shift+?" />`

Built-in modal listing all registered shortcuts grouped by scope.

---

## Key syntax

Keys are case-insensitive strings joined with `+`:

```
ctrl+k       ctrl+shift+z     meta+s
alt+f4       shift+?          escape
g h          g i              (sequences, space-separated)
```

Modifier keys: `ctrl`, `shift`, `alt`, `meta`

---

## TypeScript

```ts
import type {
  Shortcut,
  RegisteredShortcut,
  ShortcutManagerOptions,
} from "vue-shortcut-manager";
```

---

## License

MIT
