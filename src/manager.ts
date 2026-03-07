import type {
  RegisteredShortcut,
  Shortcut,
  ShortcutManagerOptions,
} from "./types";

let _instance: ShortcutManager | null = null;

export function getManager(options?: ShortcutManagerOptions): ShortcutManager {
  if (!_instance) {
    _instance = new ShortcutManager(options);
    window.addEventListener("keydown", (e) => _instance!.handleKeyDown(e));
  }
  return _instance;
}

export function resetManager(): void {
  _instance = null;
}

export class ShortcutManager {
  private shortcuts = new Map<string, RegisteredShortcut[]>();
  private activeScope = "global";
  private sequenceBuffer: string[] = [];
  private sequenceTimeout: ReturnType<typeof setTimeout> | null = null;
  private options: ShortcutManagerOptions;

  constructor(options: ShortcutManagerOptions = {}) {
    this.options = {
      preventDefault: true,
      stopPropagation: false,
      ...options,
    };
  }

  setScope(scope: string): void {
    this.activeScope = scope;
  }

  getScope(): string {
    return this.activeScope;
  }

  register(shortcut: Shortcut): string {
    const id = crypto.randomUUID();
    const key = shortcut.key.toLowerCase();
    const existing = this.shortcuts.get(key) ?? [];

    const conflict = existing.find(
      (s) => (s.scope ?? "global") === (shortcut.scope ?? "global"),
    );
    if (conflict) {
      console.warn(
        `[vue-shortcut-manager] Conflict: "${key}" already registered in scope "${shortcut.scope ?? "global"}". Overwriting.`,
      );
      this.unregisterById(conflict.id);
    }

    this.shortcuts.set(key, [
      ...(this.shortcuts.get(key) ?? []),
      { ...shortcut, key, id },
    ]);

    return id;
  }

  unregister(key: string, scope = "global"): void {
    const list = this.shortcuts.get(key.toLowerCase()) ?? [];
    const filtered = list.filter((s) => (s.scope ?? "global") !== scope);
    if (filtered.length === 0) {
      this.shortcuts.delete(key.toLowerCase());
    } else {
      this.shortcuts.set(key.toLowerCase(), filtered);
    }
  }

  unregisterById(id: string): void {
    for (const [key, list] of this.shortcuts.entries()) {
      const filtered = list.filter((s) => s.id !== id);
      if (filtered.length === 0) {
        this.shortcuts.delete(key);
      } else {
        this.shortcuts.set(key, filtered);
      }
    }
  }

  getAll(): RegisteredShortcut[] {
    return Array.from(this.shortcuts.values()).flat();
  }

  getByScope(scope: string): RegisteredShortcut[] {
    return this.getAll().filter((s) => (s.scope ?? "global") === scope);
  }

  private parseEvent(e: KeyboardEvent): string {
    const parts: string[] = [];
    if (e.ctrlKey) parts.push("ctrl");
    if (e.shiftKey) parts.push("shift");
    if (e.altKey) parts.push("alt");
    if (e.metaKey) parts.push("meta");

    const key = e.key.toLowerCase();
    if (!["control", "shift", "alt", "meta"].includes(key)) {
      parts.push(key);
    }

    return parts.join("+");
  }

  handleKeyDown(e: KeyboardEvent): void {
    const key = this.parseEvent(e);

    this.sequenceBuffer.push(key);
    if (this.sequenceTimeout) clearTimeout(this.sequenceTimeout);
    this.sequenceTimeout = setTimeout(() => {
      this.sequenceBuffer = [];
    }, 1000);

    const sequenceKey = this.sequenceBuffer.join(" ");
    const sequenceMatch = this.findMatch(sequenceKey);

    if (sequenceMatch) {
      this.sequenceBuffer = [];
      if (this.sequenceTimeout) clearTimeout(this.sequenceTimeout);
      this.triggerShortcut(sequenceMatch, e);
      return;
    }

    const match = this.findMatch(key);
    if (match) {
      this.triggerShortcut(match, e);
    }
  }

  private findMatch(key: string): RegisteredShortcut | undefined {
    const list = this.shortcuts.get(key) ?? [];
    return (
      list.find((s) => (s.scope ?? "global") === this.activeScope) ??
      list.find((s) => (s.scope ?? "global") === "global")
    );
  }

  private triggerShortcut(
    shortcut: RegisteredShortcut,
    e: KeyboardEvent,
  ): void {
    if (shortcut.whenFocused !== undefined && shortcut.whenFocused !== null) {
      const el =
        "value" in (shortcut.whenFocused as object)
          ? (shortcut.whenFocused as { value: HTMLElement | null }).value
          : (shortcut.whenFocused as HTMLElement);

      if (!el || document.activeElement !== el) return;
    }

    if (this.options.preventDefault) e.preventDefault();
    if (this.options.stopPropagation) e.stopPropagation();
    shortcut.handler();
  }
}
