// Tab Cleanup - Background Service Worker
console.log('Tab Cleanup Service Worker Starting...');
import { processTabClose, isFeverTime, loadGameState } from './gamification.js';
import { getNotificationContent } from './notifications.js';
import { checkForUpdates } from './updates.js';

// デフォルト設定
const defaultSettings = {
  warnTime: '18:00',
  closeTime: '21:00',
  enableTimer: true,
  enableNotification: true,
  enableSound: false,
  enableSpreadsheet: false,
  spreadsheetUrl: '',
  sheetName: 'タブ記録'
};

// ---------------------------------------------------------
// Game Logic Integration
// ---------------------------------------------------------
let closedNormalTabsBuffer = 0;
let closedBlankTabsBuffer = 0;
let flushTimeout = null;

// Keep track of tab URLs to detect "Blank" tabs
const tabUrlMap = new Map();

function isBlankUrl(url) {
  if (!url) return true;
  return url === 'chrome://newtab/' || url === 'about:blank';
}

function flushClosedTabs() {
  if (closedNormalTabsBuffer > 0 || closedBlankTabsBuffer > 0) {
    processTabClose(closedNormalTabsBuffer, closedBlankTabsBuffer).then(result => {
      console.log('Processed closed tabs. Normal:', closedNormalTabsBuffer, 'Blank:', closedBlankTabsBuffer, 'ScoreDelta:', result.addedKarma);
      if (result && result.addedKarma !== 0) {
        const color = result.addedKarma > 0 ? '#FFD700' : '#808080';
        chrome.action.setBadgeText({ text: result.addedKarma > 0 ? 'Karma' : 'Loss' });
        chrome.action.setBadgeBackgroundColor({ color: color });
        setTimeout(() => chrome.action.setBadgeText({ text: '' }), 2000);
      }
    });
    closedNormalTabsBuffer = 0;
    closedBlankTabsBuffer = 0;
  }
}

// Track URL creation/updates
chrome.tabs.onCreated.addListener((tab) => {
  if (tab.id) tabUrlMap.set(tab.id, tab.url || '');
});
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.url) tabUrlMap.set(tabId, tab.url);
});
chrome.tabs.onReplaced.addListener((addedTabId, removedTabId) => {
  tabUrlMap.delete(removedTabId);
});

// Listen for tab closure
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  const url = tabUrlMap.get(tabId);

  if (url && isBlankUrl(url)) {
    closedBlankTabsBuffer++;
  } else {
    // If unknown, assume normal (since typical Ctrl+T usage is tracked)
    closedNormalTabsBuffer++;
  }

  // Clean up map
  tabUrlMap.delete(tabId);

  if (flushTimeout) clearTimeout(flushTimeout);
  flushTimeout = setTimeout(flushClosedTabs, 2000); // Debounce 2 sec
});

// Initialize map on startup
chrome.tabs.query({}, (tabs) => {
  tabs.forEach(t => tabUrlMap.set(t.id, t.url));
});


// ---------------------------------------------------------
// Update Check Logic
// ---------------------------------------------------------
async function performUpdateCheck() {
  const update = await checkForUpdates();
  if (update && update.hasUpdate) {
    chrome.action.setBadgeText({ text: 'NEW' });
    chrome.action.setBadgeBackgroundColor({ color: '#ff4081' }); // Pink

    showNotification(
      '✨ New Version Available',
      `v${update.latestVersion} が公開されました！\nGitHubから更新してください。`,
      true
    );
  }
}


// ---------------------------------------------------------
// Core Logic
// ---------------------------------------------------------

// 時刻文字列をDate objectに変換（今日の日付で）
function timeToDate(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

// アラームを設定
async function setupAlarms() {
  const settings = await chrome.storage.sync.get(defaultSettings);

  // 既存のアラームをクリア
  await chrome.alarms.clearAll();

  if (!settings.enableTimer) {
    console.log('Timer disabled');
    return;
  }

  const now = new Date();

  // 警告アラーム
  const warnDate = timeToDate(settings.warnTime);
  if (warnDate <= now) {
    warnDate.setDate(warnDate.getDate() + 1); // 翌日に設定
  }
  chrome.alarms.create('warnAlarm', {
    when: warnDate.getTime(),
    periodInMinutes: 24 * 60 // 毎日
  });

  // 終了アラーム
  const closeDate = timeToDate(settings.closeTime);
  if (closeDate <= now) {
    closeDate.setDate(closeDate.getDate() + 1); // 翌日に設定
  }
  chrome.alarms.create('closeAlarm', {
    when: closeDate.getTime(),
    periodInMinutes: 24 * 60 // 毎日
  });

  // Ranking Alarm (22:00)
  const rankingDate = new Date();
  rankingDate.setHours(22, 0, 0, 0);
  if (rankingDate <= now) {
    rankingDate.setDate(rankingDate.getDate() + 1);
  }
  chrome.alarms.create('rankingAlarm', {
    when: rankingDate.getTime(),
    periodInMinutes: 24 * 60
  });

  // Daily Update Check Alarm
  chrome.alarms.create('updateCheck', {
    periodInMinutes: 24 * 60
  });

  console.log('Alarms set:', {
    warn: warnDate.toLocaleString(),
    close: closeDate.toLocaleString(),
    ranking: rankingDate.toLocaleString()
  });
}

// 通知を表示
async function showNotification(title, message, requireInteraction = false, id = null) {
  const settings = await chrome.storage.sync.get(defaultSettings);

  if (!settings.enableNotification) return;

  const options = {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: title,
    message: message,
    requireInteraction: requireInteraction,
    buttons: [
      { title: '今すぐ確認' },
      { title: '後で' }
    ]
  };

  // Use specific ID if provided, otherwise auto-generated
  if (id) {
    chrome.notifications.create(id, options);
  } else {
    chrome.notifications.create(options);
  }
}

// タブ一覧を取得
async function getAllTabs() {
  const tabs = await chrome.tabs.query({});
  return tabs.map(tab => ({
    title: tab.title,
    url: tab.url,
    id: tab.id
  }));
}

// タブを記録して閉じる
async function recordAndCloseTabs() {
  const tabs = await getAllTabs();

  // ストレージに保存
  const { tabHistory = [] } = await chrome.storage.local.get('tabHistory');
  tabHistory.push({
    date: new Date().toISOString(),
    tabs: tabs
  });

  // 最新100件のみ保持
  if (tabHistory.length > 100) {
    tabHistory.splice(0, tabHistory.length - 100);
  }

  await chrome.storage.local.set({ tabHistory });

  // Spreadsheet連携
  const settings = await chrome.storage.sync.get(defaultSettings);
  if (settings.enableSpreadsheet && settings.spreadsheetUrl) {
    await saveToSpreadsheet(tabs, settings);
  }

  // 新しいタブを開いてから他を閉じる
  const newTab = await chrome.tabs.create({ url: 'chrome://newtab' });

  let closedCount = 0;

  for (const tab of tabs) {
    if (tab.id !== newTab.id) {
      try {
        await chrome.tabs.remove(tab.id);
        closedCount++;
      } catch (e) {
        console.log('Could not close tab:', tab.url);
      }
    }
  }

  if (closedCount > 0) {
    const content = getNotificationContent('cleanup', { count: closedCount });
    showNotification(content.title, content.message);
  } else {
    // 0 tabs closed (Already clean)
    const content = getNotificationContent('clean');
    showNotification(content.title, content.message);
  }
}

// Spreadsheetに保存（GAS Web App経由）
async function saveToSpreadsheet(tabs, settings) {
  try {
    const match = settings.spreadsheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      return;
    }
    // GAS Web Appに送信（要別途GASデプロイ）
  } catch (error) {
    console.error('Failed to save to Spreadsheet:', error);
  }
}

// ---------------------------------------------------------
// Ranking Submission Logic
// ---------------------------------------------------------
const RANKING_API_URL = 'https://tab-cleaner-worker.aki-2c0.workers.dev/submit-score';

async function getOrCreateUUID() {
  const { userUUID } = await chrome.storage.sync.get('userUUID');
  if (userUUID) return userUUID;

  const newUUID = crypto.randomUUID();
  await chrome.storage.sync.set({ userUUID: newUUID });
  return newUUID;
}

async function submitDailyRanking() {
  try {
    // Get Data
    const state = await loadGameState();
    const { angelName } = await chrome.storage.sync.get('angelName');
    const uuid = await getOrCreateUUID();

    // Payload
    const payload = {
      uuid: uuid,
      angelName: angelName || 'Anonymous Angel',
      karma: state.karma,
      tabsClosed: state.totalTabsClosed,
      timestamp: new Date().toISOString()
    };

    console.log('Submitting ranking score...', payload);

    // Send to Cloudflare Worker
    const response = await fetch(RANKING_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Server error');
    }

    console.log('Ranking submitted successfully');

  } catch (e) {
    console.error('Failed to submit ranking:', e);
  }
}

// アラーム発火時の処理
chrome.alarms.onAlarm.addListener(async (alarm) => {
  console.log('Alarm fired:', alarm.name);

  if (alarm.name === 'warnAlarm') {
    const content = getNotificationContent('warn');
    showNotification(content.title, content.message, true);
  }

  if (alarm.name === 'closeAlarm') {
    const content = getNotificationContent('close');
    showNotification(content.title, content.message, true);
    await recordAndCloseTabs();
  }

  if (alarm.name === 'rankingAlarm') {
    const content = getNotificationContent('ranking');
    showNotification(content.title, content.message);

    // Submit to Backend
    await submitDailyRanking();
  }

  if (alarm.name === 'updateCheck') {
    await performUpdateCheck();
  }
});

// 通知ボタンクリック時の処理
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (buttonIndex === 0) {
    if (notificationId === 'update_available') {
      // Update通知の場合は拡張機能管理ページを開く
      chrome.tabs.create({ url: 'chrome://extensions/' });
    } else {
      // 通常の通知はポップアップ（またはダッシュボード）
      chrome.tabs.create({ url: 'popup.html' });
    }
  }
  chrome.notifications.clear(notificationId);
});

// メッセージ受信
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateAlarms') {
    setupAlarms();
  }

  if (message.action === 'startReview') {
    console.log('Review mode started for', message.tabs.length, 'tabs');
  }

  if (message.action === 'grantBonus') {
    import('./gamification.js').then(module => {
      module.addBonus(message.amount).then(newKarma => {
        console.log('Bonus granted:', message.amount, 'Total:', newKarma);
      });
    });
  }

  return true;
});

// 拡張機能インストール/更新時
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Tab Cleanup installed/updated:', details.reason);
  setupAlarms();

  if (details.reason === 'install') {
    chrome.tabs.create({ url: 'welcome.html' });
  }

  // Check for updates on install/update interaction
  performUpdateCheck();
});

// ブラウザ起動時
chrome.runtime.onStartup.addListener(() => {
  console.log('Browser started, setting up alarms');
  setupAlarms();
  performUpdateCheck();
});
