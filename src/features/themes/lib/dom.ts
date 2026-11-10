import type { Theme } from "../types";

// The only writer of <html data-theme>. The scheduled skin (ThemeApplier) and the
// admin preview (SkinPreview) both go through here, so leaving the preview restores
// the scheduled skin instead of whatever the DOM held when the preview started.

let scheduled: Theme | null = null;
let preview: Theme | null | undefined; // undefined = no preview running

function write(theme: Theme | null) {
  const root = document.documentElement;
  if (theme) root.dataset.theme = theme;
  else delete root.dataset.theme;
}

export function setScheduledTheme(theme: Theme | null) {
  scheduled = theme;
  if (preview === undefined) write(theme);
}

/** Preview a skin (null = the default look); `undefined` ends the preview. */
export function setPreviewTheme(theme: Theme | null | undefined) {
  preview = theme;
  write(theme === undefined ? scheduled : theme);
}
