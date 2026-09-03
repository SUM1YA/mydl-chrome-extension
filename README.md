# MyDL Chrome Extension

## Supported sites

### VK / VK.ru

Right-click a link or video and select **Send to MyDL**.

The request uses:

```json
{
  "url": "https://m.vk.ru/...",
  "isLive": false,
  "concurrentFragments": 2,
  "schedule": "",
  "cookieFile": "m.vk.ru_cookies.txt"
}
```

The extension also injects a small `↓ MyDL` button over detected HTML5 video elements as a convenience fallback.

### X.com

Each detected X post gets a `↓ MyDL` button in the post action bar.

It sends the canonical post URL, for example:

```text
https://x.com/user/status/123456789
```

with:

```json
{
  "url": "https://x.com/user/status/123456789",
  "isLive": false,
  "concurrentFragments": 2,
  "schedule": "",
  "cookieFile": "x.com_cookies.txt"
}
```

## API

The extension sends a `POST` request to the endpoint configured in the local
`api.js` file.

with `Content-Type: application/json`.

## Install

1. Extract this ZIP.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the extracted `mydl-chrome-extension-final` directory.

## Local HTTPS

If `https://mydl.local` uses a self-signed certificate, Chrome must trust that certificate.

If the API returns a CORS error, configure the API to accept requests from the extension origin.

## Important VK behavior

The VK context-menu action sends the link/media URL supplied by Chrome (`linkUrl` or `srcUrl`).

The injected VK button sends the containing page/card URL when possible. This is intentional: many VK media URLs are temporary/protected, while the downloader can resolve the page using its cookie file.
