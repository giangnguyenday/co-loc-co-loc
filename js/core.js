function getDomRefs() {
  return {
    codeTop: document.getElementById("horseCodeTop"),
    codeName: document.getElementById("horseCodeName"),
    fortune: document.getElementById("horseFortune"),
    description: document.getElementById("horseDescription"),
    codeBottom: document.getElementById("horseCodeBottom"),
    designer: document.getElementById("horseDesigner")
  };
}

let currentOutcome = null;

function getLocale() {
  if (typeof window !== "undefined" && window.i18n?.getLocale) {
    return window.i18n.getLocale();
  }
  return "en";
}

function getLocalizedValue(value) {
  if (!value || typeof value !== "object") {
    return value ?? "";
  }
  const locale = getLocale();
  return value[locale] ?? value.en ?? value.vi ?? "";
}

function getDesignerLabel() {
  if (typeof window !== "undefined" && window.i18n?.t) {
    return window.i18n.t("label.designer", "DESIGNER");
  }
  return "DESIGNER";
}

function getCodeLabel() {
  if (typeof window !== "undefined" && window.i18n?.t) {
    return window.i18n.t("label.code", "CODE");
  }
  return "CODE";
}

export function renderOutcome(outcome) {
  if (!outcome) {
    return;
  }
  currentOutcome = outcome;
  setTheme(outcome.theme);
  setCopy(outcome);
}

export function setTheme(themeCfg = {}) {
  const root = document.documentElement;
  if (themeCfg.bg) {
    root.style.setProperty("--horse-bg", themeCfg.bg);
  }
  if (themeCfg.bgSolid) {
    root.style.setProperty("--horse-bg-solid", themeCfg.bgSolid);
  } else if (themeCfg.bg) {
    if (themeCfg.bg.includes("gradient")) {
      const vars = themeCfg.bg.match(/var\([^)]+\)/g) || [];
      const firstVar = vars[0];
      const lastVar = vars[vars.length - 1];
      if (firstVar) {
        root.style.setProperty("--horse-bg-top", firstVar);
        root.style.setProperty("--horse-bg-solid", firstVar);
      }
      if (lastVar) {
        root.style.setProperty("--horse-bg-bottom", lastVar);
      }
    } else {
      root.style.setProperty("--horse-bg-solid", themeCfg.bg);
      root.style.setProperty("--horse-bg-top", themeCfg.bg);
      root.style.setProperty("--horse-bg-bottom", themeCfg.bg);
    }
  }
  if (themeCfg.text) {
    root.style.setProperty("--horse-text", themeCfg.text);
  }

  const pattern = themeCfg.pattern || "";
  if (pattern) {
    document.body.setAttribute("data-pattern", pattern);
  } else {
    document.body.removeAttribute("data-pattern");
  }

  syncThemeColor();
}

function resolveThemeColor() {
  const rootStyles = getComputedStyle(document.documentElement);
  let color = rootStyles.getPropertyValue("--horse-bg-top").trim();
  if (!color) {
    color = rootStyles.getPropertyValue("--horse-bg-solid").trim();
  }
  if (color.startsWith("var(")) {
    const varName = color.slice(4, -1).trim();
    const resolved = rootStyles.getPropertyValue(varName).trim();
    if (resolved) {
      color = resolved;
    }
  }
  if (!color || color.includes("gradient")) {
    color = rootStyles.getPropertyValue("--colors-white").trim() || "#ffffff";
  }
  return color;
}

function syncThemeColor() {
  const meta = document.querySelector("meta[name=\"theme-color\"]");
  if (!meta) {
    return;
  }
  const color = resolveThemeColor();
  meta.setAttribute("content", color || "#ffffff");
}

export function setCopy(outcome) {
  const dom = getDomRefs();
  if (dom.codeTop) {
    const raw = outcome.code || "";
    const normalized = raw.replace(/^CODE\\s*/i, "");
    const label = getCodeLabel();
    dom.codeTop.textContent = normalized ? `${label} ${normalized}` : raw;
  }
  if (dom.codeName) dom.codeName.textContent = outcome.codeName || "";
  if (dom.fortune) dom.fortune.textContent = getLocalizedValue(outcome.fortune);
  if (dom.description) dom.description.textContent = getLocalizedValue(outcome.description);
  if (dom.codeBottom) dom.codeBottom.textContent = getDesignerLabel();
  if (dom.designer) dom.designer.textContent = outcome.designer || "";
}

if (typeof window !== "undefined" && window.i18n?.onChange) {
  window.i18n.onChange(() => {
    if (currentOutcome) {
      setCopy(currentOutcome);
    }
  });
}
