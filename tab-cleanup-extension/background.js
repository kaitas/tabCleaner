// Tab Cleanup - Background Service Worker

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
  
  console.log('Alarms set:', {
    warn: warnDate.toLocaleString(),
    close: closeDate.toLocaleString()
  });
}

// 通知を表示
async function showNotification(title, message, requireInteraction = false) {
  const settings = await chrome.storage.sync.get(defaultSettings);
  
  if (!settings.enableNotification) return;
  
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: title,
    message: message,
    requireInteraction: requireInteraction,
    buttons: [
      { title: '今すぐ確認' },
      { title: '後で' }
    ]
  });
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
  
  for (const tab of tabs) {
    if (tab.id !== newTab.id) {
      try {
        await chrome.tabs.remove(tab.id);
      } catch (e) {
        console.log('Could not close tab:', tab.url);
      }
    }
  }
  
  showNotification(
    '🧹 タブをお片付けしました',
    `${tabs.length}個のタブを記録して閉じました。おつかれさまでした！`
  );
}

// Spreadsheetに保存（GAS Web App経由）
async function saveToSpreadsheet(tabs, settings) {
  try {
    // SpreadsheetのURLからIDを抽出
    const match = settings.spreadsheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      console.error('Invalid Spreadsheet URL');
      return;
    }
    
    // GAS Web Appに送信（要別途GASデプロイ）
    // この実装はGAS側のエンドポイントが必要
    console.log('Spreadsheet save would happen here:', {
      spreadsheetId: match[1],
      sheetName: settings.sheetName,
      tabCount: tabs.length
    });
    
  } catch (error) {
    console.error('Failed to save to Spreadsheet:', error);
  }
}

// アラーム発火時の処理
chrome.alarms.onAlarm.addListener(async (alarm) => {
  console.log('Alarm fired:', alarm.name);
  
  if (alarm.name === 'warnAlarm') {
    const tabs = await getAllTabs();
    showNotification(
      '⏰ タブ確認の時間です',
      `現在 ${tabs.length}個 のタブが開いています。本当に必要なタブだけ残しましょう！`,
      true
    );
  }
  
  if (alarm.name === 'closeAlarm') {
    await recordAndCloseTabs();
  }
});

// 通知ボタンクリック時の処理
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (buttonIndex === 0) {
    // 「今すぐ確認」- ポップアップを開く代わりに新しいタブで設定を開く
    chrome.tabs.create({ url: 'popup.html' });
  }
  chrome.notifications.clear(notificationId);
});

// メッセージ受信
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateAlarms') {
    setupAlarms();
  }
  
  if (message.action === 'startReview') {
    // 各タブにバッジや通知を表示する処理（将来実装）
    console.log('Review mode started for', message.tabs.length, 'tabs');
  }
  
  return true;
});

// 拡張機能インストール/更新時
chrome.runtime.onInstalled.addListener(() => {
  console.log('Tab Cleanup installed/updated');
  setupAlarms();
});

// ブラウザ起動時
chrome.runtime.onStartup.addListener(() => {
  console.log('Browser started, setting up alarms');
  setupAlarms();
});
