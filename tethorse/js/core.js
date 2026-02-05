let has3D = false;

function getDomRefs() {
  return {
    codeTop: document.getElementById("horseCodeTop"),
    codeName: document.getElementById("horseCodeName"),
    fortune: document.getElementById("horseFortune"),
    description: document.getElementById("horseDescription"),
    codeBottom: document.getElementById("horseCodeBottom"),
    designer: document.getElementById("horseDesigner"),
    loading: document.getElementById("loadingIndicator"),
    fallback: document.getElementById("modelFallback"),
    canvas: document.getElementById("horseCanvas")
  };
}

function dispatchLoadEvent(type) {
  window.dispatchEvent(new CustomEvent(`tethorse:${type}`));
}

export function init3D(canvasEl) {
  if (!canvasEl) {
    return;
  }
  has3D = false;
  const dom = getDomRefs();
  if (dom.fallback) {
    dom.fallback.textContent = "3D preview disabled for testing.";
    dom.fallback.classList.remove("hidden");
  }
  if (dom.loading) {
    dom.loading.classList.add("hidden");
  }
  if (dom.canvas) {
    dom.canvas.setAttribute("aria-hidden", "true");
  }
}

export function renderOutcome(outcome) {
  if (!outcome) {
    return;
  }
  setTheme(outcome.theme);
  setCopy(outcome);
  loadModel(outcome.model);
}

export function setTheme(themeCfg = {}) {
  const root = document.documentElement;
  if (themeCfg.bg) {
    root.style.setProperty("--horse-bg", themeCfg.bg);
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
}

export function setCopy(outcome) {
  const dom = getDomRefs();
  if (dom.codeTop) dom.codeTop.textContent = outcome.code || "";
  if (dom.codeName) dom.codeName.textContent = outcome.codeName || "";
  if (dom.fortune) dom.fortune.textContent = outcome.fortune || "";
  if (dom.description) dom.description.textContent = outcome.description || "";
  if (dom.codeBottom) dom.codeBottom.textContent = outcome.code || "";
  if (dom.designer) dom.designer.textContent = outcome.designer || "";
}

export function loadModel() {
  const dom = getDomRefs();
  dispatchLoadEvent("load-start");
  if (dom.loading) {
    dom.loading.classList.remove("hidden");
  }

  window.setTimeout(() => {
    if (dom.loading) {
      dom.loading.classList.add("hidden");
    }
    if (dom.fallback) {
      dom.fallback.classList.remove("hidden");
    }
    dispatchLoadEvent("load-end");
  }, 250);
}

export function cleanupModel() {
  if (!has3D) {
    return;
  }
}
