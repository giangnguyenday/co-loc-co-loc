const DEFAULT_FOOTPRINTS = Object.freeze({
  spacing: 40,
  minGap: 30,
  footprintWidth: 33,
  centerWidth: 57,
  delayStep: 0.12,
  desktopScale: 0.5,
  desktopBreakpoint: 1024
});

function getNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function buildPreloaderFootprints(preloader = document.getElementById("pagePreloader")) {
  if (!preloader) {
    return;
  }
  const track = preloader.querySelector(".preloader-track");
  if (!track) {
    return;
  }
  const template = track.querySelector("[data-footprint=\"template\"]");
  if (!template) {
    return;
  }

  const spacing = getNumber(preloader.dataset.footprintSpacing, DEFAULT_FOOTPRINTS.spacing);
  const minGap = getNumber(preloader.dataset.footprintMinGap, DEFAULT_FOOTPRINTS.minGap);
  const footprintWidth = getNumber(
    preloader.dataset.footprintWidth,
    DEFAULT_FOOTPRINTS.footprintWidth
  );
  const centerWidth = getNumber(
    preloader.dataset.footprintCenterWidth,
    DEFAULT_FOOTPRINTS.centerWidth
  );
  const delayStep = getNumber(preloader.dataset.footprintDelayStep, DEFAULT_FOOTPRINTS.delayStep);
  const desktopScale = getNumber(
    preloader.dataset.footprintDesktopScale,
    DEFAULT_FOOTPRINTS.desktopScale
  );
  const breakpoint = getNumber(
    preloader.dataset.footprintDesktopBreakpoint,
    DEFAULT_FOOTPRINTS.desktopBreakpoint
  );

  const templateNode = template.cloneNode(true);
  const width = preloader.clientWidth || window.innerWidth || 0;
  const spreadScale = width >= breakpoint ? desktopScale : 1;
  const maxOffset = Math.max(0, (width / 2) * spreadScale);
  const minOffset = minGap + (footprintWidth + centerWidth) / 2;
  const baseOffset = Math.min(minOffset, maxOffset);
  const available = Math.max(0, maxOffset - baseOffset);
  const count = Math.max(1, Math.floor(available / spacing) + 1);
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < count; i += 1) {
    const clone = templateNode.cloneNode(true);
    clone.removeAttribute("data-footprint");
    const offset = baseOffset + (count - 1 - i) * spacing;
    clone.style.setProperty("--offset", `${offset}px`);
    clone.style.setProperty("--delay", `${(i * delayStep).toFixed(2)}s`);
    fragment.appendChild(clone);
  }

  track.replaceChildren(fragment, templateNode);
}

export function initPagePreloader({
  autoHide = true,
  waitForLoad = true,
  waitFor3D = false,
  target = null
} = {}) {
  const preloader = document.getElementById("pagePreloader");
  if (!preloader) {
    return { hide: () => {} };
  }

  const targetElement =
    typeof target === "string" ? document.querySelector(target) : target;

  if (targetElement) {
    preloader.classList.add("page-preloader--local");
    targetElement.classList.add("preload-fade");
    targetElement.classList.remove("is-visible");
  }

  document.body.classList.add("is-preloading");
  let hidden = false;

  const finalizeHide = () => {
    if (hidden) {
      return;
    }
    hidden = true;
    preloader.classList.add("is-hidden");
    document.body.classList.remove("is-preloading");
    if (targetElement) {
      window.requestAnimationFrame(() => {
        targetElement.classList.add("is-visible");
        window.requestAnimationFrame(() => {
          window.dispatchEvent(new Event("resize"));
        });
      });
    }
    window.setTimeout(() => {
      preloader.remove();
    }, 500);
  };

  const hide = () => {
    if (hidden) {
      return;
    }
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(finalizeHide);
    });
  };

  if (autoHide) {
    let pageLoaded = !waitForLoad || document.readyState === "complete";
    let modelLoaded = !waitFor3D;

    const maybeHide = () => {
      if (pageLoaded && modelLoaded) {
        hide();
      }
    };

    if (!pageLoaded) {
      window.addEventListener(
        "load",
        () => {
          pageLoaded = true;
          maybeHide();
        },
        { once: true }
      );
    }

    if (waitFor3D) {
      const state = window.__horse3dLoadState;
      if (state === "rendered" || state === "failed") {
        modelLoaded = true;
      } else {
        const markReady = () => {
          modelLoaded = true;
          maybeHide();
        };
        window.addEventListener("horse3d:rendered", markReady, { once: true });
        window.addEventListener("horse3d:failed", markReady, { once: true });
      }
    }

    maybeHide();
  }

  return { hide, element: preloader };
}
