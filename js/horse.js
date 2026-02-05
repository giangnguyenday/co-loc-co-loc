import { HORSES } from "./horses.js";
import { init3D, renderOutcome } from "./core.js";

const canvas = document.getElementById("horseCanvas");
const errorBox = document.getElementById("errorBox");
const fortuneCarousel = document.getElementById("fortuneCarousel");
const fortuneDots = Array.from(document.querySelectorAll(".fortune-dot"));

init3D(canvas);

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

let scrollRaf = null;
function handleCarouselScroll() {
  if (!fortuneCarousel || !fortuneDots.length) {
    return;
  }
  if (scrollRaf) {
    return;
  }
  scrollRaf = window.requestAnimationFrame(() => {
    const width = fortuneCarousel.clientWidth || 1;
    const index = Math.round(fortuneCarousel.scrollLeft / width);
    setActiveDot(index);
    scrollRaf = null;
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
const id = params.get("horse") || params.get("id");

function showError(message) {
  if (!errorBox) {
    return;
  }
  errorBox.innerHTML = `${message} <a class="text-link" href="index.html">Back to shake</a>`;
  errorBox.classList.remove("hidden");
}

if (!id) {
  showError("Missing horse id.");
} else {
  const outcome = HORSES.find((horse) => horse.id === id);
  if (!outcome) {
    showError("Horse not found.");
  } else {
    renderOutcome(outcome);
  }
}
