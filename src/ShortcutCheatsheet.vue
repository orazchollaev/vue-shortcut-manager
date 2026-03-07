<template>
  <div v-if="visible" class="shortcut-cheatsheet">
    <div class="shortcut-cheatsheet__backdrop" @click="visible = false" />
    <div class="shortcut-cheatsheet__modal">
      <div class="shortcut-cheatsheet__header">
        <h2>Keyboard Shortcuts</h2>
        <button @click="visible = false">✕</button>
      </div>

      <div
        v-if="groupedShortcuts.length === 0"
        class="shortcut-cheatsheet__empty"
      >
        No shortcuts registered.
      </div>

      <div
        v-for="group in groupedShortcuts"
        :key="group.scope"
        class="shortcut-cheatsheet__group"
      >
        <h3 class="shortcut-cheatsheet__scope">{{ group.scope }}</h3>
        <ul class="shortcut-cheatsheet__list">
          <li
            v-for="s in group.shortcuts"
            :key="s.id"
            class="shortcut-cheatsheet__item"
          >
            <span class="shortcut-cheatsheet__desc">{{
              s.description ?? s.key
            }}</span>
            <kbd class="shortcut-cheatsheet__kbd">{{ formatKey(s.key) }}</kbd>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useShortcutList, useShortcut } from "./composables";

const props = withDefaults(
  defineProps<{
    toggleKey?: string;
  }>(),
  { toggleKey: "shift+?" },
);

const visible = ref(false);
const { shortcuts } = useShortcutList();

useShortcut(
  props.toggleKey,
  () => {
    visible.value = !visible.value;
  },
  { description: "Show keyboard shortcuts", scope: "global" },
);

const groupedShortcuts = computed(() => {
  const map = new Map<string, typeof shortcuts.value>();

  shortcuts.value.forEach((s) => {
    const scope = s.scope ?? "global";
    if (!map.has(scope)) map.set(scope, []);
    map.get(scope)!.push(s);
  });

  return Array.from(map.entries()).map(([scope, list]) => ({
    scope,
    shortcuts: list,
  }));
});

function formatKey(key: string): string {
  return key
    .split("+")
    .map((k) => {
      const symbols: Record<string, string> = {
        ctrl: "⌃",
        shift: "⇧",
        alt: "⌥",
        meta: "⌘",
        arrowup: "↑",
        arrowdown: "↓",
        arrowleft: "←",
        arrowright: "→",
        enter: "↵",
        escape: "Esc",
        backspace: "⌫",
        " ": "Space",
      };
      return symbols[k] ?? k.toUpperCase();
    })
    .join(" ");
}
</script>

<style scoped>
.shortcut-cheatsheet__backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

.shortcut-cheatsheet__modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  min-width: 360px;
  max-width: 520px;
  max-height: 70vh;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.shortcut-cheatsheet__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.shortcut-cheatsheet__header h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.shortcut-cheatsheet__header button {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: #666;
}

.shortcut-cheatsheet__scope {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #999;
  margin: 16px 0 8px;
}

.shortcut-cheatsheet__list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.shortcut-cheatsheet__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
}

.shortcut-cheatsheet__desc {
  color: #333;
}

.shortcut-cheatsheet__kbd {
  background: #f4f4f4;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 2px 8px;
  font-family: monospace;
  font-size: 12px;
  color: #555;
}

.shortcut-cheatsheet__empty {
  color: #999;
  text-align: center;
  padding: 24px 0;
  font-size: 14px;
}
</style>
