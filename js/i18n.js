const STORAGE_KEY = "tethorse.locale";
const DEFAULT_LOCALE = "vi";
let translations = null;
let currentLocale = null;
const listeners = new Set();

async function loadTranslations() {
  if (translations) {
    return translations;
  }
  try {
    const response = await fetch("js/i18n.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`i18n.json ${response.status}`);
    }
    translations = await response.json();
  } catch (error) {
    console.warn("Failed to load i18n.json", error);
    translations = { [DEFAULT_LOCALE]: {} };
  }
  return translations;
}

function normalizeLocale(locale) {
  if (!locale) {
    return DEFAULT_LOCALE;
  }
  const lower = locale.toLowerCase();
  if (lower.startsWith("vi")) {
    return "vi";
  }
  return "en";
}

function getStoredLocale() {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return normalizeLocale(value);
  } catch (error) {
    return null;
  }
}

function detectLocale() {
  return normalizeLocale(navigator.language || DEFAULT_LOCALE);
}

function getLocale() {
  return currentLocale || DEFAULT_LOCALE;
}

function t(key, fallback = "") {
  if (!translations) {
    return fallback || key;
  }
  const locale = getLocale();
  const dictionary = translations[locale] || {};
  const value = dictionary[key];
  if (value !== undefined) {
    return value;
  }
  const defaultDict = translations[DEFAULT_LOCALE] || {};
  return defaultDict[key] ?? fallback ?? key;
}

function applyTranslations(root = document) {
  if (!translations) {
    return;
  }
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (!key) return;
    el.textContent = t(key, el.textContent);
  });

  root.querySelectorAll("[data-i18n-html]").forEach((el) => {
    const key = el.getAttribute("data-i18n-html");
    if (!key) return;
    el.innerHTML = t(key, el.innerHTML);
  });

  root.querySelectorAll("[data-i18n-attr]").forEach((el) => {
    const mappings = el.getAttribute("data-i18n-attr");
    if (!mappings) return;
    mappings.split(",").forEach((pair) => {
      const [attr, key] = pair.split(":").map((part) => part.trim());
      if (!attr || !key) return;
      el.setAttribute(attr, t(key, el.getAttribute(attr) || ""));
    });
  });

  document.documentElement.lang = getLocale();
}

async function setLocale(locale) {
  const next = normalizeLocale(locale);
  currentLocale = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch (error) {
    // ignore storage errors
  }
  await loadTranslations();
  applyTranslations();
  listeners.forEach((fn) => fn(next));
}

function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

window.i18n = { t, setLocale, getLocale, onChange };

async function initI18n() {
  await loadTranslations();
  const params = new URLSearchParams(window.location.search);
  const queryLang = normalizeLocale(params.get("lang"));
  const stored = getStoredLocale();
  const initial = (params.has("lang") ? queryLang : null) || stored || detectLocale();
  await setLocale(initial);

  const toggle = document.getElementById("langToggle");
  if (toggle) {
    toggle.addEventListener("click", (event) => {
      event.preventDefault();
      const next = getLocale() === "en" ? "vi" : "en";
      setLocale(next);
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initI18n);
} else {
  initI18n();
}

export { t, setLocale, getLocale, onChange };
