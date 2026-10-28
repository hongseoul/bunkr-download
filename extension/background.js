// Service worker: opens the app tab from the toolbar icon or a link's context menu.

const APP = 'app.html';
// Same shape parser.js accepts as an album URL.
const ALBUM_URL = /^https?:\/\/(?:[\w-]+\.)?bunkr\.[a-z]{2,}(?:\.[a-z]{2,})?\/a\/[^/?#]+/i;

async function openApp(albumUrl = '') {
  const base = chrome.runtime.getURL(APP);
  if (!albumUrl) {
    const [open] = await chrome.tabs.query({ url: `${base}*` }).catch(() => []);
    if (open) {
      await chrome.tabs.update(open.id, { active: true });
      await chrome.windows.update(open.windowId, { focused: true });
      return;
    }
  }
  await chrome.tabs.create({ url: albumUrl ? `${base}?album=${encodeURIComponent(albumUrl)}` : base });
}

chrome.action.onClicked.addListener((tab) => {
  openApp(tab?.url && ALBUM_URL.test(tab.url) ? tab.url : '');
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'open-album',
    title: 'Open in bunkr-download',
    contexts: ['link'],
    targetUrlPatterns: ['https://*/a/*'],
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === 'open-album' && ALBUM_URL.test(info.linkUrl || '')) openApp(info.linkUrl);
});
