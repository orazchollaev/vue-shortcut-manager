import { ref, onMounted, onUnmounted } from "vue";
import { getManager } from "./manager";
import type { Shortcut, RegisteredShortcut } from "./types";

export function useShortcut(
  key: string,
  handler: () => void,
  options: Pick<Shortcut, "description" | "scope" | "whenFocused"> = {},
): void {
  let id: string;

  onMounted(() => {
    // ✅ getManager() is now called lazily inside onMounted — safe on SSR
    const manager = getManager();
    if (!manager) return;
    id = manager.register({ key, handler, ...options });
  });

  onUnmounted(() => {
    if (!id) return;
    getManager()?.unregisterById(id);
  });
}

export function useShortcuts(shortcuts: Shortcut[]): void {
  const ids: string[] = [];

  onMounted(() => {
    const manager = getManager();
    if (!manager) return;
    shortcuts.forEach((s) => ids.push(manager.register(s)));
  });

  onUnmounted(() => {
    const manager = getManager();
    if (!manager) return;
    ids.forEach((id) => manager.unregisterById(id));
  });
}

export function useShortcutScope(scope: string): void {
  let previousScope: string;

  onMounted(() => {
    const manager = getManager();
    if (!manager) return;
    previousScope = manager.getScope();
    manager.setScope(scope);
  });

  onUnmounted(() => {
    getManager()?.setScope(previousScope ?? "global");
  });
}

export function useShortcutList(scope?: string) {
  // ✅ Use a plain ref instead of computed — the manager's Map is not reactive.
  //    We populate it on mount and after every register/unregister by patching
  //    the manager's register/unregisterById methods on the fly.
  const shortcuts = ref<RegisteredShortcut[]>([]);

  const refresh = () => {
    const manager = getManager();
    if (!manager) return;
    shortcuts.value = scope
      ? manager.getByScope(scope)
      : manager.getAll();
  };

  onMounted(() => {
    const manager = getManager();
    if (!manager) return;

    // Patch register/unregisterById to trigger a re-read after each mutation
    const originalRegister = manager.register.bind(manager);
    const originalUnregister = manager.unregisterById.bind(manager);

    manager.register = (shortcut) => {
      const id = originalRegister(shortcut);
      refresh();
      return id;
    };

    manager.unregisterById = (id) => {
      originalUnregister(id);
      refresh();
    };

    refresh(); // initial read
  });

  onUnmounted(() => {
    // Nothing to clean up — patches are intentionally persistent on the
    // singleton so all future registrations keep the list reactive.
  });

  return { shortcuts };
}