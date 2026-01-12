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
const toastEl = document.getElementById('toast');

// デフォルト設定
const defaultSettings = {
  warnTime: '18:00',
  closeTime: '21:00',
  enableTimer: true,
  spreadsheetUrl: '',
  sheetName: 'タブ記録',
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
  sheetNameInput.value = settings.sheetName;
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
    spreadsheetUrl: spreadsheetUrlInput.value,
    sheetName: sheetNameInput.value,
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

// イベントリスナー
saveBtn.addEventListener('click', saveSettings);
resetBtn.addEventListener('click', resetSettings);
clearHistoryBtn.addEventListener('click', clearHistory);

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  loadHistory();
});
