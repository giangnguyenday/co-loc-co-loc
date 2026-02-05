import { HORSES } from "./horses.js";
import { init3D, renderOutcome } from "./core.js";

const canvas = document.getElementById("horseCanvas");
const errorBox = document.getElementById("errorBox");

init3D(canvas);

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
