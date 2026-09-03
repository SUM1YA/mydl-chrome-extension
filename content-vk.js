(() => {
  "use strict";

  const VK_HOSTS = new Set([
    "vk.ru", "m.vk.ru", "www.vk.ru",
    "vk.com", "m.vk.com", "www.vk.com"
  ]);

  if (!VK_HOSTS.has(location.hostname.toLowerCase())) return;

  const BUTTON_ATTR = "data-mydl-vk-button";

  function isVideoElement(el) {
    return el instanceof HTMLVideoElement;
  }

  function getVideoPageUrl(video) {
    // A video element can be nested inside a link/card.
    const link = video.closest("a[href]");
    if (link?.href) return link.href;

    // Otherwise use the current page URL.
    return location.href;
  }

  function getVideoSource(video) {
    // Prefer currentSrc, which is the source currently selected by the browser.
    if (video.currentSrc) return video.currentSrc;

    const source = video.querySelector("source[src]");
    if (source?.src) return source.src;

    if (video.src) return video.src;

    return null;
  }

  function addButton(video) {
    if (!video || video.hasAttribute(BUTTON_ATTR)) return;

    // Wait until the video has a usable page/card URL.
    const pageUrl = getVideoPageUrl(video);
    if (!pageUrl) return;

    const wrapper = video.parentElement;
    if (!wrapper) return;

    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute(BUTTON_ATTR, "true");
    button.setAttribute("aria-label", "Send video to MyDL");
    button.title = "Send video to MyDL";
    button.textContent = "↓ MyDL";

    button.style.cssText = [
      "position:absolute",
      "right:12px",
      "top:12px",
      "z-index:2147483647",
      "padding:7px 10px",
      "border:0",
      "border-radius:16px",
      "background:rgba(0,0,0,.72)",
      "color:#fff",
      "font:600 13px sans-serif",
      "cursor:pointer",
      "box-shadow:0 2px 8px rgba(0,0,0,.35)"
    ].join(";");

    // Only use absolute positioning if the wrapper can contain it.
    const position = getComputedStyle(wrapper).position;
    if (position === "static") wrapper.style.position = "relative";

    button.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();

      const url = getVideoPageUrl(video) || getVideoSource(video);
      if (!url) {
        button.textContent = "No URL";
        setTimeout(() => button.textContent = "↓ MyDL", 1500);
        return;
      }

      const original = button.textContent;
      button.disabled = true;
      button.textContent = "Sending…";

      try {
        const result = await chrome.runtime.sendMessage({
          type: "send-to-mydl",
          url,
          cookieFile: "m.vk.ru_cookies.txt"
        });

        if (!result?.ok) throw new Error(result?.error || "Request failed");
        button.textContent = "✓ Sent";
      } catch (error) {
        console.error("MyDL VK:", error);
        button.textContent = "✕ Error";
      }

      setTimeout(() => {
        if (button.isConnected) {
          button.textContent = original;
          button.disabled = false;
        }
      }, 1800);
    });

    wrapper.appendChild(button);
  }

  function scan() {
    document.querySelectorAll("video").forEach(addButton);
  }

  // Right-click context menu remains the primary VK method.
  // This injected button is a fallback/convenience for pages where
  // the media element itself is easier to identify than the link.
  scan();

  const observer = new MutationObserver(scan);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  setInterval(scan, 1500);
})();