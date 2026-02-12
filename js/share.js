const shareButton = document.querySelector(".share-button");
const HORSE_IDS = new Set(["01", "02", "03", "04", "05", "06", "07"]);

if (shareButton) {
  shareButton.addEventListener("click", async () => {
    if (shareButton.disabled) return;
    shareButton.disabled = true;
    shareButton.setAttribute("aria-busy", "true");
    try {
      await downloadShareImage();
    } catch (error) {
      console.error("Share image failed:", error);
    } finally {
      shareButton.disabled = false;
      shareButton.removeAttribute("aria-busy");
    }
  });
}

async function downloadShareImage() {
  const horseId = resolveHorseId();
  const filename = `behalf2026.${horseId}.png`;
  const path = `assets/img/${filename}`;
  const shared = await tryNativeShare(path, filename);
  if (!shared) {
    triggerDownload(path, filename);
  }
}

function resolveHorseId() {
  const params = new URLSearchParams(window.location.search);
  const horseParam = params.get("horse") || params.get("id") || "";
  const normalized = horseParam.trim().toLowerCase();
  const horseKey = /^\d+$/.test(normalized)
    ? normalized.padStart(2, "0")
    : normalized;
  if (HORSE_IDS.has(horseKey)) {
    return horseKey;
  }
  if (HORSE_IDS.has(normalized)) {
    return normalized;
  }
  return "01";
}

function triggerDownload(path, filename) {
  const link = document.createElement("a");
  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.userAgent.includes("Mac") && "ontouchend" in document);
  link.href = path;
  if (!isIOS && "download" in link) {
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } else {
    window.open(path, "_blank");
  }
}

async function tryNativeShare(path, filename) {
  if (!navigator.share || !navigator.canShare) {
    return false;
  }
  try {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) {
      return false;
    }
    const blob = await response.blob();
    const file = new File([blob], filename, { type: "image/png" });
    if (!navigator.canShare({ files: [file] })) {
      return false;
    }
    await navigator.share({
      files: [file],
      title: "Behalf 2026",
    });
    return true;
  } catch (error) {
    console.warn("Native share failed:", error);
    return false;
  }
}
