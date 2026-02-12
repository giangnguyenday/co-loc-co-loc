import { HORSES } from "./horses.js";
import { initPagePreloader } from "./preloader.js";

const t = (key, fallback) => {
  if (typeof window === "undefined") {
    return fallback;
  }
  const i18n = window.i18n;
  return i18n && typeof i18n.t === "function" ? i18n.t(key, fallback) : fallback;
};

const REPEATABLE = true;
const SHAKE_THRESHOLD = 24;
const COOLDOWN_MS = 1200;
const MOTION_KEY = "tethorse.motionGranted";
const DISCOVERED_KEY = "tethorse.discoveredHorses";
const FLOWER_TOTAL = 15;
const FLOWER_FALL_INTERVAL = 12000;
const FLOWER_FALL_DURATION = 4000;
const FLOWER_FALL_BOTTOM_RATIO = 0.96;
const HORSE_DANGLE_INTERVAL = 4000; // interval between horse dangles
const HORSE_DANGLE_DURATION_MIN = 1200; // min duration of a horse dangle
const HORSE_DANGLE_DURATION_MAX = 6000; // max duration of a horse dangle
const HORSE_GRAVITY_MAX_ANGLE = 90;
const HORSE_GRAVITY_SMOOTHING = 0.12;
const HORSE_GRAVITY_CSS_VAR = "--horse-gravity-rotation";
const HORSE_IDS = HORSES.map((horse) => horse.id);
const secretHorse = HORSES.find((horse) => horse.secret);
const SECRET_HORSE_ID = secretHorse ? secretHorse.id : null;
const NON_SECRET_IDS = HORSES.filter((horse) => !horse.secret).map((horse) => horse.id);

const dom = {
  enableMotionButton: document.getElementById("enableMotionButton"),
  drawFortuneButton: document.getElementById("drawFortuneBtn"),
  motionStatusText: document.getElementById("motionStatusText"),
  motionPrompt: document.getElementById("motionPrompt"),
  closeMotionButton: document.getElementById("closeMotionButton"),
  shakeIcon: document.querySelector(".shake-icon")
};

const SHAKE_ICON_VI = dom.shakeIcon ? dom.shakeIcon.innerHTML.trim() : "";
const SHAKE_ICON_EN = `<svg width="130" height="130" viewBox="0 0 130 130" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<path d="M0 65C0 29.1015 29.1015 0 65 0V0C100.899 0 130 29.1015 130 65V65C130 100.899 100.899 130 65 130V130C29.1015 130 0 100.899 0 65V65Z" fill="#D50B0B"/>
<path d="M118.982 76.6591L109.076 75.1274L110.005 69.1228L111.734 69.3902L111.085 73.5893L117.532 74.5861L118.193 70.3109L119.923 70.5783L118.982 76.6591ZM114.965 75.018L113.409 74.7773L114.15 69.9833L115.706 70.2239L114.965 75.018Z" fill="white"/>
<path d="M114.923 88.5869L105.516 85.1249L106.205 83.2527L114.079 81.5559L114.096 81.5099L112.408 80.9484L107.691 79.2126L108.32 77.5045L117.727 80.9665L117.125 82.6022L108.888 84.434L108.871 84.48L110.552 85.0391L115.551 86.8788L114.923 88.5869Z" fill="white"/>
<path d="M110.908 95.8483C110.255 96.8491 109.419 97.4402 108.398 97.6216C107.38 97.799 106.373 97.5628 105.376 96.9129L100.174 93.5221L101.191 91.9623L106.422 95.3722C107.02 95.7621 107.589 95.9187 108.129 95.842C108.672 95.7613 109.119 95.4512 109.471 94.9118C109.823 94.3723 109.926 93.8379 109.781 93.3087C109.638 92.7756 109.268 92.3141 108.67 91.9242L103.439 88.5143L104.444 86.9721L109.646 90.3628C110.67 91.0306 111.302 91.8602 111.541 92.8518C111.779 93.837 111.568 94.8358 110.908 95.8483Z" fill="white"/>
<path d="M103.044 104.958L96.5757 98.5472L97.8866 97.2248L104.354 103.636L103.044 104.958ZM95.2307 101.087L93.9878 99.8554L99.1621 94.6354L100.405 95.8674L95.2307 101.087Z" fill="white"/>
<path d="M92.8802 112.709L87.2285 104.43L90.3331 102.311C91.1039 101.785 91.9255 101.577 92.7978 101.688C93.6675 101.795 94.3668 102.236 94.8957 103.01C95.4088 103.762 95.567 104.561 95.3705 105.407C95.1753 106.246 94.6517 106.957 93.8 107.539L91.4412 109.149L90.6361 107.969L92.9312 106.403C93.3051 106.147 93.5414 105.802 93.6402 105.368C93.7389 104.933 93.6541 104.519 93.3858 104.126C93.1437 103.771 92.8094 103.559 92.3827 103.488C91.9561 103.418 91.5636 103.505 91.2051 103.75L89.7136 104.768L94.418 111.659L92.8802 112.709ZM97.459 109.584L92.4484 107.52L94.0566 106.338L99.2743 108.344L97.459 109.584Z" fill="white"/>
<path d="M84.4712 116.625C83.1267 117.146 81.8044 117.131 80.5043 116.579C79.2085 116.025 78.2822 115.03 77.7255 113.594C77.1687 112.159 77.1861 110.803 77.7777 109.528C78.3736 108.25 79.3373 107.354 80.6687 106.837C82.0001 106.321 83.315 106.337 84.6135 106.884C85.9163 107.43 86.8444 108.417 87.3978 109.844C87.9478 111.262 87.9326 112.617 87.3521 113.908C86.7716 115.2 85.8113 116.105 84.4712 116.625ZM83.8118 114.943C84.6907 114.603 85.3057 114.014 85.6569 113.177C86.0125 112.338 86.0097 111.453 85.6487 110.522C85.2843 109.582 84.6884 108.93 83.8612 108.565C83.0383 108.198 82.1918 108.184 81.3216 108.521C80.4557 108.857 79.8412 109.441 79.4779 110.272C79.119 111.102 79.1201 111.983 79.4811 112.914C79.8438 113.849 80.437 114.508 81.2606 114.889C82.0868 115.264 82.9372 115.282 83.8118 114.943Z" fill="white"/>
<path d="M70.0393 119.955L68.5422 110.044L74.4255 109.155L74.6869 110.886L70.6655 111.493L71.9012 119.674L70.0393 119.955ZM70.4806 115.846L70.2338 114.213L74.8851 113.51L75.1318 115.144L70.4806 115.846Z" fill="white"/>
<path d="M50.7787 117.937L49.949 107.593L51.8769 107.947L52.2705 114.573L52.2976 115.318L52.3458 115.327L52.6836 114.649L55.8015 108.666L57.4264 108.964L58.1299 115.647L58.2121 116.403L58.2534 116.41L58.5568 115.726L61.2684 109.668L63.1549 110.014L58.7105 119.39L56.9135 119.061L56.1693 112.328L56.0967 111.482L56.0485 111.473L55.6736 112.237L52.5413 118.26L50.7787 117.937Z" fill="white"/>
<path d="M37.6235 112.783L45.3356 105.319L46.9471 106.07L46.1759 116.77L44.317 115.903L45.0056 109.042L45.1831 107.75L45.145 107.732L44.2726 108.692L39.4381 113.629L37.6235 112.783ZM40.1726 111.523L41.2577 110.438L45.4133 112.375L45.299 113.913L40.1726 111.523Z" fill="white"/>
<path d="M29.3113 106.747L35.3049 98.7123L38.3179 100.96C39.066 101.518 39.5294 102.227 39.708 103.088C39.8894 103.946 39.6997 104.75 39.1389 105.502C38.5948 106.232 37.8907 106.641 37.0267 106.73C36.1692 106.818 35.3271 106.554 34.5004 105.937L32.2112 104.229L33.065 103.085L35.2925 104.746C35.6553 105.017 36.0584 105.128 36.5016 105.081C36.9448 105.033 37.3087 104.818 37.5933 104.437C37.85 104.092 37.9424 103.707 37.8703 103.281C37.7983 102.855 37.5883 102.512 37.2404 102.252L35.7928 101.172L30.8038 107.86L29.3113 106.747ZM33.7551 110.062L34.0785 104.653L35.7194 105.79L35.5169 111.376L33.7551 110.062Z" fill="white"/>
<path d="M20.8906 97.5597L28.4642 90.993L30.6562 93.5211C31.6589 94.6776 32.1187 95.9095 32.0355 97.217C31.9559 98.5213 31.3501 99.6642 30.2183 100.646C29.0724 101.639 27.8464 102.084 26.5404 101.981C25.2379 101.875 24.0853 101.244 23.0826 100.088L20.8906 97.5597ZM23.3903 97.8568L24.3074 98.9146C24.9704 99.6863 25.7148 100.103 26.5407 100.165C27.3667 100.227 28.1763 99.9146 28.9696 99.2267C29.7559 98.545 30.17 97.7937 30.2119 96.973C30.2604 96.1527 29.9529 95.36 29.2895 94.5949L28.3724 93.5371L23.3903 97.8568Z" fill="white"/>
<path d="M14.0976 85.0338C13.5597 83.6959 13.5586 82.3735 14.0944 81.0666C14.632 79.764 15.6152 78.8255 17.044 78.251C18.4728 77.6765 19.8286 77.6771 21.1113 78.2528C22.3957 78.8329 23.3043 79.7853 23.837 81.1103C24.3697 82.4352 24.3704 83.7502 23.8389 85.0554C23.3091 86.3649 22.3342 87.3051 20.914 87.8761C19.5025 88.4437 18.1476 88.4452 16.8493 87.8808C15.5511 87.3164 14.6338 86.3674 14.0976 85.0338ZM15.7706 84.3536C16.1223 85.2282 16.7187 85.8359 17.5599 86.1767C18.4028 86.5218 19.2876 86.5081 20.2142 86.1355C21.1494 85.7595 21.7944 85.1556 22.149 84.324C22.5055 83.4966 22.5096 82.65 22.1614 81.784C21.815 80.9224 21.2237 80.3151 20.3877 79.9622C19.5534 79.6135 18.673 79.6255 17.7464 79.9981C16.8155 80.3724 16.1645 80.9736 15.7934 81.8019C15.4283 82.6327 15.4207 83.4833 15.7706 84.3536Z" fill="white"/>
<path d="M10.9443 72.7494L19.9345 71.2953L20.2318 73.1334L11.2416 74.5875L10.9443 72.7494ZM18.6729 68.7126L20.4005 68.4332L21.574 75.6889L19.8465 75.9683L18.6729 68.7126Z" fill="white"/>
<path d="M102.797 40.5814L111.524 35.649L114.514 40.9385L112.99 41.7996L110.899 38.1006L105.22 41.3108L107.348 45.0768L105.825 45.9379L102.797 40.5814ZM106.968 39.3819L108.339 38.6069L110.726 42.83L109.355 43.605L106.968 39.3819Z" fill="white"/>
<path d="M98.9454 36.3076C97.9672 35.1731 97.5317 33.9034 97.6389 32.4984C97.7462 31.0935 98.3742 29.8958 99.5228 28.9054C100.671 27.915 101.943 27.4747 103.338 27.5845C104.736 27.6979 105.922 28.3201 106.898 29.451C107.205 29.808 107.456 30.1955 107.65 30.6135C107.848 31.0285 107.982 31.4488 108.053 31.8743C108.128 32.3033 108.149 32.6672 108.117 32.9659C108.088 33.2616 108.074 33.4094 108.074 33.4094L106.287 33.2772C106.287 33.2772 106.299 33.1623 106.322 32.9324C106.346 32.7025 106.336 32.4553 106.293 32.1907C106.253 31.9296 106.169 31.6687 106.043 31.4079C105.92 31.144 105.751 30.8866 105.534 30.6357C104.913 29.9147 104.153 29.516 103.255 29.4397C102.358 29.3633 101.522 29.6588 100.748 30.3262C99.9774 30.9905 99.5537 31.7748 99.4769 32.6791C99.4066 33.5838 99.6854 34.4002 100.313 35.1283C100.536 35.3863 100.783 35.6014 101.055 35.7738C101.33 35.943 101.62 36.072 101.924 36.1607C102.235 36.2499 102.502 36.2944 102.723 36.2943C102.948 36.2977 103.061 36.2994 103.061 36.2994L102.94 38.1318C102.94 38.1318 102.77 38.1275 102.43 38.1189C102.096 38.1108 101.713 38.0344 101.28 37.8899C100.847 37.7454 100.433 37.5393 100.035 37.2717C99.6378 37.0107 99.2745 36.6893 98.9454 36.3076Z" fill="white"/>
<path d="M92.6201 29.6042L99.0192 21.8885L100.469 23.0905L94.0695 30.8063L92.6201 29.6042Z" fill="white"/>
<path d="M86.4287 25.8583L88.3618 15.3754L90.0957 16.3901L88.7509 23.0403L88.507 24.1223L88.5493 24.1471L89.3661 23.4166L94.5303 18.985L96.2401 19.9855L87.9391 26.7422L86.4287 25.8583Z" fill="white"/>
<path d="M76.1636 21.6899L79.383 12.1969L85.1371 14.1483L84.575 15.8056L80.5511 14.441L78.4558 20.6193L82.5526 22.0087L81.9906 23.666L76.1636 21.6899ZM78.4738 18.0162L78.9797 16.5246L83.5737 18.0826L83.0678 19.5742L78.4738 18.0162Z" fill="white"/>
<path d="M65.9023 20.3618L67.0816 10.4074L70.4043 10.801C71.9244 10.9811 73.0937 11.5825 73.9124 12.6053C74.7317 13.6234 75.0532 14.8762 74.877 16.3638C74.6986 17.87 74.0919 19.0246 73.0569 19.8278C72.0224 20.6263 70.7452 20.9355 69.2251 20.7554L65.9023 20.3618ZM67.9507 18.8986L69.341 19.0633C70.3507 19.1876 71.1818 18.9947 71.8344 18.4846C72.4869 17.9745 72.8749 17.1981 72.9985 16.1554C73.1209 15.1219 72.9213 14.2877 72.3997 13.6526C71.8833 13.0134 71.1223 12.6342 70.1167 12.5151L68.7264 12.3504L67.9507 18.8986Z" fill="white"/>
<path d="M53.5358 21.9006L51.7334 12.04L57.7104 10.9475L58.025 12.6689L53.8453 13.4329L55.0184 19.8506L59.2739 19.0728L59.5885 20.7942L53.5358 21.9006ZM53.7684 17.5672L53.4852 16.0178L58.2571 15.1456L58.5403 16.6949L53.7684 17.5672Z" fill="white"/>
<path d="M44.755 23.1157L43.8346 20.8376L46.0454 13.9952L48.2197 13.1168L46.0742 19.2986L44.755 23.1157ZM44.4784 25.4395L40.7234 16.1454L42.4498 15.4479L46.2048 24.742L44.4784 25.4395ZM50.086 23.174L45.3018 19.9655L45.8988 18.1917L52.1694 22.3323L50.086 23.174Z" fill="white"/>
<path d="M35.4697 31.5339L32.9233 21.1074L34.3857 20.0961L43.2307 26.1669L41.5438 27.3335L35.9699 23.273L34.9445 22.4672L34.91 22.491L35.298 23.7291L37.1163 30.3952L35.4697 31.5339ZM35.67 28.6975L35.2816 27.2128L39.0527 24.605L40.322 25.4805L35.67 28.6975Z" fill="white"/>
<path d="M33.3106 34.0403L25.911 27.2781L27.1719 25.8984L34.5714 32.6607L33.3106 34.0403ZM29.0936 38.6547L21.6941 31.8925L22.9502 30.518L30.3497 37.2802L29.0936 38.6547ZM26.6989 34.9869L25.4123 33.8111L29.4167 29.4293L30.7034 30.6051L26.6989 34.9869Z" fill="white"/>
<path d="M26.4631 43.3987C26.159 43.9182 25.8053 44.333 25.4021 44.6431C25.0012 44.9492 24.5768 45.1523 24.1289 45.2524C23.6833 45.3485 23.2594 45.3707 22.857 45.319C22.4507 45.265 22.2475 45.238 22.2475 45.238L22.501 43.4884C22.501 43.4884 22.6421 43.5061 22.9242 43.5415C23.2023 43.5745 23.4811 43.5647 23.7607 43.512C24.0362 43.457 24.2903 43.3462 24.523 43.1796C24.7581 43.009 24.9581 42.7827 25.1231 42.5008C25.3754 42.0698 25.4697 41.6546 25.4062 41.2551C25.345 40.8516 25.1351 40.5449 24.7767 40.3351C24.4626 40.1512 24.1063 40.1455 23.708 40.3179C23.308 40.4839 22.7826 40.855 22.1317 41.4311C21.3326 42.1313 20.6153 42.5577 19.9798 42.7102C19.3467 42.8587 18.7301 42.7574 18.13 42.4061C17.4373 42.0006 17.0205 41.3917 16.8797 40.5792C16.7348 39.7644 16.9122 38.9301 17.412 38.0763C17.676 37.6252 17.9794 37.2593 18.3221 36.9787C18.6632 36.6917 19.0308 36.4932 19.425 36.3833C19.8175 36.267 20.1667 36.22 20.4727 36.2422C20.7747 36.2622 20.9257 36.2722 20.9257 36.2722L20.6969 37.9794C20.6969 37.9794 20.6104 37.9748 20.4374 37.9654C20.2644 37.9561 20.067 37.9839 19.8452 38.0487C19.6258 38.1095 19.4264 38.2145 19.2472 38.3637C19.0639 38.5106 18.9015 38.7048 18.76 38.9465C18.5408 39.321 18.4502 39.679 18.4884 40.0203C18.5288 40.3576 18.692 40.61 18.978 40.7774C19.2357 40.9282 19.5238 40.9535 19.842 40.8532C20.1563 40.7506 20.6958 40.3554 21.4607 39.6675C22.2374 38.9596 22.9724 38.5354 23.6656 38.395C24.3611 38.2506 25.023 38.3623 25.6513 38.7301C26.4528 39.1992 26.9222 39.866 27.0597 40.7305C27.1971 41.5951 26.9982 42.4844 26.4631 43.3987Z" fill="white"/>
<mask id="mask0_775_2501" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="35" y="35" width="60" height="60">
<rect x="35.0002" y="35" width="60" height="60" fill="url(#pattern0_775_2501)"/>
</mask>
<g mask="url(#mask0_775_2501)">
<rect x="25.0002" y="25" width="80" height="80" fill="white"/>
</g>
<defs>
<pattern id="pattern0_775_2501" patternContentUnits="objectBoundingBox" width="1" height="1">
<use xlink:href="#image0_775_2501" transform="scale(0.005)"/>
</pattern>
<image id="image0_775_2501" width="200" height="200" preserveAspectRatio="none" xlink:href="data:image/png;base64,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"/>
</defs>
</svg>`;

function getLocaleSafe() {
  if (typeof window !== "undefined" && window.i18n && typeof window.i18n.getLocale === "function") {
    return window.i18n.getLocale();
  }
  return "vi";
}

function updateShakeIcon(locale) {
  if (!dom.shakeIcon) return;
  const next = locale === "en" ? SHAKE_ICON_EN : SHAKE_ICON_VI;
  if (next && dom.shakeIcon.innerHTML.trim() !== next.trim()) {
    dom.shakeIcon.innerHTML = next;
  }
}

updateShakeIcon(getLocaleSafe());

let lastTrigger = 0;
let armed = true;
let motionEnabled = false;
let flowersLoaded = false;
let motionSeen = false;
let horsesLoaded = false;
let flowerFallTimer = null;
let horseDangleTimer = null;
let horseGravityLayer = null;
let gravityRaf = null;
let gravityTarget = 0;
let gravityCurrent = 0;
let motionPromptDismissed = false;
let statusKey = null;
let flowerSeedRetries = 0;
let flowerResizeObserver = null;

const supportsMotion = "DeviceMotionEvent" in window;
const needsPermission =
  supportsMotion && typeof DeviceMotionEvent.requestPermission === "function";
const isMobile =
  typeof navigator !== "undefined" &&
  ((navigator.userAgentData && navigator.userAgentData.mobile) ||
    /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent));
const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function setStatus(message, key = null) {
  if (dom.motionStatusText) {
    dom.motionStatusText.textContent = message;
  }
  statusKey = key;
}

if (typeof window !== "undefined" && window.i18n && typeof window.i18n.onChange === "function") {
  window.i18n.onChange(() => {
    updateShakeIcon(getLocaleSafe());
    if (!statusKey) return;
    setStatus(t(statusKey, dom.motionStatusText ? dom.motionStatusText.textContent : ""), statusKey);
  });
}

function setShakeCtaVisible(visible) {
  if (!dom.shakeIcon) {
    return;
  }
  dom.shakeIcon.classList.toggle("hidden", !visible);
}

function markMotionPromptDismissed() {
  motionPromptDismissed = true;
}

function getDiscoveredHorses() {
  try {
    const raw = window.localStorage.getItem(DISCOVERED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) {
      const seen = new Set();
      return parsed
        .filter((value) => typeof value === "string" && value.trim().length)
        .filter((value) => HORSE_IDS.includes(value))
        .filter((value) => {
          if (seen.has(value)) {
            return false;
          }
          seen.add(value);
          return true;
        });
    }
  } catch (error) {
    // ignore storage errors
  }
  return [];
}

function isSecretUnlocked(discovered = getDiscoveredHorses()) {
  if (!SECRET_HORSE_ID) {
    return false;
  }
  return NON_SECRET_IDS.every((id) => discovered.includes(id));
}

function showDrawButton() {
  if (dom.drawFortuneButton) dom.drawFortuneButton.classList.remove("hidden");
}

function hideDrawButton() {
  if (dom.drawFortuneButton) dom.drawFortuneButton.classList.add("hidden");
}

function chooseRandomHorse() {
  const discovered = getDiscoveredHorses();
  if (SECRET_HORSE_ID && isSecretUnlocked(discovered) && !discovered.includes(SECRET_HORSE_ID)) {
    const secret = HORSES.find((horse) => horse.id === SECRET_HORSE_ID);
    if (secret) {
      return secret;
    }
  }
  const basePool = isSecretUnlocked(discovered)
    ? HORSES
    : HORSES.filter((horse) => !horse.secret);
  if (!REPEATABLE) {
    const remaining = basePool.filter((horse) => !discovered.includes(horse.id));
    if (remaining.length) {
      return remaining[Math.floor(Math.random() * remaining.length)];
    }
  }
  return basePool[Math.floor(Math.random() * basePool.length)];
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
  if (dom.drawFortuneButton) {
    dom.drawFortuneButton.disabled = true;
  }
  const outcome = chooseRandomHorse();
  goToHorse(outcome);
}

function handleMotion(event) {
  motionSeen = true;
  const acc = event.accelerationIncludingGravity;
  if (!acc) {
    return;
  }
  updateHorseGravity(acc);
  if (!armed) {
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

function updateHorseGravity(acc) {
  if (!horseGravityLayer || prefersReducedMotion) {
    return;
  }
  const x = acc.x || 0;
  const y = acc.y || 0;
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return;
  }
  let angleDeg = (Math.atan2(x, y) * 180) / Math.PI;
  if (!Number.isFinite(angleDeg)) {
    return;
  }
  if (angleDeg > 90) {
    angleDeg -= 180;
  } else if (angleDeg < -90) {
    angleDeg += 180;
  }
  angleDeg = clamp(angleDeg, -HORSE_GRAVITY_MAX_ANGLE, HORSE_GRAVITY_MAX_ANGLE);
  gravityTarget = angleDeg;
  scheduleGravityFrame();
}

function scheduleGravityFrame() {
  if (gravityRaf) {
    return;
  }
  gravityRaf = window.requestAnimationFrame(() => {
    gravityRaf = null;
    const delta = gravityTarget - gravityCurrent;
    gravityCurrent += delta * HORSE_GRAVITY_SMOOTHING;
    if (Math.abs(delta) < 0.08) {
      gravityCurrent = gravityTarget;
    }
    setHorseGravityAngle(gravityCurrent);
    if (Math.abs(gravityTarget - gravityCurrent) >= 0.08) {
      scheduleGravityFrame();
    }
  });
}

function setHorseGravityAngle(angle) {
  if (!horseGravityLayer) {
    return;
  }
  horseGravityLayer.style.setProperty(HORSE_GRAVITY_CSS_VAR, `${angle.toFixed(2)}deg`);
}

function startMotion() {
  if (motionEnabled) {
    return;
  }
  motionSeen = false;
  window.addEventListener("devicemotion", handleMotion, { passive: true });
  motionEnabled = true;
  setStatus("");
  hideDrawButton();
  hideMotionModal();
  setShakeCtaVisible(true);

  if (needsPermission) {
    window.setTimeout(() => {
      if (!motionSeen && !motionPromptDismissed) {
        setStatus(
          t("status.enableMotion", "Enable motion access to use shake."),
          "status.enableMotion"
        );
        showDrawButton();
        showMotionModal();
      }
    }, 800);
  }
}

async function requestMotionPermission() {
  markMotionPromptDismissed();
  hideMotionModal();
  if (!needsPermission) {
    setMotionGranted();
    startMotion();
    return;
  }
  try {
    const response = await DeviceMotionEvent.requestPermission();
    if (response === "granted") {
      setMotionGranted();
      startMotion();
      return;
    }
    setStatus(t("status.motionDenied", "Motion access denied."), "status.motionDenied");
    showDrawButton();
    setShakeCtaVisible(false);
  } catch (error) {
    setStatus(
      t("status.motionUnavailable", "Motion access unavailable."),
      "status.motionUnavailable"
    );
    showDrawButton();
    setShakeCtaVisible(false);
  }
}

function setupMotionUI() {
  if (!isMobile || !supportsMotion) {
    setStatus("");
    showDrawButton();
    hideMotionModal();
    setShakeCtaVisible(false);
    return;
  }

  if (!needsPermission) {
    startMotion();
    return;
  }

  if (isMotionGranted()) {
    startMotion();
    return;
  }

  setStatus(
    t("status.enableMotion", "Enable motion access to use shake."),
    "status.enableMotion"
  );
  showDrawButton();
  showMotionModal();
  setShakeCtaVisible(false);
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

function showMotionModal() {
  if (dom.motionPrompt) dom.motionPrompt.classList.remove("hidden");
}

function hideMotionModal() {
  if (dom.motionPrompt) dom.motionPrompt.classList.add("hidden");
}

function createFlowerElement({ svg, size, spin }, x, y, containerHeight) {
  const flower = document.createElement("span");
  flower.className = `tree-flower${spin ? " tree-flower--spin" : ""}`;

  flower.style.setProperty("--flower-x", `${x}px`);
  flower.style.setProperty("--flower-y", `${y}px`);
  flower.style.setProperty("--flower-size", `${size}px`);
  flower.style.setProperty("--flower-delay", `${Math.random() * 0.6}s`);
  flower.style.setProperty("--flower-fall-duration", `${FLOWER_FALL_DURATION}ms`);
  const fallBottom = containerHeight * FLOWER_FALL_BOTTOM_RATIO;
  const fallDistance = Math.max(0, fallBottom - size / 2 - y);
  flower.style.setProperty("--flower-fall-distance", `${fallDistance}px`);
  flower.dataset.size = `${size}`;
  flower.dataset.y = `${y}`;

  if (spin) {
    const duration = 6 + Math.random() * 6;
    const delay = Math.random() * 1.5;
    flower.style.setProperty("--spin-duration", `${duration}s`);
    flower.style.setProperty("--spin-delay", `${delay}s`);
  }

  flower.innerHTML = svg;
  return flower;
}

function seedFlowers() {
  if (flowersLoaded) {
    return;
  }
  const container = document.querySelector(".hero-tree-flowers");
  if (!container) {
    return;
  }
  flowersLoaded = true;
  container.innerHTML = "";

  const flowerCount = Math.max(1, FLOWER_TOTAL);
  const minPerType = Math.max(1, Math.floor(FLOWER_TOTAL * 0.15));
  const maxPerType = Math.max(minPerType, Math.ceil(FLOWER_TOTAL * 0.45));

  const flowers = [
    {
      size: 12,
      spin: false,
      svg:
        '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="6" cy="6" r="5" fill="#FFFFFF"/><circle cx="6" cy="6" r="5" stroke="#D50B0B" stroke-width="2"/></svg>'
    },
    {
      size: 26,
      spin: true,
      svg:
        '<svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 13C0 5.8203 5.8203 0 13 0C20.1797 0 26 5.8203 26 13C26 20.1797 20.1797 26 13 26C5.8203 26 0 20.1797 0 13Z" fill="#FFFF90"/><path d="M13 6.99998L13.7071 6.29287L13 5.58577L12.2929 6.29287L13 6.99998ZM19 13L19.7071 13.7071L20.4142 13L19.7071 12.2929L19 13ZM13 19L12.2929 19.7071L13 20.4142L13.7071 19.7071L13 19ZM6.99999 13L6.29288 12.2929L5.58578 13L6.29288 13.7071L6.99999 13ZM13 6.99998L12.2929 7.70709L18.2929 13.7071L19 13L19.7071 12.2929L13.7071 6.29287L13 6.99998ZM19 13L18.2929 12.2929L12.2929 18.2929L13 19L13.7071 19.7071L19.7071 13.7071L19 13ZM13 19L13.7071 18.2929L7.7071 12.2929L6.99999 13L6.29288 13.7071L12.2929 19.7071L13 19ZM6.99999 13L7.7071 13.7071L13.7071 7.70709L13 6.99998L12.2929 6.29287L6.29288 12.2929L6.99999 13Z" fill="#D50B0B"/></svg>'
    },
    {
      size: 24,
      spin: true,
      svg:
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" fill="#FF6FFA"/><path d="M12.001 15.3333L12.001 22" stroke="#D50B0B" stroke-width="2"/><path d="M12.001 2V8.66667" stroke="#D50B0B" stroke-width="2"/><path d="M8.67188 11.9958L2.00521 11.9958" stroke="#D50B0B" stroke-width="2"/><path d="M22.0049 11.9958L15.3382 11.9958" stroke="#D50B0B" stroke-width="2"/><path d="M9.64502 14.3541L4.93097 19.0681" stroke="#D50B0B" stroke-width="2"/><path d="M19.0732 4.92597L14.3592 9.64002" stroke="#D50B0B" stroke-width="2"/><path d="M9.64502 9.63992L4.93098 4.92588" stroke="#D50B0B" stroke-width="2"/><path d="M19.0732 19.0682L14.3592 14.3542" stroke="#D50B0B" stroke-width="2"/></svg>'
    }
  ];

  const { width, height } = container.getBoundingClientRect();
  if (!width || !height) {
    return;
  }

  const placed = [];
  const maxTries = flowerCount * 20;
  let tries = 0;

  const counts = [0, 0, 0];
  if (flowerCount <= flowers.length) {
    for (let i = 0; i < flowerCount; i += 1) {
      counts[i] = 1;
    }
  } else {
    counts[0] = minPerType;
    counts[1] = minPerType;
    counts[2] = minPerType;
    let remaining = flowerCount - minPerType * 3;
    while (remaining > 0) {
      const options = counts
        .map((count, index) => (count < maxPerType ? index : null))
        .filter((value) => value !== null);
      const pick = options.length
        ? options[Math.floor(Math.random() * options.length)]
        : Math.floor(Math.random() * counts.length);
      counts[pick] += 1;
      remaining -= 1;
    }
  }

  const distribution = [];
  counts.forEach((count, index) => {
    for (let i = 0; i < count; i += 1) {
      distribution.push(flowers[index]);
    }
  });
  for (let i = distribution.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [distribution[i], distribution[j]] = [distribution[j], distribution[i]];
  }

  const paddingX = Math.max(12, width * 0.05);
  const paddingY = Math.max(12, height * 0.05);
  const maxHeight = height * 0.75;

  while (placed.length < distribution.length && tries < maxTries) {
    tries += 1;
    const x = paddingX + Math.random() * (width - paddingX * 2);
    const y = paddingY + Math.random() * (maxHeight - paddingY);
    const flower = distribution[placed.length];
    const minGap = Math.max(12, flower.size * 1.8);

    const tooClose = placed.some((point) => {
      const dx = point.x - x;
      const dy = point.y - y;
      return Math.hypot(dx, dy) < minGap;
    });

    if (tooClose) {
      continue;
    }

    placed.push({ x, y });
    const element = createFlowerElement(flower, x, y, height);
    container.appendChild(element);
  }

  while (placed.length < distribution.length) {
    const x = paddingX + Math.random() * (width - paddingX * 2);
    const y = paddingY + Math.random() * (maxHeight - paddingY);
    const flower = distribution[placed.length];
    placed.push({ x, y });
    const element = createFlowerElement(flower, x, y, height);
    container.appendChild(element);
  }
}

function scheduleFlowerSeed() {
  if (flowersLoaded) {
    return;
  }
  const container = document.querySelector(".hero-tree-flowers");
  if (!container) {
    return;
  }

  if (!flowerResizeObserver && "ResizeObserver" in window) {
    flowerResizeObserver = new ResizeObserver(() => {
      if (!flowersLoaded) {
        flowerSeedRetries = 0;
        scheduleFlowerSeed();
      }
    });
    flowerResizeObserver.observe(container);
  }

  const { width, height } = container.getBoundingClientRect();
  if (!width || !height) {
    if (flowerSeedRetries < 10) {
      flowerSeedRetries += 1;
      window.setTimeout(scheduleFlowerSeed, 120);
    }
    return;
  }

  seedFlowers();
  startFlowerFall();
}

function startFlowerFall() {
  if (flowerFallTimer) {
    return;
  }
  const container = document.querySelector(".hero-tree-flowers");
  if (!container) {
    return;
  }
  flowerFallTimer = window.setInterval(() => {
    const candidates = Array.from(
      container.querySelectorAll(".tree-flower:not(.is-falling)")
    );
    if (!candidates.length) {
      window.clearInterval(flowerFallTimer);
      flowerFallTimer = null;
      return;
    }
    const target = candidates[Math.floor(Math.random() * candidates.length)];
    if (!target) {
      return;
    }
    const size = parseFloat(target.dataset.size || target.style.getPropertyValue("--flower-size"));
    const y = parseFloat(target.dataset.y || target.style.getPropertyValue("--flower-y"));
    if (Number.isFinite(size) && Number.isFinite(y)) {
      const fallBottom = container.clientHeight * FLOWER_FALL_BOTTOM_RATIO;
      const fallDistance = Math.max(0, fallBottom - size / 2 - y);
      target.style.setProperty("--flower-fall-distance", `${fallDistance}px`);
    }
    target.classList.add("is-falling");
  }, FLOWER_FALL_INTERVAL);
}

function createHorseIcon(x, y, { isSecret = false } = {}) {
  const icon = document.createElement("span");
  icon.className = `tree-horse${isSecret ? " tree-horse--secret" : ""}`;
  icon.style.left = `${x}px`;
  icon.style.top = `${y}px`;
  const swayAngle = (Math.random() * 6 + 8).toFixed(2);
  const fadeDelay = Math.random() * 0.6;
  icon.style.setProperty("--horse-sway-angle", `${swayAngle}deg`);
  icon.style.setProperty("--horse-fade-delay", `${fadeDelay}s`);
  icon.innerHTML =
    '<span class="tree-horse-inner"><svg width="48" height="42" viewBox="0 0 48 42" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M47.3185 29.4506C47.0708 24.8723 47.437 16.7848 41.5063 16.0778C43.9129 13.3326 45.6802 11.2011 46.1734 7.12453C46.6306 3.33579 45.9257 0 45.9257 0H30.9488C32.6801 2.2542 35.1184 8.55748 33.0315 12.0562C31.6748 14.3274 28.4448 14.4882 27.4162 10.4794C24.9271 0.764098 15.5485 0 7.51177 0H0L1.03501 18.5437L4.95282 18.5902L9.00609 16.3128C9.00609 19.2125 6.21642 22.252 1.0329 22.252L0 42H8.87697C11.5269 42 13.6774 39.8516 13.6774 37.1995V36.5878C15.9231 38.7108 19.4472 40.0591 24 40.0591C28.5528 40.0591 32.0494 38.7108 34.3057 36.5836V37.1995C34.3057 39.8495 36.454 42 39.1061 42H48L47.3206 29.4506H47.3185Z" fill="currentColor"/></svg></span>';
  return icon;
}

function seedHorseIcons() {
  if (horsesLoaded) {
    return;
  }
  const container = document.querySelector(".hero-tree-horses");
  if (!container) {
    return;
  }
  const discovered = getDiscoveredHorses();
  const secretUnlocked = isSecretUnlocked(discovered);
  const visibleIds = discovered.filter(
    (id) => id !== SECRET_HORSE_ID || secretUnlocked
  );
  if (!visibleIds.length) {
    return;
  }
  horsesLoaded = true;
  container.innerHTML = "";

  const { width, height } = container.getBoundingClientRect();
  if (!width || !height) {
    return;
  }

  const size = 48;
  const maxHeight = height * 0.75;
  const minGap = size * 1.2;
  const maxTries = visibleIds.length * 25;
  const placed = [];
  let tries = 0;

  while (placed.length < visibleIds.length && tries < maxTries) {
    tries += 1;
    const x = size / 2 + Math.random() * (width - size);
    const y = size / 2 + Math.random() * (maxHeight - size);
    const tooClose = placed.some((point) => Math.hypot(point.x - x, point.y - y) < minGap);
    if (tooClose) {
      continue;
    }
    placed.push({ x, y });
  }

  while (placed.length < visibleIds.length) {
    const x = size / 2 + Math.random() * (width - size);
    const y = size / 2 + Math.random() * (maxHeight - size);
    placed.push({ x, y });
  }

  placed.forEach((point, index) => {
    const id = visibleIds[index];
    container.appendChild(
      createHorseIcon(point.x, point.y, {
        isSecret: id === SECRET_HORSE_ID
      })
    );
  });

  startHorseDangles(container);
}

function setupTreeFlowers() {
  const wrap = document.querySelector(".hero-tree-wrap");
  if (!wrap) {
    return;
  }
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    scheduleFlowerSeed();
    return;
  }

  const style = window.getComputedStyle(wrap);
  const hasAnimation =
    style.animationName && style.animationName !== "none" && parseFloat(style.animationDuration) > 0;

  if (!hasAnimation) {
    scheduleFlowerSeed();
    return;
  }

  wrap.addEventListener(
    "animationend",
    () => {
      scheduleFlowerSeed();
    },
    { once: true }
  );
  const durationMs = parseFloat(style.animationDuration) * 1000;
  if (Number.isFinite(durationMs) && durationMs > 0) {
    setTimeout(() => {
      scheduleFlowerSeed();
    }, durationMs + 50);
  }
}

function setupTreeHorseIcons() {
  const wrap = document.querySelector(".hero-tree-wrap");
  if (!wrap) {
    return;
  }
  const layer = document.querySelector(".hero-tree-horses");
  if (layer) {
    horseGravityLayer = layer;
    setHorseGravityAngle(0);
  }
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    seedHorseIcons();
    return;
  }

  const style = window.getComputedStyle(wrap);
  const hasAnimation =
    style.animationName && style.animationName !== "none" && parseFloat(style.animationDuration) > 0;

  if (!hasAnimation) {
    seedHorseIcons();
    return;
  }

  wrap.addEventListener("animationend", seedHorseIcons, { once: true });
  const durationMs = parseFloat(style.animationDuration) * 1000;
  if (Number.isFinite(durationMs) && durationMs > 0) {
    setTimeout(seedHorseIcons, durationMs + 60);
  }
}

function startHorseDangles(container) {
  if (horseDangleTimer) {
    window.clearInterval(horseDangleTimer);
    horseDangleTimer = null;
  }
  const horses = Array.from(container.querySelectorAll(".tree-horse"));
  if (!horses.length) {
    return;
  }
  horseDangleTimer = window.setInterval(() => {
    const target = horses[Math.floor(Math.random() * horses.length)];
    if (!target || target.classList.contains("is-dangling")) {
      return;
    }
    const duration =
      HORSE_DANGLE_DURATION_MIN +
      Math.random() * (HORSE_DANGLE_DURATION_MAX - HORSE_DANGLE_DURATION_MIN);
    target.style.setProperty("--horse-sway-duration", `${duration}ms`);
    target.classList.add("is-dangling");
    window.setTimeout(() => {
      target.classList.remove("is-dangling");
    }, duration);
  }, HORSE_DANGLE_INTERVAL);
}


if (dom.enableMotionButton) dom.enableMotionButton.addEventListener("click", requestMotionPermission);
if (dom.closeMotionButton) dom.closeMotionButton.addEventListener("click", () => {
  markMotionPromptDismissed();
  hideMotionModal();
  showDrawButton();
  setShakeCtaVisible(false);
});
if (dom.motionPrompt) dom.motionPrompt.addEventListener("click", (event) => {
  const target = event.target;
  if (target && target.matches("[data-close=\"true\"]")) {
    markMotionPromptDismissed();
    setStatus("");
    showDrawButton();
    hideMotionModal();
    setShakeCtaVisible(false);
  }
});

if (dom.drawFortuneButton) dom.drawFortuneButton.addEventListener("click", () => {
  triggerDraw();
});

setupTreeFlowers();
setupTreeHorseIcons();
setupMotionUI();
initPagePreloader();

window.addEventListener("resize", () => {
  if (!flowersLoaded) {
    flowerSeedRetries = 0;
    scheduleFlowerSeed();
  }
});
