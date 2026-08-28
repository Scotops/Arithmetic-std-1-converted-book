/* Keep a separate, muted sign-video layer independent from ADT narration. */
(() => {
  const YEAR = 31536000;
  let signClone = null;
  let autoplayPending = false;
  let gestureRetryPending = false;

  const setReaderMode = key => {
    try { localStorage.setItem(key, "true"); } catch (_) {}
    try { document.cookie = `${key}=true; path=/; max-age=${YEAR}`; } catch (_) {}
  };
  // Keep both accessibility tools available, but do not couple their playback.
  setReaderMode("signLanguageMode");
  setReaderMode("readAloudMode");

  const isSourceVideo = media => media instanceof HTMLVideoElement &&
    /\/content\/i18n\/[^/]+\/video\/page_\d+\.mp4(?:[?#]|$)/.test(media.currentSrc || media.src || "") &&
    !media.dataset.signLanguageClone;
  const clearGestureRetry = () => {
    if (!gestureRetryPending) return;
    gestureRetryPending = false;
    document.removeEventListener("pointerdown", retryAfterGesture, true);
    document.removeEventListener("keydown", retryAfterGesture, true);
  };

  const scheduleGestureRetry = () => {
    if (gestureRetryPending || !autoplayPending) return;
    gestureRetryPending = true;
    document.addEventListener("pointerdown", retryAfterGesture, true);
    document.addEventListener("keydown", retryAfterGesture, true);
  };

  function retryAfterGesture() {
    clearGestureRetry();
    playSignVideo();
  }

  const playSignVideo = () => {
    if (!autoplayPending || !signClone || !signClone.paused || signClone.ended) return;
    Promise.resolve(signClone.play()).then(() => {
      autoplayPending = false;
      clearGestureRetry();
    }).catch(scheduleGestureRetry);
  };

  // The ADT's React component pauses its own sign video when voice mode is
  // selected. Hide that lifecycle video and render an independent clone in a
  // shadow root, just as the reference book does. React cannot pause or
  // receive play events from the clone, while its layout stays unchanged.
  const createIndependentVideo = source => {
    if (!isSourceVideo(source) || source.dataset.signLanguageSource) return;
    source.dataset.signLanguageSource = "true";
    source.defaultMuted = true;
    source.muted = true;
    source.volume = 0;
    source.pause();
    source.removeAttribute("autoplay");
    source.style.display = "none";

    const clone = source.cloneNode(true);
    clone.dataset.signLanguageClone = "true";
    clone.defaultMuted = true;
    clone.muted = true;
    clone.volume = 0;
    clone.setAttribute("muted", "");
    clone.autoplay = true;
    clone.setAttribute("autoplay", "");
    clone.playsInline = true;
    clone.setAttribute("playsinline", "");
    clone.preload = "auto";
    // cloneNode copies the hidden source element's inline `display: none`.
    // Restore a normal display value so the actual signer image is visible.
    clone.style.display = "block";
    clone.style.width = "100%";
    clone.style.height = "calc(100% - 1.5rem)";
    clone.style.objectFit = "contain";
    clone.style.background = "black";

    const host = document.createElement("div");
    host.dataset.signLanguageHost = "true";
    host.style.width = "100%";
    host.style.height = "100%";
    source.insertAdjacentElement("afterend", host);
    host.attachShadow({ mode: "open" }).appendChild(clone);
    signClone = clone;
    autoplayPending = true;
    clone.addEventListener("loadedmetadata", playSignVideo, { once: true });
    clone.addEventListener("canplay", playSignVideo, { once: true });
    clone.load();
    playSignVideo();
  };

  const scan = root => {
    if (root instanceof HTMLVideoElement) createIndependentVideo(root);
    if (root?.querySelectorAll) root.querySelectorAll("video").forEach(createIndependentVideo);
  };

  const nativePlay = HTMLMediaElement.prototype.play;
  const nativePause = HTMLMediaElement.prototype.pause;
  HTMLMediaElement.prototype.play = function (...args) {
    if (isSourceVideo(this)) {
      createIndependentVideo(this);
      return Promise.resolve();
    }
    return nativePlay.apply(this, args);
  };
  HTMLMediaElement.prototype.pause = function (...args) {
    if (isSourceVideo(this)) return;
    return nativePause.apply(this, args);
  };

  scan(document);
  new MutationObserver(records => {
    records.forEach(record => record.addedNodes.forEach(scan));
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
