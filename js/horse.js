import { HORSES } from "./horses.js";
import { renderOutcome } from "./core.js";
import { buildPreloaderFootprints, initPagePreloader } from "./preloader.js";

const fortuneCarousel = document.getElementById("fortuneCarousel");
const fortuneDots = Array.from(document.querySelectorAll(".fortune-dot"));
function setActiveDot(index) {
  if (!fortuneDots.length) {
    return;
  }
  const safeIndex = Math.max(0, Math.min(index, fortuneDots.length - 1));
  fortuneDots.forEach((dot, dotIndex) => {
    const isActive = dotIndex === safeIndex;
    dot.classList.toggle("is-active", isActive);
    if (isActive) {
      dot.setAttribute("aria-current", "true");
    } else {
      dot.removeAttribute("aria-current");
    }
  });
}

function scrollToSlide(index) {
  if (!fortuneCarousel) {
    return;
  }
  const width = fortuneCarousel.clientWidth || 1;
  fortuneCarousel.scrollTo({
    left: width * index,
    behavior: "smooth"
  });
}

let scrollRafId = null;
function handleCarouselScroll() {
  if (!fortuneCarousel || !fortuneDots.length) {
    return;
  }
  if (scrollRafId) {
    return;
  }
  scrollRafId = window.requestAnimationFrame(() => {
    const width = fortuneCarousel.clientWidth || 1;
    const index = Math.round(fortuneCarousel.scrollLeft / width);
    setActiveDot(index);
    scrollRafId = null;
  });
}

if (fortuneCarousel && fortuneDots.length) {
  fortuneCarousel.addEventListener("scroll", handleCarouselScroll, {
    passive: true
  });

  fortuneDots.forEach((dot) => {
    dot.addEventListener("click", () => {
      const index = Number(dot.dataset.slide || 0);
      scrollToSlide(index);
      setActiveDot(index);
    });
  });
}

buildPreloaderFootprints();
window.addEventListener("resize", buildPreloaderFootprints);

const params = new URLSearchParams(window.location.search);
const horseId = params.get("horse") || params.get("id");

function showMissingHorseId(message = "Missing horse ID.") {
  const preloader = document.getElementById("pagePreloader");
  if (preloader) {
    preloader.remove();
  }
  document.body.classList.remove("is-preloading");
  document.body.classList.add("is-horse-ready");
  document.body.textContent = message;
  document.body.style.cssText =
    "margin:0;display:flex;align-items:center;justify-content:center;height:100vh;background:#ffffff;color:var(--colors-primary-red);font-family:sans-serif;";
  window.requestAnimationFrame(() => {
    window.location.replace("index.html");
  });
}

function recordDiscovery(horseId) {
  if (!horseId) {
    return;
  }
  try {
    const raw = window.localStorage.getItem("tethorse.discoveredHorses");
    const parsed = raw ? JSON.parse(raw) : [];
    const list = Array.isArray(parsed) ? parsed : [];
    if (!list.includes(horseId)) {
      list.push(horseId);
      window.localStorage.setItem("tethorse.discoveredHorses", JSON.stringify(list));
    }
  } catch (error) {
    // ignore storage errors
  }
}

const preloader = initPagePreloader({ autoHide: false });
let contentReady = false;
let modelReady = false;

function maybeReveal() {
  if (!contentReady || !modelReady) {
    return;
  }
  if (document.body.classList.contains("is-horse-ready")) {
    return;
  }
  document.body.classList.add("is-horse-ready");
  document.body.classList.remove("is-preloading");
  preloader.hide();
}

if (!horseId) {
  showMissingHorseId("Missing horse ID.");
} else {
  const outcome = HORSES.find((horse) => horse.id === horseId);
  if (!outcome) {
    showMissingHorseId("Invalid horse ID.");
  } else {
    recordDiscovery(outcome.id);
    renderOutcome(outcome);
    contentReady = true;
    maybeReveal();

    const modelState = window.__horse3dLoadState;
    if (modelState === "rendered" || modelState === "failed") {
      modelReady = true;
      maybeReveal();
    } else {
      const markModelReady = () => {
        modelReady = true;
        maybeReveal();
      };
      window.addEventListener("horse3d:rendered", markModelReady, { once: true });
      window.addEventListener("horse3d:failed", markModelReady, { once: true });
      window.setTimeout(markModelReady, 3500);
    }
  }
}
