import { onMounted, onUnmounted, computed } from "vue";
import { getManager } from "./manager";
import type { Shortcut } from "./types";

export function useShortcut(
  key: string,
  handler: () => void,
  options: Pick<Shortcut, "description" | "scope" | "whenFocused"> = {},
): void {
  const manager = getManager();
  let id: string;

  onMounted(() => {
    id = manager.register({ key, handler, ...options });
  });

  onUnmounted(() => {
    if (id) manager.unregisterById(id);
  });
}

export function useShortcuts(shortcuts: Shortcut[]): void {
  const manager = getManager();
  const ids: string[] = [];

  onMounted(() => {
    shortcuts.forEach((s) => ids.push(manager.register(s)));
  });

  onUnmounted(() => {
    ids.forEach((id) => manager.unregisterById(id));
  });
}

export function useShortcutScope(scope: string): void {
  const manager = getManager();
  let previousScope: string;

  onMounted(() => {
    previousScope = manager.getScope();
    manager.setScope(scope);
  });

  onUnmounted(() => {
    manager.setScope(previousScope ?? "global");
  });
}

export function useShortcutList(scope?: string) {
  const manager = getManager();

  const shortcuts = computed(() =>
    scope ? manager.getByScope(scope) : manager.getAll(),
  );

  return { shortcuts };
}
