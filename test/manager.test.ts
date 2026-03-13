import { describe, it, expect, beforeEach, vi } from "vitest";
import { ShortcutManager, resetManager, getManager } from "../src/manager";

function createKeyEvent(
  key: string,
  modifiers: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
  } = {},
): KeyboardEvent {
  return new KeyboardEvent("keydown", {
    key,
    ctrlKey: modifiers.ctrl ?? false,
    shiftKey: modifiers.shift ?? false,
    altKey: modifiers.alt ?? false,
    metaKey: modifiers.meta ?? false,
    bubbles: true,
    cancelable: true,
  });
}

describe("ShortcutManager", () => {
  let manager: ShortcutManager;

  beforeEach(() => {
    manager = new ShortcutManager();
  });

  describe("Kayıt ve Silme", () => {
    it("kısayol kaydeder ve ID döner", () => {
      const id = manager.register({ key: "ctrl+k", handler: vi.fn() });
      expect(typeof id).toBe("string");
      expect(id.length).toBeGreaterThan(0);
    });

    it("kayıtlı kısayolu ID ile siler", () => {
      const id = manager.register({ key: "ctrl+k", handler: vi.fn() });
      manager.unregisterById(id);
      expect(manager.getAll()).toHaveLength(0);
    });

    it("kayıtlı kısayolu key ve scope ile siler", () => {
      manager.register({ key: "ctrl+k", handler: vi.fn(), scope: "global" });
      manager.unregister("ctrl+k", "global");
      expect(manager.getAll()).toHaveLength(0);
    });

    it("aynı key ve scope çakışmasında uyarı verir ve üzerine yazar", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const firstHandler = vi.fn();
      const secondHandler = vi.fn();

      manager.register({ key: "ctrl+s", handler: firstHandler });
      manager.register({ key: "ctrl+s", handler: secondHandler });

      expect(warnSpy).toHaveBeenCalledOnce();
      expect(manager.getAll()).toHaveLength(1);

      manager.handleKeyDown(createKeyEvent("s", { ctrl: true }));
      expect(secondHandler).toHaveBeenCalledOnce();
      expect(firstHandler).not.toHaveBeenCalled();

      warnSpy.mockRestore();
    });

    it("farklı scope ile aynı key birden fazla kez kaydedilebilir", () => {
      manager.register({ key: "ctrl+b", handler: vi.fn(), scope: "global" });
      manager.register({ key: "ctrl+b", handler: vi.fn(), scope: "editor" });
      expect(manager.getAll()).toHaveLength(2);
    });
  });

  describe("Handler Tetikleme", () => {
    it("doğru tuşa basınca handler çalışır", () => {
      const handler = vi.fn();
      manager.register({ key: "ctrl+k", handler });
      manager.handleKeyDown(createKeyEvent("k", { ctrl: true }));
      expect(handler).toHaveBeenCalledOnce();
    });

    it("yanlış tuşa basınca handler çalışmaz", () => {
      const handler = vi.fn();
      manager.register({ key: "ctrl+k", handler });
      manager.handleKeyDown(createKeyEvent("j", { ctrl: true }));
      expect(handler).not.toHaveBeenCalled();
    });

    it("modifier olmadan basınca handler çalışmaz", () => {
      const handler = vi.fn();
      manager.register({ key: "ctrl+k", handler });
      manager.handleKeyDown(createKeyEvent("k"));
      expect(handler).not.toHaveBeenCalled();
    });

    it("silinen kısayol artık çalışmaz", () => {
      const handler = vi.fn();
      const id = manager.register({ key: "ctrl+z", handler });
      manager.unregisterById(id);
      manager.handleKeyDown(createKeyEvent("z", { ctrl: true }));
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("Tuş Aliasları", () => {
    it("space tuşunu tanır", () => {
      const handler = vi.fn();
      manager.register({ key: "space", handler });
      manager.handleKeyDown(createKeyEvent(" "));
      expect(handler).toHaveBeenCalledOnce();
    });

    it("enter tuşunu tanır", () => {
      const handler = vi.fn();
      manager.register({ key: "enter", handler });
      manager.handleKeyDown(createKeyEvent("Enter"));
      expect(handler).toHaveBeenCalledOnce();
    });

    it("escape tuşunu tanır", () => {
      const handler = vi.fn();
      manager.register({ key: "escape", handler });
      manager.handleKeyDown(createKeyEvent("Escape"));
      expect(handler).toHaveBeenCalledOnce();
    });

    it("arrowup → up aliasını tanır", () => {
      const handler = vi.fn();
      manager.register({ key: "up", handler });
      manager.handleKeyDown(createKeyEvent("ArrowUp"));
      expect(handler).toHaveBeenCalledOnce();
    });

    it("arrowdown → down aliasını tanır", () => {
      const handler = vi.fn();
      manager.register({ key: "down", handler });
      manager.handleKeyDown(createKeyEvent("ArrowDown"));
      expect(handler).toHaveBeenCalledOnce();
    });

    it("arrowleft → left aliasını tanır", () => {
      const handler = vi.fn();
      manager.register({ key: "left", handler });
      manager.handleKeyDown(createKeyEvent("ArrowLeft"));
      expect(handler).toHaveBeenCalledOnce();
    });

    it("arrowright → right aliasını tanır", () => {
      const handler = vi.fn();
      manager.register({ key: "right", handler });
      manager.handleKeyDown(createKeyEvent("ArrowRight"));
      expect(handler).toHaveBeenCalledOnce();
    });

    it("ctrl+arrowup → ctrl+up çalışır", () => {
      const handler = vi.fn();
      manager.register({ key: "ctrl+up", handler });
      manager.handleKeyDown(createKeyEvent("ArrowUp", { ctrl: true }));
      expect(handler).toHaveBeenCalledOnce();
    });

    it("backspace tuşunu tanır", () => {
      const handler = vi.fn();
      manager.register({ key: "backspace", handler });
      manager.handleKeyDown(createKeyEvent("Backspace"));
      expect(handler).toHaveBeenCalledOnce();
    });

    it("tab tuşunu tanır", () => {
      const handler = vi.fn();
      manager.register({ key: "tab", handler });
      manager.handleKeyDown(createKeyEvent("Tab"));
      expect(handler).toHaveBeenCalledOnce();
    });
  });

  describe("Scope", () => {
    it("varsayılan scope global olmalı", () => {
      expect(manager.getScope()).toBe("global");
    });

    it("scope değiştirilince yeni scope döner", () => {
      manager.setScope("editor");
      expect(manager.getScope()).toBe("editor");
    });

    it("aktif scope kısayolunu öncelikle çalıştırır", () => {
      const globalHandler = vi.fn();
      const editorHandler = vi.fn();
      manager.register({
        key: "ctrl+b",
        handler: globalHandler,
        scope: "global",
      });
      manager.register({
        key: "ctrl+b",
        handler: editorHandler,
        scope: "editor",
      });

      manager.setScope("editor");
      manager.handleKeyDown(createKeyEvent("b", { ctrl: true }));

      expect(editorHandler).toHaveBeenCalledOnce();
      expect(globalHandler).not.toHaveBeenCalled();
    });

    it("aktif scope bulunamazsa global fallback çalışır", () => {
      const globalHandler = vi.fn();
      manager.register({
        key: "ctrl+k",
        handler: globalHandler,
        scope: "global",
      });

      manager.setScope("modal");
      manager.handleKeyDown(createKeyEvent("k", { ctrl: true }));

      expect(globalHandler).toHaveBeenCalledOnce();
    });

    it("getByScope doğru kısayolları döner", () => {
      manager.register({ key: "ctrl+b", handler: vi.fn(), scope: "editor" });
      manager.register({ key: "ctrl+k", handler: vi.fn(), scope: "global" });

      const editorShortcuts = manager.getByScope("editor");
      expect(editorShortcuts).toHaveLength(1);
      expect(editorShortcuts[0].key).toBe("ctrl+b");
    });
  });

  describe("Sekans Kısayolları", () => {
    it("g h sıralı tuş kombinasyonunu tetikler", () => {
      const handler = vi.fn();
      manager.register({ key: "g h", handler });

      manager.handleKeyDown(createKeyEvent("g"));
      manager.handleKeyDown(createKeyEvent("h"));

      expect(handler).toHaveBeenCalledOnce();
    });

    it("yanlış sırada basılınca sekans çalışmaz", () => {
      const handler = vi.fn();
      manager.register({ key: "g h", handler });

      manager.handleKeyDown(createKeyEvent("h"));
      manager.handleKeyDown(createKeyEvent("g"));

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("whenFocused", () => {
    let activeElementMock: Element | null = null;

    beforeEach(() => {
      activeElementMock = null;
      vi.spyOn(document, "activeElement", "get").mockImplementation(
        () => activeElementMock,
      );
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("element fokustayken handler çalışır", () => {
      const handler = vi.fn();
      const input = document.createElement("input");
      activeElementMock = input;

      manager.register({ key: "escape", handler, whenFocused: input });
      manager.handleKeyDown(createKeyEvent("Escape"));

      expect(handler).toHaveBeenCalledOnce();
    });

    it("element fokusta değilken handler çalışmaz", () => {
      const handler = vi.fn();
      const input = document.createElement("input");
      activeElementMock = null;

      manager.register({ key: "escape", handler, whenFocused: input });
      manager.handleKeyDown(createKeyEvent("Escape"));

      expect(handler).not.toHaveBeenCalled();
    });

    it("Vue ref ile whenFocused çalışır", () => {
      const handler = vi.fn();
      const input = document.createElement("input");
      activeElementMock = input;

      const ref = { value: input };
      manager.register({ key: "enter", handler, whenFocused: ref as any });
      manager.handleKeyDown(createKeyEvent("Enter"));

      expect(handler).toHaveBeenCalledOnce();
    });
  });

  describe("onChange", () => {
    it("register sonrası listener tetiklenir", () => {
      const listener = vi.fn();
      manager.onChange(listener);
      manager.register({ key: "ctrl+k", handler: vi.fn() });
      expect(listener).toHaveBeenCalledOnce();
    });

    it("unregisterById sonrası listener tetiklenir", () => {
      const listener = vi.fn();
      const id = manager.register({ key: "ctrl+k", handler: vi.fn() });
      manager.onChange(listener);
      manager.unregisterById(id);
      expect(listener).toHaveBeenCalledOnce();
    });

    it("unsubscribe sonrası listener artık tetiklenmez", () => {
      const listener = vi.fn();
      const unsubscribe = manager.onChange(listener);
      unsubscribe();
      manager.register({ key: "ctrl+k", handler: vi.fn() });
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe("getManager SSR Guard", () => {
    it("window yoksa null döner", () => {
      resetManager();
      const originalWindow = global.window;
      // @ts-expect-error
      delete global.window;

      expect(getManager()).toBeNull();

      global.window = originalWindow;
      resetManager();
    });
  });
});
