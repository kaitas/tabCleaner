import { loadGameState, isFeverTime } from './gamification.js';

// DOM要素の取得
const tabCountEl = document.getElementById('tabCount');
const warnTimeEl = document.getElementById('warnTime');
const closeTimeEl = document.getElementById('closeTime');
const statusEl = document.getElementById('status');
const toastEl = document.getElementById('toast');
const karmaCountEl = document.getElementById('karmaCount');
const feverRowEl = document.getElementById('feverRow');

// Views
const mainView = document.getElementById('mainView');
const reviewView = document.getElementById('reviewView');

// メイン画面のボタン
const copyBtn = document.getElementById('copyBtn');
const reviewBtn = document.getElementById('reviewBtn');
const closeAllBtn = document.getElementById('closeAllBtn');
const exportBtn = document.getElementById('exportBtn');
const settingsBtn = document.getElementById('settingsBtn');

// レビュー画面のDOM要素
const tabListEl = document.getElementById('tabList');
const closeSelectedBtn = document.getElementById('closeSelectedBtn');
const selectedCountEl = document.getElementById('selectedCount');
const cancelReviewBtn = document.getElementById('cancelReviewBtn');

// Toast表示
function showToast(message, duration = 2000) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), duration);
}

// ビュー切り替え
function switchView(viewName) {
  if (viewName === 'review') {
    mainView.classList.add('hidden');
    reviewView.classList.remove('hidden');
  } else {
    reviewView.classList.add('hidden');
    mainView.classList.remove('hidden');
  }
}

// タブ数を更新
async function updateTabCount() {
  const tabs = await chrome.tabs.query({});
  tabCountEl.textContent = tabs.length;
}

// ゲーム状態（Karma/Fever）の更新
async function updateGameState() {
  const state = await loadGameState();
  const fever = isFeverTime();

  if (karmaCountEl) {
    karmaCountEl.textContent = state.karma.toLocaleString();
  }

  if (feverRowEl) {
    if (fever) {
      feverRowEl.style.display = 'flex';
      // Add visual flair?
      if (!feverRowEl.classList.contains('pulse')) {
        feverRowEl.classList.add('pulse');
      }
    } else {
      feverRowEl.style.display = 'none';
    }
  }
}

// Load Angel Name
chrome.storage.sync.get(['angelName'], (result) => {
  const angelNameDisplay = document.getElementById('angelNameDisplay');
  if (angelNameDisplay && result.angelName) {
    angelNameDisplay.textContent = result.angelName;
  }
});

// Settings Button
if (settingsBtn) {
  settingsBtn.addEventListener('click', () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options.html'));
    }
  });
}

// 設定を読み込み
async function loadSettings() {
  const settings = await chrome.storage.sync.get({
    warnTime: '18:00',
    closeTime: '21:00'
  });
  if (warnTimeEl) warnTimeEl.textContent = settings.warnTime;
  if (closeTimeEl) closeTimeEl.textContent = settings.closeTime;
}

// タブ一覧を取得
async function getAllTabs() {
  const tabs = await chrome.tabs.query({});
  return tabs.map(tab => ({
    title: tab.title,
    url: tab.url,
    favIconUrl: tab.favIconUrl,
    id: tab.id // key properties
  }));
}

// 履歴に保存 (Legacy logic, keeping for direct calls)
async function saveHistory(tabs) {
  const history = await chrome.storage.local.get({ tabHistory: [] });
  history.tabHistory.push({
    date: new Date().toISOString(),
    tabs: tabs
  });
  await chrome.storage.local.set({ tabHistory: history.tabHistory });
}

// タブ一覧をテキストに変換
function tabsToText(tabs) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('ja-JP');
  const timeStr = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });

  let text = `# タブ一覧 (${dateStr} ${timeStr})\n\n`;
  text += `合計: ${tabs.length}タブ\n\n`;

  tabs.forEach((tab, i) => {
    text += `${i + 1}. ${tab.title}\n   ${tab.url}\n\n`;
  });

  return text;
}

// Markdown形式に変換（ブログ用）
function tabsToMarkdown(tabs) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('ja-JP');
  const timeStr = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });

  let md = `---\ntitle: "今日開いてたタブ (${dateStr})"\ndate: ${now.toISOString()}\n---\n\n`;
  md += `## ${dateStr} ${timeStr} のタブ記録\n\n`;
  md += `今日は **${tabs.length}個** のタブを開いていました。\n\n`;

  // カテゴリ分け（簡易版：ドメイン別）
  const byDomain = {};
  tabs.forEach(tab => {
    try {
      const url = new URL(tab.url);
      const domain = url.hostname;
      if (!byDomain[domain]) byDomain[domain] = [];
      byDomain[domain].push(tab);
    } catch {
      if (!byDomain['その他']) byDomain['その他'] = [];
      byDomain['その他'].push(tab);
    }
  });

  Object.entries(byDomain)
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([domain, domainTabs]) => {
      md += `### ${domain} (${domainTabs.length})\n\n`;
      domainTabs.forEach(tab => {
        md += `- [${tab.title}](${tab.url})\n`;
      });
      md += '\n';
    });

  md += `---\n\n*Tab Cleanup で自動生成*\n`;

  return md;
}

// タブリストを描画（レビュー画面用）
async function renderTabList() {
  const tabs = await getAllTabs();
  tabListEl.innerHTML = '';

  tabs.forEach(tab => {
    const item = document.createElement('div');
    item.className = 'tab-item';

    // チェックボックス
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'tab-checkbox';
    checkbox.checked = true; // デフォルトで全て選択
    checkbox.dataset.tabId = tab.id;

    // ファビコン
    const favicon = document.createElement('img');
    favicon.className = 'tab-favicon';
    favicon.src = tab.favIconUrl || 'icons/icon16.png'; // fallback
    favicon.onerror = () => { favicon.src = 'icons/icon16.png'; }; // error handler

    // 情報コンテナ
    const info = document.createElement('div');
    info.className = 'tab-info';

    const title = document.createElement('div');
    title.className = 'tab-title';
    title.textContent = tab.title;

    const url = document.createElement('div');
    url.className = 'tab-url';
    url.textContent = tab.url;

    info.appendChild(title);
    info.appendChild(url);

    item.appendChild(checkbox);
    item.appendChild(favicon);
    item.appendChild(info);

    // 行クリックでトグル
    item.addEventListener('click', (e) => {
      if (e.target !== checkbox) {
        checkbox.checked = !checkbox.checked;
        updateSelectedCount();
      }
    });

    checkbox.addEventListener('change', updateSelectedCount);

    tabListEl.appendChild(item);
  });

  updateSelectedCount();
}

// 選択数の更新
function updateSelectedCount() {
  const checkedCount = document.querySelectorAll('.tab-checkbox:checked').length;
  selectedCountEl.textContent = checkedCount;
}

// コピーボタン
copyBtn.addEventListener('click', async () => {
  const tabs = await getAllTabs();
  const text = tabsToText(tabs);

  await navigator.clipboard.writeText(text);
  showToast(`✅ ${tabs.length}タブをコピーしました！`);
});

// レビューボタン（画面切り替え）
reviewBtn.addEventListener('click', async () => {
  await renderTabList();
  switchView('review');
});

// キャンセルボタン
cancelReviewBtn.addEventListener('click', () => {
  switchView('main');
});

// 選択して閉じるボタン
closeSelectedBtn.addEventListener('click', async () => {
  const checkedBoxes = document.querySelectorAll('.tab-checkbox:checked');
  const count = checkedBoxes.length;

  if (count === 0) {
    showToast('⚠️ 閉じるタブが選択されていません');
    return;
  }

  if (!confirm(`選択した ${count} 個のタブを閉じて記録しますか？`)) {
    return;
  }

  const tabIdsToClose = Array.from(checkedBoxes).map(cb => parseInt(cb.dataset.tabId));

  // 閉じる対象のタブ情報を取得して記録
  const allTabs = await getAllTabs();
  const tabsToRecord = allTabs.filter(t => tabIdsToClose.includes(t.id));

  await saveHistory(tabsToRecord);

  // タブを閉じる
  for (const id of tabIdsToClose) {
    try {
      await chrome.tabs.remove(id);
      // Background listener will handle karma update
    } catch (e) {
      console.log('Error closing tab:', id, e);
    }
  }

  showToast(`🧹 ${count}タブを閉じて記録しました！`);
  // Update UI after a short delay to allow background processing
  setTimeout(() => {
    updateTabCount();
    updateGameState();
  }, 500);
  switchView('main');
});

// 全て閉じるボタン
closeAllBtn.addEventListener('click', async () => {
  if (!confirm('本当に全てのタブを閉じて記録しますか？\n\n※このタブ以外全て閉じます')) {
    return;
  }

  const tabs = await getAllTabs();

  await saveHistory(tabs);

  // 現在のタブ以外を閉じる
  const currentTab = await chrome.tabs.getCurrent();
  const allTabs = await chrome.tabs.query({});

  for (const tab of allTabs) {
    if (tab.id !== currentTab?.id) {
      try {
        await chrome.tabs.remove(tab.id);
        // Background listener handles karma
      } catch (e) {
        console.log('タブを閉じられませんでした:', tab.url);
      }
    }
  }

  showToast(`🧹 ${tabs.length - 1}タブを閉じて記録しました！`);
  // Update UI after delay
  setTimeout(() => {
    updateTabCount();
    updateGameState();
  }, 500);
});

// ブログ出力ボタン
exportBtn.addEventListener('click', async () => {
  const tabs = await getAllTabs();
  const markdown = tabsToMarkdown(tabs);

  await navigator.clipboard.writeText(markdown);
  showToast('📝 ブログ用Markdownをコピーしました！');
});

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  updateTabCount();
  updateGameState();
  loadSettings();

  // Real-time update listener for Karma changes
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.gameState) {
      updateGameState();
    }
  });
});
