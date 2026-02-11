// Bind the horizontal range slider to the .intro_animation horizontal scroll
const AUTO_SLIDE_ENABLED = false;
const SNAP_ENABLED = false;
const WHEEL_SCROLL_ENABLED = true;

document.addEventListener('DOMContentLoaded', function () {
	const container = document.querySelector('.intro_animation');
	const slider = document.getElementById('horizontalSlider');
	const swipeNav = document.querySelector('nav.swipe');
	const swipeText = document.querySelector('.swipe-text');
	if (!container || !slider) return;

	const spreadItems = Array.from(container.querySelectorAll('.spread-text'));
	const frames = Array.from(container.children).filter((el) => el.nodeType === 1);
	const IDLE_MS = 10000;
	const AUTO_SCROLL_DURATION_MS = 1000;
	const SNAP_SCROLL_DURATION_MS = 80;
	const SCROLL_SNAP_DELAY = 50;
	const pageBody = document.body;
	let idleTimer = null;
	let isAutoScrolling = false;
	let autoScrollToken = 0;
	let snapPoints = [];
	let scrollEndTimer = null;
	let suppressSnap = false;
	let suppressSnapTimer = null;
	let lastScrollLeft = 0;
	let lastScrollDirection = 0;
	let scrollInitialDirection = 0;
	let isUserScrolling = false;
	let scrollStartLeft = 0;
	let scrollStartIndex = null;
	let snapLocked = false;
	let swipeDismissed = false;
	let swipeTextDismissed = false;
	let originDismissed = false;

	function updateSnapPoints() {
		const max = Math.max(0, container.scrollWidth - container.clientWidth);
		const centerOffset = container.clientWidth / 2;
		const points = frames
			.map((el) => {
				const center = el.offsetLeft + el.offsetWidth / 4 - centerOffset;
				return Math.round(Math.min(max, Math.max(0, center)));
			})
			.filter((value) => Number.isFinite(value));
		snapPoints = Array.from(new Set(points)).sort((a, b) => a - b);
	}

	function updateSliderMax() {
		const max = Math.max(0, container.scrollWidth - container.clientWidth);
		slider.max = Math.round(max);
		// keep slider value mirrored to scrollLeft (slider moves opposite)
		slider.value = Math.round(max - container.scrollLeft);
		updateSnapPoints();
		updateSwipeVisibility();
	}

	function positionSpreadText() {
		if (!spreadItems.length) return;
		const containerRect = container.getBoundingClientRect();
		const vw = window.innerWidth || container.clientWidth;
		const vh = window.innerHeight || container.clientHeight;

		spreadItems.forEach((el) => {
			const spreadX = Number(el.dataset.spreadX || 0);
			const spreadY = Number(el.dataset.spreadY || 0);
			const targetX = spreadX * vw;
			const targetY = spreadY * vh;
			el.style.transform = 'translate3d(0, 0, 0)';
			const rect = el.getBoundingClientRect();
			const currentX = rect.left - containerRect.left + container.scrollLeft + rect.width / 2;
			const currentY = rect.top - containerRect.top + rect.height / 2;
			const dx = targetX - currentX;
			const dy = targetY - currentY;
			el.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0)`;
		});
	}

	function getClosestSnapPoint(current) {
		if (!snapPoints.length) return current;
		let closest = snapPoints[0];
		let minDist = Math.abs(current - closest);
		for (let i = 1; i < snapPoints.length; i += 1) {
			const dist = Math.abs(current - snapPoints[i]);
			if (dist < minDist) {
				minDist = dist;
				closest = snapPoints[i];
			}
		}
		return closest;
	}

	function getClosestSnapIndex(current) {
		if (!snapPoints.length) return 0;
		let closestIndex = 0;
		let minDist = Math.abs(current - snapPoints[0]);
		for (let i = 1; i < snapPoints.length; i += 1) {
			const dist = Math.abs(current - snapPoints[i]);
			if (dist < minDist) {
				minDist = dist;
				closestIndex = i;
			}
		}
		return closestIndex;
	}

	function updateSwipeVisibility() {
		if (!swipeNav || swipeDismissed) return;
		const index = getClosestSnapIndex(container.scrollLeft);
		if (index >= 1) {
			swipeDismissed = true;
			swipeNav.classList.add('swipe--hidden');
		}
	}

	function updateSwipeTextVisibility() {
		if (!swipeText || swipeTextDismissed) return;
		const index = getClosestSnapIndex(container.scrollLeft);
		if (index >= 1) {
			swipeTextDismissed = true;
			pageBody.classList.add('swipe-text-hidden');
		}
	}

	function updateBrandVisibility() {
		if (!pageBody) return;
		const index = getClosestSnapIndex(container.scrollLeft);
		const isFrame1 = index === 0;
		const isFrame5 = index === Math.max(0, frames.length - 1);
		if (index >= 1) {
			pageBody.classList.add('brand-visible');
		} else {
			pageBody.classList.remove('brand-visible');
		}
		pageBody.classList.toggle('frame1-active', isFrame1);
		pageBody.classList.toggle('start-visible', isFrame5);
		if (!originDismissed && index >= 1) {
			originDismissed = true;
			pageBody.classList.add('origin-hidden');
		}
	}

	function getDirectionalBaseIndex(current, direction) {
		if (!snapPoints.length) return 0;
		let prevIndex = 0;
		let nextIndex = snapPoints.length - 1;
		for (let i = 0; i < snapPoints.length; i += 1) {
			if (snapPoints[i] <= current) {
				prevIndex = i;
			}
			if (snapPoints[i] >= current) {
				nextIndex = i;
				break;
			}
		}
		if (direction > 0) return prevIndex;
		if (direction < 0) return nextIndex;
		return getClosestSnapIndex(current);
	}

	function beginUserScroll() {
		if (isUserDragging || isAutoScrolling) return;
		if (!isUserScrolling) {
			isUserScrolling = true;
			snapLocked = false;
			scrollInitialDirection = 0;
			scrollStartLeft = container.scrollLeft;
			scrollStartIndex = getClosestSnapIndex(scrollStartLeft);
		}
	}

	// set initial values
	updateSliderMax();
	lastScrollLeft = container.scrollLeft;
	window.requestAnimationFrame(positionSpreadText);
	updateBrandVisibility();
	updateSwipeTextVisibility();
	if (!SNAP_ENABLED) {
		container.style.scrollSnapType = 'none';
	}
	if (WHEEL_SCROLL_ENABLED) {
		container.classList.add('wheel-scroll');
	}
	if (document.fonts && document.fonts.ready) {
		document.fonts.ready.then(positionSpreadText);
	}
	window.addEventListener('load', positionSpreadText);

	let isUserDragging = false;

	// when container scrolls (wheel/drag/keyboard), update slider position (mirror)
	container.addEventListener('scroll', function () {
		const currentScrollLeft = container.scrollLeft;
		const delta = currentScrollLeft - lastScrollLeft;
		if (!isUserScrolling) {
			isUserScrolling = true;
			scrollInitialDirection = 0;
			scrollStartLeft = currentScrollLeft;
			scrollStartIndex = getClosestSnapIndex(currentScrollLeft);
		}
		if (delta > 0.5) {
			lastScrollDirection = 1;
			if (scrollInitialDirection === 0) scrollInitialDirection = 1;
		} else if (delta < -0.5) {
			lastScrollDirection = -1;
			if (scrollInitialDirection === 0) scrollInitialDirection = -1;
		}
		lastScrollLeft = currentScrollLeft;
		if (!isUserDragging) {
			window.requestAnimationFrame(() => {
				const max = Number(slider.max) || 0;
				slider.value = Math.round(max - container.scrollLeft);
			});
		}
		if (SNAP_ENABLED && !isUserDragging && !isAutoScrolling && !suppressSnap) {
			window.clearTimeout(scrollEndTimer);
			scrollEndTimer = window.setTimeout(() => {
				if (snapLocked) {
					isUserScrolling = false;
					scrollInitialDirection = 0;
					scrollStartIndex = null;
					return;
				}
				const netDelta = container.scrollLeft - scrollStartLeft;
				const netDirection = netDelta > 4 ? 1 : netDelta < -4 ? -1 : 0;
				const direction = netDirection || scrollInitialDirection || lastScrollDirection;
				let target = getClosestSnapPoint(container.scrollLeft);
				if (direction !== 0 && snapPoints.length) {
					const step = direction > 0 ? 1 : -1;
					const baseIndex = scrollStartIndex !== null
						? scrollStartIndex
						: getDirectionalBaseIndex(container.scrollLeft, direction);
					const targetIndex = Math.max(0, Math.min(snapPoints.length - 1, baseIndex + step));
					target = snapPoints[targetIndex];
				}
				isUserScrolling = false;
				scrollInitialDirection = 0;
				scrollStartIndex = null;
				if (Math.abs(target - container.scrollLeft) > 1) {
					snapLocked = true;
					isAutoScrolling = true;
					animateScrollTo(target, SNAP_SCROLL_DURATION_MS);
				}
			}, SCROLL_SNAP_DELAY);
		}
		if (!isAutoScrolling) {
			registerInteraction();
		}
		updateSwipeVisibility();
		updateBrandVisibility();
		updateSwipeTextVisibility();
	}, { passive: true });

	['pointerdown', 'touchstart', 'wheel'].forEach((eventName) => {
		container.addEventListener(eventName, beginUserScroll, { passive: true });
	});

	function handleWheelScroll(event) {
		if (!WHEEL_SCROLL_ENABLED) return;
		if (!pageBody || !pageBody.classList.contains('page--info')) return;
		const max = Math.max(0, container.scrollWidth - container.clientWidth);
		if (max <= 0) return;
		const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
		if (!delta) return;
		container.scrollBy({ left: delta, behavior: 'auto' });
		event.preventDefault();
		registerInteraction();
	}

	window.addEventListener('wheel', handleWheelScroll, { passive: false, capture: true });

	// update max on resize or content change
	window.addEventListener('resize', function () {
		updateSliderMax();
		positionSpreadText();
		updateBrandVisibility();
		updateSwipeTextVisibility();
	});

	// if content changes size, observe
	const ro = new ResizeObserver(() => {
		updateSliderMax();
		positionSpreadText();
	});
	ro.observe(container);

	function getNextSnapPoint(current) {
		for (let i = 0; i < snapPoints.length; i += 1) {
			if (snapPoints[i] > current + 1) return snapPoints[i];
		}
		return null;
	}

	function animateScrollTo(target, duration) {
		const start = container.scrollLeft;
		const delta = target - start;
		if (Math.abs(delta) < 1) {
			isAutoScrolling = false;
			scheduleAutoAdvance();
			return;
		}
		autoScrollToken += 1;
		const token = autoScrollToken;
		const startTime = performance.now();
		function easeInOutCubic(t) {
			return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
		}
		function step(now) {
			if (token !== autoScrollToken) return;
			const elapsed = now - startTime;
			const t = Math.min(1, elapsed / duration);
			const eased = easeInOutCubic(t);
			container.scrollLeft = start + delta * eased;
			if (t < 1) {
				window.requestAnimationFrame(step);
			} else {
				isAutoScrolling = false;
				scheduleAutoAdvance();
			}
		}
		window.requestAnimationFrame(step);
	}

	function autoAdvance() {
		if (!AUTO_SLIDE_ENABLED) return;
		updateSliderMax();
		if (!snapPoints.length) return;
		const target = getNextSnapPoint(container.scrollLeft);
		if (target === null) return;
		isAutoScrolling = true;
		animateScrollTo(target, AUTO_SCROLL_DURATION_MS);
	}

	function scheduleAutoAdvance() {
		if (!AUTO_SLIDE_ENABLED) return;
		window.clearTimeout(idleTimer);
		idleTimer = window.setTimeout(autoAdvance, IDLE_MS);
	}

	function registerInteraction() {
		if (isAutoScrolling) {
			autoScrollToken += 1;
			isAutoScrolling = false;
		}
		scheduleAutoAdvance();
	}

	['pointerdown', 'touchstart', 'wheel'].forEach((eventName) => {
		container.addEventListener(eventName, registerInteraction, { passive: true });
	});

	document.addEventListener('keydown', function (event) {
		if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
			registerInteraction();
		}
	}, { passive: true });

	if (AUTO_SLIDE_ENABLED) {
		scheduleAutoAdvance();
	}
});


// Preloading scene
window.addEventListener('load', function() {
    const preloader = document.getElementById('preloader');
    
    // Add a slight delay if the page loads too fast for the animation to be seen
    setTimeout(() => {
        preloader.style.opacity = '0';
        // Remove from DOM after fade out for performance
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 200); 
    }, 1000); 
});
