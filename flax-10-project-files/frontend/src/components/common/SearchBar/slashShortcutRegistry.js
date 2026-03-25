/*
 * Module-level registry for slash-key shortcut focus targets.
 */

const shortcutTargets = new Set();
let shortcutListenerAttached = false;

function isEditableTarget(target) {
  const tag = target?.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable === true;
}

function getVisibleTargets() {
  return Array.from(shortcutTargets)
    .filter((el) => el && el.isConnected && !el.disabled && !el.readOnly && el.offsetParent !== null);
}

function pickPrimaryTarget(targets) {
  if (!targets.length) return null;
  return targets
    .map((el) => ({ el, rect: el.getBoundingClientRect() }))
    .sort((a, b) => (a.rect.top - b.rect.top) || (a.rect.left - b.rect.left))[0].el;
}

function handleSlashShortcut(event) {
  if (event.key !== "/") return;
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  if (isEditableTarget(event.target)) return;
  const target = pickPrimaryTarget(getVisibleTargets());
  if (!target) return;
  event.preventDefault();
  target.focus();
}

function syncShortcutListener() {
  if (!shortcutListenerAttached && shortcutTargets.size > 0) {
    document.addEventListener("keydown", handleSlashShortcut);
    shortcutListenerAttached = true;
    return;
  }
  if (shortcutListenerAttached && shortcutTargets.size === 0) {
    document.removeEventListener("keydown", handleSlashShortcut);
    shortcutListenerAttached = false;
  }
}

export function registerTarget(node) {
  shortcutTargets.add(node);
  syncShortcutListener();
}

export function unregisterTarget(node) {
  shortcutTargets.delete(node);
  syncShortcutListener();
}
