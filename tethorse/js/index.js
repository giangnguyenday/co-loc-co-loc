import { HORSES } from "./horses.js";

const SHAKE_THRESHOLD = 24;
const COOLDOWN_MS = 1200;
const MOTION_KEY = "tethorse.motionGranted";
const MOTION_DENIED_KEY = "tethorse.motionDenied";

const enableMotionBtn = document.getElementById("enableMotionBtn");
const tapDrawBtn = document.getElementById("tapDrawBtn");
const motionCta = document.getElementById("motionCta");
const motionStatus = document.getElementById("motionStatus");
const motionModal = document.getElementById("motionModal");
const closeMotionBtn = document.getElementById("closeMotionBtn");

let lastTrigger = 0;
let armed = true;
let motionEnabled = false;

const supportsMotion = "DeviceMotionEvent" in window;
const needsPermission =
  supportsMotion && typeof DeviceMotionEvent.requestPermission === "function";
const isMobile =
  typeof navigator !== "undefined" &&
  ((navigator.userAgentData && navigator.userAgentData.mobile) ||
    /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent));

function setStatus(message) {
  if (motionStatus) {
    motionStatus.textContent = message;
  }
}

function showPressButton() {
  tapDrawBtn.classList.remove("hidden");
  hideMotionCta();
}

function hidePressButton() {
  tapDrawBtn.classList.add("hidden");
}

function showMotionCta() {
  motionCta?.classList.remove("hidden");
}

function hideMotionCta() {
  motionCta?.classList.add("hidden");
}

function chooseRandomHorse() {
  return HORSES[Math.floor(Math.random() * HORSES.length)];
}

function goToHorse(outcome) {
  const revealUrl = new URL("horse.html", window.location.href);
  revealUrl.searchParams.set("horse", outcome.id);
  window.location.href = revealUrl.toString();
}

function triggerDraw() {
  if (!armed) {
    return;
  }
  armed = false;
  tapDrawBtn.disabled = true;
  const outcome = chooseRandomHorse();
  goToHorse(outcome);
}

function handleMotion(event) {
  if (!armed) {
    return;
  }
  const acc = event.accelerationIncludingGravity;
  if (!acc) {
    return;
  }
  const x = acc.x || 0;
  const y = acc.y || 0;
  const z = acc.z || 0;
  const magnitude = Math.sqrt(x * x + y * y + z * z);
  const now = Date.now();
  if (magnitude > SHAKE_THRESHOLD && now - lastTrigger > COOLDOWN_MS) {
    lastTrigger = now;
    triggerDraw();
  }
}

function startMotion() {
  if (motionEnabled) {
    return;
  }
  window.addEventListener("devicemotion", handleMotion, { passive: true });
  motionEnabled = true;
  setStatus("");
  hidePressButton();
  showMotionCta();
  hideMotionModal();
}

async function requestMotionPermission() {
  try {
    const response = await DeviceMotionEvent.requestPermission();
    if (response === "granted") {
      setMotionGranted();
      clearMotionDenied();
      startMotion();
      return;
    }
    setStatus("Motion access denied.");
    setMotionDenied();
    showPressButton();
  } catch (error) {
    setStatus("Motion access unavailable.");
    setMotionDenied();
    showPressButton();
  }

  hideMotionModal();
}

function setupMotionUI() {
  if (!isMobile || !supportsMotion) {
    setStatus("");
    showPressButton();
    hideMotionCta();
    hideMotionModal();
    return;
  }

  if (needsPermission) {
    if (isMotionGranted()) {
      startMotion();
      return;
    }

    if (isMotionDenied()) {
      setStatus("");
      showPressButton();
      hideMotionCta();
      hideMotionModal();
      return;
    }

    setStatus("Enable motion access to use shake.");
    if (!isMotionGranted()) {
      showPressButton();
      hideMotionCta();
      showMotionModal();
    } else {
      startMotion();
    }
    return;
  }

  startMotion();
}

function isMotionGranted() {
  try {
    return window.localStorage.getItem(MOTION_KEY) === "true";
  } catch (error) {
    return false;
  }
}

function setMotionGranted() {
  try {
    window.localStorage.setItem(MOTION_KEY, "true");
  } catch (error) {
    // ignore storage errors
  }
}

function isMotionDenied() {
  try {
    return window.sessionStorage.getItem(MOTION_DENIED_KEY) === "true";
  } catch (error) {
    return false;
  }
}

function setMotionDenied() {
  try {
    window.sessionStorage.setItem(MOTION_DENIED_KEY, "true");
  } catch (error) {
    // ignore storage errors
  }
}

function clearMotionDenied() {
  try {
    window.sessionStorage.removeItem(MOTION_DENIED_KEY);
  } catch (error) {
    // ignore storage errors
  }
}

function showMotionModal() {
  motionModal?.classList.remove("hidden");
}

function hideMotionModal() {
  motionModal?.classList.add("hidden");
}

enableMotionBtn.addEventListener("click", requestMotionPermission);
closeMotionBtn?.addEventListener("click", hideMotionModal);
motionModal?.addEventListener("click", (event) => {
  const target = event.target;
  if (target && target.matches("[data-close=\"true\"]")) {
    setMotionDenied();
    setStatus("");
    showPressButton();
    hideMotionCta();
    hideMotionModal();
  }
});

tapDrawBtn.addEventListener("click", () => {
  triggerDraw();
});

setupMotionUI();
