(() => {
  "use strict";

  if (!/^(www\.)?x\.com$/i.test(location.hostname)) return;

  const BUTTON_ATTR = "data-mydl-x-button";
  const POST_SELECTOR = 'article[data-testid="tweet"]';

  function getPostUrl(article) {
    const links = article.querySelectorAll('a[href*="/status/"]');

    for (const link of links) {
      const href = link.getAttribute("href");
      if (!href) continue;

      try {
        const u = new URL(href, location.origin);
        if (
          (u.hostname === "x.com" || u.hostname === "www.x.com") &&
          /^\/[^/]+\/status\/\d+/.test(u.pathname)
        ) {
          return u.href.split("?")[0];
        }
      } catch (_) {}
    }

    return null;
  }

  function findActionBar(article) {
    const groups = article.querySelectorAll('[role="group"]');
    let best = null;

    for (const group of groups) {
      const buttons = group.querySelectorAll('button, [role="button"]');
      if (buttons.length >= 2) best = group;
    }

    return best;
  }

  function inject(article) {
    if (article.querySelector(`[${BUTTON_ATTR}]`)) return;

    const url = getPostUrl(article);
    if (!url) return;

    const bar = findActionBar(article);
    if (!bar) return;

    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute(BUTTON_ATTR, "true");
    button.setAttribute("aria-label", "Send post to MyDL");
    button.title = "Send post to MyDL";
    button.textContent = "↓ MyDL";

    button.style.cssText = [
      "margin-left:8px",
      "padding:0 8px",
      "height:32px",
      "border:0",
      "border-radius:16px",
      "background:transparent",
      "color:inherit",
      "font-size:13px",
      "font-weight:600",
      "cursor:pointer",
      "white-space:nowrap"
    ].join(";");

    button.addEventListener("mouseenter", () => {
      button.style.background = "rgba(29,155,240,.12)";
    });
    button.addEventListener("mouseleave", () => {
      button.style.background = "transparent";
    });

    button.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();

      button.disabled = true;
      const original = button.textContent;
      button.textContent = "Sending…";

      try {
        const result = await chrome.runtime.sendMessage({
          type: "send-to-mydl",
          url: getPostUrl(article) || url,
          cookieFile: "x.com_cookies.txt"
        });

        if (!result?.ok) throw new Error(result?.error || "Request failed");

        button.textContent = "✓ Sent";
      } catch (error) {
        console.error("MyDL X:", error);
        button.textContent = "✕ Error";
      }

      setTimeout(() => {
        if (button.isConnected) {
          button.textContent = original;
          button.disabled = false;
        }
      }, 1800);
    });

    bar.appendChild(button);
  }

  function scan() {
    document.querySelectorAll(POST_SELECTOR).forEach(inject);
  }

  scan();

  const observer = new MutationObserver(scan);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  setInterval(scan, 1500);
})();