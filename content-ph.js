(() => {
  "use strict";

  const hostname = location.hostname.toLowerCase();
  if (!hostname.endsWith("pornhub.com") && !hostname.endsWith("pornhub.org")) return;

  const BUTTON_ATTR = "data-mydl-ph-button";

  function getPageUrl(video) {
    const link = video.closest("a[href]");
    return link?.href || location.href;
  }

  function addButton(video) {
    if (!video || video.hasAttribute(BUTTON_ATTR)) return;

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

    if (getComputedStyle(wrapper).position === "static") wrapper.style.position = "relative";

    button.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();

      const original = button.textContent;
      button.disabled = true;
      button.textContent = "Sending...";

      try {
        const result = await chrome.runtime.sendMessage({
          type: "send-to-mydl",
          url: getPageUrl(video),
          cookieFile: "pornhub.com_cookies.txt"
        });
        if (!result?.ok) throw new Error(result?.error || "Request failed");
        button.textContent = "✓ Sent";
      } catch (error) {
        console.error("MyDL Pornhub:", error);
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

  scan();
  new MutationObserver(scan).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
  setInterval(scan, 1500);
})();