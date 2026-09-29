import type { i18n as I18n } from 'i18next';
import { axiosInstance } from '../store/api/axiosInstance';
import { API_ENDPOINTS } from '../store/api/endpoints';

/**
 * Site-wide machine translation for the Hindi setting.
 *
 * Most of the UI is written as plain English JSX, not i18n keys, so switching
 * `i18n.language` alone leaves the bulk of the site in English. While Hindi is
 * active this walks the rendered DOM — text, placeholders, tooltips, aria
 * labels — sends unseen English strings to the backend (which calls Google
 * Translate and caches), and swaps them in place. A MutationObserver keeps up
 * with React re-renders, dialogs and route changes. Switching back to English
 * restores every original string.
 *
 * Only Text node data and attributes are changed — never element structure —
 * so React's reconciliation is unaffected: when React later writes new
 * English into a node, the observer sees it and translates that too.
 *
 * Opt a subtree out with `data-no-translate` or the `notranslate` class.
 */

const TARGET = 'hi';
const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'] as const;
// Compared upper-cased: SVG elements (e.g. an inline <style>) report a lower-case tagName.
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE', 'PRE', 'KBD']);
const isSkipTag = (el: Element) => SKIP_TAGS.has(el.tagName.toUpperCase());
const STORAGE_KEY = `ets-translations:${TARGET}`;
const STORAGE_LIMIT = 6000;
const BATCH_SIZE = 150;
const FLUSH_DELAY = 60;
// Words that must stay as written (brand names).
const KEEP = new Set(['VetsLinked', 'VetBot', 'VetJobs']);

const DEVANAGARI = /[ऀ-ॿ]/;
const LATIN = /[A-Za-z]/;
const EMAIL_OR_URL = /^(\S+@\S+\.\S+|https?:\/\/\S+|www\.\S+)$/i;

type TextState = { orig: string; tr: string | null };

// Loop guard: if something else keeps rewriting a node we translate (a widget
// that re-measures text and re-renders it), give up on that node instead of
// ping-ponging with it forever.
const WRITE_LIMIT = 12;
const writes = new WeakMap<Node, number>();
const canWrite = (node: Node) => {
  const count = (writes.get(node) ?? 0) + 1;
  writes.set(node, count);
  return count <= WRITE_LIMIT;
};

let active = false;
let observer: MutationObserver | null = null;
let flushTimer: ReturnType<typeof setTimeout> | null = null;

const cache = new Map<string, string>();
const pending = new Set<string>();
const inFlight = new Set<string>();

const textState = new WeakMap<Text, TextState>();
const attrState = new WeakMap<Element, Map<string, TextState>>();
// Strong sets only so English can be restored; detached nodes are pruned.
const touchedText = new Set<Text>();
const touchedAttr = new Set<Element>();
// Nodes waiting for a translation that is being fetched.
const waitingText = new Set<Text>();
const waitingAttr = new Set<Element>();

function loadCache() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const entries = JSON.parse(raw) as Array<[string, string]>;
    entries.forEach(([source, translated]) => cache.set(source, translated));
  } catch {
    // Storage blocked or corrupt — start empty.
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
function saveCache() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      const entries = [...cache.entries()].slice(-STORAGE_LIMIT);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // Quota exceeded or storage blocked — the in-memory cache still works.
    }
  }, 1000);
}

/** The translatable core of a string, or null when it should be left alone. */
function core(value: string): string | null {
  const text = value.trim();
  // 5000 matches the backend limit (and the longest job description).
  if (!text || text.length > 5000) return null;
  if (!LATIN.test(text) || DEVANAGARI.test(text)) return null;
  if (EMAIL_OR_URL.test(text) || KEEP.has(text)) return null;
  return text;
}

/** Re-applies the original's surrounding whitespace to the translation. */
function withPadding(original: string, text: string, translated: string) {
  const start = original.indexOf(text);
  return original.slice(0, start) + translated + original.slice(start + text.length);
}

function isSkipped(element: Element | null): boolean {
  for (let el = element; el; el = el.parentElement) {
    if (isSkipTag(el)) return true;
    if (el.hasAttribute('data-no-translate') || el.classList.contains('notranslate')) return true;
    if ((el as HTMLElement).isContentEditable) return true;
  }
  return false;
}

// After a failed request (rate limit, network) the next flush waits this long,
// doubling up to the cap, so waiting nodes retry without hammering the API.
const RETRY_MIN = 2000;
const RETRY_MAX = 30000;
let retryDelay = 0;

function request(text: string) {
  if (cache.has(text) || inFlight.has(text)) return;
  pending.add(text);
  if (!flushTimer) flushTimer = setTimeout(flush, retryDelay || FLUSH_DELAY);
}

async function flush() {
  flushTimer = null;
  const texts = [...pending];
  pending.clear();
  if (!texts.length) return;

  for (let start = 0; start < texts.length; start += BATCH_SIZE) {
    const batch = texts.slice(start, start + BATCH_SIZE);
    batch.forEach((text) => inFlight.add(text));
    try {
      const { data } = await axiosInstance.post<{ data: { translations: string[] } }>(
        API_ENDPOINTS.translate,
        { target: TARGET, texts: batch },
      );
      batch.forEach((text, index) => cache.set(text, data.data.translations[index] ?? text));
      saveCache();
      retryDelay = 0;
    } catch {
      // Leave the English in place; the waiting nodes below re-request these
      // strings, and the backoff spaces that retry out.
      retryDelay = Math.min(retryDelay ? retryDelay * 2 : RETRY_MIN, RETRY_MAX);
      break;
    } finally {
      batch.forEach((text) => inFlight.delete(text));
    }
  }

  if (!active) return;
  // Snapshot first: applyText re-queues nodes whose text is still in flight,
  // and iterating a Set that grows while you walk it never ends.
  [...waitingText].forEach((node) => applyText(node));
  [...waitingAttr].forEach((el) => applyAttrs(el));
}

function applyText(node: Text) {
  waitingText.delete(node);
  if (!active || !node.isConnected) return;

  const current = node.data;
  let state = textState.get(node);
  // Our own write coming back through the observer.
  if (state && state.tr === current) return;
  // New English from React (or first sighting): it becomes the original.
  if (!state || state.orig !== current) {
    state = { orig: current, tr: null };
    textState.set(node, state);
  }

  const text = core(current);
  if (!text || isSkipped(node.parentElement)) return;

  const translated = cache.get(text);
  if (translated === undefined) {
    request(text);
    waitingText.add(node);
    return;
  }
  const next = withPadding(current, text, translated);
  state.tr = next;
  touchedText.add(node);
  if (node.data !== next && canWrite(node)) node.data = next;
}

function applyAttrs(el: Element) {
  waitingAttr.delete(el);
  // A <textarea>'s *content* is user input and stays as typed, but its
  // placeholder / title / aria-label are UI copy and still get translated.
  const scope = el.tagName.toUpperCase() === 'TEXTAREA' ? el.parentElement : el;
  if (!active || !el.isConnected || isSkipped(scope)) return;

  let states = attrState.get(el);
  for (const name of ATTRS) {
    const current = el.getAttribute(name);
    if (current === null) continue;

    let state = states?.get(name);
    if (state && state.tr === current) continue;
    if (!state || state.orig !== current) {
      if (!states) {
        states = new Map();
        attrState.set(el, states);
      }
      state = { orig: current, tr: null };
      states.set(name, state);
    }

    const text = core(current);
    if (!text) continue;
    const translated = cache.get(text);
    if (translated === undefined) {
      request(text);
      waitingAttr.add(el);
      continue;
    }
    const next = withPadding(current, text, translated);
    state.tr = next;
    touchedAttr.add(el);
    if (current !== next && canWrite(el)) el.setAttribute(name, next);
  }
}

function scan(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) {
    applyText(root as Text);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;
  if (root.nodeType === Node.ELEMENT_NODE) {
    applyAttrs(root as Element);
    if (isSkipped(root as Element)) return;
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      node.nodeType === Node.ELEMENT_NODE && isSkipTag(node as Element)
        ? (applyAttrs(node as Element), NodeFilter.FILTER_REJECT)
        : NodeFilter.FILTER_ACCEPT,
  });
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.nodeType === Node.TEXT_NODE) applyText(node as Text);
    else applyAttrs(node as Element);
  }
}

const dirty = new Set<Node>();
const dirtyAttrs = new Set<Element>();
let processScheduled = false;

function processDirty() {
  processScheduled = false;
  if (!active) {
    dirty.clear();
    dirtyAttrs.clear();
    return;
  }
  const nodes = [...dirty];
  const attrNodes = [...dirtyAttrs];
  dirty.clear();
  dirtyAttrs.clear();
  attrNodes.forEach((el) => applyAttrs(el));
  nodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) applyText(node as Text);
    else if (node.nodeType === Node.ELEMENT_NODE) scan(node);
  });
}

function start() {
  if (active || typeof document === 'undefined') return;
  active = true;
  scan(document.body);
  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') mutation.addedNodes.forEach((node) => dirty.add(node));
      else if (mutation.type === 'attributes') dirtyAttrs.add(mutation.target as Element);
      else dirty.add(mutation.target);
    }
    // Handled on the next frame, never inside the observer's microtask, so a
    // feedback loop with another observer cannot starve the event loop.
    if (!processScheduled) {
      processScheduled = true;
      requestAnimationFrame(processDirty);
    }
  });
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: [...ATTRS],
  });
}

function stop() {
  if (!active) return;
  active = false;
  observer?.disconnect();
  observer = null;
  dirty.clear();
  dirtyAttrs.clear();
  waitingText.clear();
  waitingAttr.clear();

  touchedText.forEach((node) => {
    const state = textState.get(node);
    // Only undo our own write; if React has since replaced it, keep React's text.
    if (state && node.isConnected && node.data === state.tr) node.data = state.orig;
    textState.delete(node);
  });
  touchedText.clear();

  touchedAttr.forEach((el) => {
    attrState.get(el)?.forEach((state, name) => {
      if (el.isConnected && el.getAttribute(name) === state.tr) el.setAttribute(name, state.orig);
    });
    attrState.delete(el);
  });
  touchedAttr.clear();
}

/** Wires the translator to i18next: on while the language is Hindi, off otherwise. */
export function initAutoTranslate(i18n: I18n) {
  loadCache();
  const sync = (lng?: string) => {
    if ((lng ?? i18n.resolvedLanguage ?? i18n.language ?? 'en').startsWith(TARGET)) start();
    else stop();
  };
  // The DOM must exist before the first scan.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => sync(), { once: true });
  } else {
    sync();
  }
  i18n.on('languageChanged', sync);
}
