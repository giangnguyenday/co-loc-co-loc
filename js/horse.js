import { HORSES } from "./horses.js";
import { renderOutcome } from "./core.js";

const errorBox = document.getElementById("errorBox");
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

const params = new URLSearchParams(window.location.search);
const horseId = params.get("horse") || params.get("id");

function showError(message) {
  if (!errorBox) {
    return;
  }
  errorBox.innerHTML = `${message} <a class="text-link" href="index.html">Back to shake</a>`;
  errorBox.classList.remove("hidden");
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

if (!horseId) {
  showError("Missing horse id.");
} else {
  const outcome = HORSES.find((horse) => horse.id === horseId);
  if (!outcome) {
    showError("Horse not found.");
  } else {
    recordDiscovery(outcome.id);
    renderOutcome(outcome);
  }
}
