/**
 * Runtime translation mask.
 *
 * Most of the twelve game pages still hold their copy as hardcoded English JSX.
 * Rather than thread ~230 strings through t() across 31 files, this walks the
 * rendered DOM and swaps whole text nodes that exactly match a dictionary entry.
 *
 * Deliberate constraints, because a DOM-level mask is easy to get wrong:
 *
 *  - Only ever replaces a text node whose *entire* trimmed content matches a
 *    key. No substring replacement, so a country called "Best" or a value like
 *    "5 Rounds" can never be partially mangled.
 *  - Remembers the original text per node, so switching back to English
 *    restores exactly what React rendered.
 *  - Re-applies on DOM mutations, because React owns these nodes and will
 *    overwrite them whenever it re-renders.
 *  - Skips form fields and anything the user is editing.
 *
 * This is a bridge, not a destination: strings should still migrate into the
 * locale files over time. Anything moved to t() can simply be deleted here.
 */

import { DE_UI_MASK } from './uiMask.de';

/** Attribute values worth translating (placeholders, tooltips, labels). */
const MASKED_ATTRIBUTES = ['placeholder', 'title', 'aria-label'] as const;

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE', 'PRE']);

/** Original English text, so switching back is lossless. */
const originalText = new WeakMap<Text, string>();
const originalAttr = new WeakMap<Element, Map<string, string>>();

let dictionary: Record<string, string> = {};
let observer: MutationObserver | null = null;
let applying = false;
let queued = false;

function shouldSkip(node: Node | null): boolean {
  let el = node instanceof Element ? node : node?.parentElement ?? null;
  while (el) {
    if (SKIP_TAGS.has(el.tagName)) return true;
    if (el instanceof HTMLElement && el.isContentEditable) return true;
    if (el.getAttribute('translate') === 'no') return true;
    el = el.parentElement;
  }
  return false;
}

function translateTextNodes(root: Node) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const pending: Array<[Text, string]> = [];

  let current = walker.nextNode() as Text | null;
  while (current) {
    const node = current;
    current = walker.nextNode() as Text | null;

    if (shouldSkip(node)) continue;

    const raw = originalText.get(node) ?? node.nodeValue ?? '';
    const key = raw.trim();
    if (!key) continue;

    const translated = dictionary[key];
    if (translated === undefined) {
      // Node previously translated but no longer in the dictionary: restore.
      const original = originalText.get(node);
      if (original !== undefined && node.nodeValue !== original) {
        pending.push([node, original]);
      }
      continue;
    }

    if (!originalText.has(node)) originalText.set(node, raw);
    // Preserve the surrounding whitespace React emitted.
    const next = raw.replace(key, translated);
    if (node.nodeValue !== next) pending.push([node, next]);
  }

  for (const [node, value] of pending) node.nodeValue = value;
}

function translateAttributes(root: Node) {
  if (!(root instanceof Element) && !(root instanceof Document)) return;
  const scope = root instanceof Element ? root : document.body;
  const elements = [scope, ...Array.from(scope.querySelectorAll('*'))] as Element[];

  for (const el of elements) {
    if (SKIP_TAGS.has(el.tagName)) continue;
    for (const attr of MASKED_ATTRIBUTES) {
      const raw = originalAttr.get(el)?.get(attr) ?? el.getAttribute(attr);
      if (!raw) continue;
      const translated = dictionary[raw.trim()];
      if (translated === undefined) continue;

      let store = originalAttr.get(el);
      if (!store) { store = new Map(); originalAttr.set(el, store); }
      if (!store.has(attr)) store.set(attr, raw);

      if (el.getAttribute(attr) !== translated) el.setAttribute(attr, translated);
    }
  }
}

function restoreAll() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode() as Text | null;
  while (node) {
    const original = originalText.get(node);
    if (original !== undefined && node.nodeValue !== original) node.nodeValue = original;
    node = walker.nextNode() as Text | null;
  }

  for (const el of Array.from(document.querySelectorAll('*'))) {
    const store = originalAttr.get(el);
    if (!store) continue;
    for (const [attr, value] of store) el.setAttribute(attr, value);
  }
}

function apply() {
  if (applying) return;
  applying = true;

  // Detach while writing. Our own edits are mutations too, and reacting to them
  // would make the observer and this function chase each other indefinitely.
  observer?.disconnect();
  try {
    translateTextNodes(document.body);
    translateAttributes(document.body);
  } finally {
    applying = false;
    connectObserver();
  }
}

function connectObserver() {
  if (!observer || Object.keys(dictionary).length === 0) return;
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}

function schedule() {
  // Always queue, even mid-apply: React re-renders constantly and dropping a
  // mutation here means that content simply never gets translated.
  if (queued) return;
  queued = true;
  // setTimeout rather than requestAnimationFrame: rAF does not fire while the
  // tab is hidden, which would leave a backgrounded page in English until it
  // was focused again.
  window.setTimeout(() => {
    queued = false;
    apply();
  }, 0);
}

/**
 * Point the mask at a language. Pass 'en' (or anything without a dictionary) to
 * restore the original text.
 */
export function setMaskLanguage(language: string) {
  if (typeof document === 'undefined') return;

  const next = language === 'de' ? DE_UI_MASK : {};
  const hadDictionary = Object.keys(dictionary).length > 0;
  dictionary = next;

  if (Object.keys(next).length === 0) {
    observer?.disconnect();
    observer = null;
    if (hadDictionary) restoreAll();
    return;
  }

  apply();

  if (!observer) {
    observer = new MutationObserver(() => schedule());
  }
  connectObserver();

  // React may not have rendered yet when the language is set at startup, so run
  // once more on the next frame to catch the first paint.
  schedule();
}
