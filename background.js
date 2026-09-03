importScripts("api.js");

const API_URL = globalThis.MYDL_CONFIG?.API_URL;

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "send-to-mydl",
    title: "Send to MyDL",
    contexts: ["link", "video"],
    documentUrlPatterns: [
      "*://vk.ru/*", "*://*.vk.ru/*",
      "*://vk.com/*", "*://*.vk.com/*",
      "*://pornhub.org/*", "*://*.pornhub.org/*",
      "*://pornhub.com/*", "*://*.pornhub.com/*"
    ]
  });
});

chrome.contextMenus.onClicked.addListener(async (info) => {
  const url = info.linkUrl || info.srcUrl;
  if (!url) {
    notify("MyDL", "No URL found.");
    return;
  }
  await submitJob(url, getCookieFile(info.pageUrl || url));
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "send-to-mydl") return;

  submitJob(message.url, message.cookieFile)
    .then(result => sendResponse({ ok: true, result }))
    .catch(error => sendResponse({
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    }));

  return true;
});

async function submitJob(url, cookieFile) {
  if (typeof url !== "string" || !url.trim()) {
    throw new Error("Invalid URL.");
  }

  const payload = {
    url: url.trim(),
    isLive: false,
    concurrentFragments: 2,
    schedule: "",
    cookieFile
  };

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${text || response.statusText}`);
  }

  notify("MyDL - Download queued", payload.url);
  return text;
}

function notify(title, message) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icon.svg",
    title,
    message: String(message).slice(0, 250)
  });
}

function getCookieFile(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (hostname === "pornhub.com" || hostname.endsWith(".pornhub.com") ||
        hostname === "pornhub.org" || hostname.endsWith(".pornhub.org")) {
      return "pornhub.com_cookies.txt";
    }
  } catch (_) {}

  return "m.vk.ru_cookies.txt";
}