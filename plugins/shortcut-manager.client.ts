// plugins/shortcut-manager.client.ts
//
// The `.client` suffix tells Nuxt to ONLY run this plugin in the browser.
// This is the canonical way to initialize anything that touches `window`.
//
// No code is needed here — getManager() is lazy and self-initializes on first
// call. This file exists as an explicit marker so Nuxt tree-shakes the manager
// out of the server bundle entirely.

export default defineNuxtPlugin(() => {
  // Eagerly boot the manager so the keydown listener is attached as early as
  // possible (before any component mounts and registers shortcuts).
  const { getManager } = await import("~/composables/shortcut/manager");
  getManager();
});