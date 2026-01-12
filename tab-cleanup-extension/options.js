// DOM要素
const warnTimeInput = document.getElementById('warnTime');
const closeTimeInput = document.getElementById('closeTime');
const enableTimerInput = document.getElementById('enableTimer');
const spreadsheetUrlInput = document.getElementById('spreadsheetUrl');
const sheetNameInput = document.getElementById('sheetName');
const enableSpreadsheetInput = document.getElementById('enableSpreadsheet');
const enableNotificationInput = document.getElementById('enableNotification');
const enableSoundInput = document.getElementById('enableSound');
const historyList = document.getElementById('historyList');

const saveBtn = document.getElementById('saveBtn');
const resetBtn = document.getElementById('resetBtn');
const clearHistoryBtn = document.getElementById('clearHistory');
const closeOptionsBtn = document.getElementById('closeOptionsBtn');

// New Elements
const toggleGasSetupBtn = document.getElementById('toggleGasSetup');
const gasSetupContent = document.getElementById('gasSetupContent');
const gasArrow = document.getElementById('gasArrow');
const copyGasBtn = document.getElementById('copyGasBtn');
const testConnectionBtn = document.getElementById('testConnectionBtn');
const testResult = document.getElementById('testResult');

const toastEl = document.getElementById('toast');

// GAS Code (Same as welcome.js)
const GAS_CODE = `/**
 * Tab Cleanup - Google Apps Script
 * Spreadsheet連携用のWeb App
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('tabCleaner'); 
    
    if (!sheet) {
      sheet = ss.insertSheet('tabCleaner');
      sheet.appendRow(['Date', 'Time', 'Tab Count', 'Titles', 'URLs']);
      sheet.setFrozenRows(1);
    }
    
    // data.tabs is an array of {title, url}
    const timestamp = new Date();
    const dateStr = Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    const timeStr = Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'HH:mm:ss');
    
    const titles = data.tabs.map(t => t.title).join('\\n');
    const urls = data.tabs.map(t => t.url).join('\\n');
    
    sheet.appendRow([dateStr, timeStr, data.tabs.length, titles, urls]);
    
    return ContentService.createTextOutput(JSON.stringify({status: 'success'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({status: 'error', message: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput('Active');
}`;

// デフォルト設定
const defaultSettings = {
  warnTime: '18:00',
  closeTime: '21:00',
  enableTimer: true,
  spreadsheetUrl: '',
  sheetName: 'tabCleaner',
  enableSpreadsheet: false,
  enableNotification: true,
  enableSound: false
};

// Toast表示
function showToast(message, duration = 3000) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), duration);
}

// 設定を読み込み
async function loadSettings() {
  const settings = await chrome.storage.sync.get(defaultSettings);

  warnTimeInput.value = settings.warnTime;
  closeTimeInput.value = settings.closeTime;
  enableTimerInput.checked = settings.enableTimer;
  spreadsheetUrlInput.value = settings.spreadsheetUrl;
  sheetNameInput.value = settings.sheetName || 'tabCleaner';
  enableSpreadsheetInput.checked = settings.enableSpreadsheet;
  enableNotificationInput.checked = settings.enableNotification;
  enableSoundInput.checked = settings.enableSound;
}

// 設定を保存
async function saveSettings() {
  const settings = {
    warnTime: warnTimeInput.value,
    closeTime: closeTimeInput.value,
    enableTimer: enableTimerInput.checked,
    spreadsheetUrl: spreadsheetUrlInput.value.trim(),
    sheetName: sheetNameInput.value.trim(),
    enableSpreadsheet: enableSpreadsheetInput.checked,
    enableNotification: enableNotificationInput.checked,
    enableSound: enableSoundInput.checked
  };

  await chrome.storage.sync.set(settings);

  // background.jsにアラームを再設定するよう通知
  chrome.runtime.sendMessage({ action: 'updateAlarms', settings });

  showToast('✅ 設定を保存しました！');
}

// 設定をリセット
async function resetSettings() {
  if (!confirm('設定をデフォルトに戻しますか？')) return;

  await chrome.storage.sync.set(defaultSettings);
  await loadSettings();
  showToast('🔄 設定をリセットしました');
}

// 履歴を読み込み
async function loadHistory() {
  const { tabHistory = [] } = await chrome.storage.local.get('tabHistory');

  if (tabHistory.length === 0) {
    historyList.innerHTML = '<p class="no-history">まだ記録がありません</p>';
    return;
  }

  // 最新10件を表示
  const recentHistory = tabHistory.slice(-10).reverse();

  historyList.innerHTML = recentHistory.map(record => {
    const date = new Date(record.date);
    const dateStr = date.toLocaleDateString('ja-JP');
    const timeStr = date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });

    return `
      <div class="history-item">
        <span class="history-date">${dateStr} ${timeStr}</span>
        <span class="history-count">${record.tabs.length}タブ</span>
      </div>
    `;
  }).join('');
}

// 履歴を削除
async function clearHistory() {
  if (!confirm('すべての履歴を削除しますか？\nこの操作は取り消せません。')) return;

  await chrome.storage.local.set({ tabHistory: [] });
  await loadHistory();
  showToast('🗑️ 履歴を削除しました');
}

// Test & Save Connection
async function testAndSaveConnection() {
  const url = spreadsheetUrlInput.value.trim();
  if (!url) {
    showToast('❌ URLを入力してください');
    return;
  }

  testConnectionBtn.disabled = true;
  testConnectionBtn.textContent = '⏳';
  testResult.style.display = 'block';
  testResult.innerHTML = 'Connecting...';
  // Save button is secondary now, maybe disable it or just let it be

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const testData = {
      tabs: [
        { title: "Test & Save (Options)", url: "chrome://settings" }
      ]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(testData),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`Status ${response.status}`);

    // Success! Save settings immediately
    const settings = await chrome.storage.sync.get(defaultSettings);
    settings.spreadsheetUrl = url;
    settings.enableSpreadsheet = true; // Auto-enable on success
    settings.sheetName = 'tabCleaner'; // Force default
    await chrome.storage.sync.set(settings);

    // Update UI to reflect saved state
    enableSpreadsheetInput.checked = true;

    testResult.style.color = '#10b981';
    testResult.innerHTML = '✅ 接続成功！設定を保存しました';
    showToast('✅ テスト成功 & 保存完了');

    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Tab Cleanup',
      message: '🎉 GAS連携成功！\n設定を保存し、連携を有効にしました。'
    });

  } catch (e) {
    console.error(e);
    testResult.style.color = '#ef4444';
    let msg = e.message;
    if (e.name === 'AbortError') msg = 'Timeout';
    testResult.innerHTML = `❌ エラー: ${msg}`;

    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Tab Cleanup',
      message: `💔 接続テスト失敗: ${msg}\nURLを確認してください。`
    });
  } finally {
    testConnectionBtn.disabled = false;
    testConnectionBtn.textContent = 'Test & Save'; // Label update
  }
}

// Copy Code
async function copyGasCode() {
  try {
    await navigator.clipboard.writeText(GAS_CODE);
    showToast('📋 GASコードをコピーしました');
  } catch (e) {
    showToast('❌ コピー失敗');
  }
}

// イベントリスナー
saveBtn.addEventListener('click', saveSettings);
resetBtn.addEventListener('click', resetSettings);
clearHistoryBtn.addEventListener('click', clearHistory);
closeOptionsBtn.addEventListener('click', () => {
  // Try to close tab, if popup it closes, if tab it might block but usually works for extension pages
  window.close();
});

toggleGasSetupBtn.addEventListener('click', () => {
  const isHidden = gasSetupContent.style.display === 'none';
  gasSetupContent.style.display = isHidden ? 'block' : 'none';
  gasArrow.textContent = isHidden ? '▲' : '▼';
});

copyGasBtn.addEventListener('click', copyGasCode);
testConnectionBtn.addEventListener('click', testAndSaveConnection);

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  loadHistory();
});
