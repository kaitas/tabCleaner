// DOM要素の取得
const tabCountEl = document.getElementById('tabCount');
const warnTimeEl = document.getElementById('warnTime');
const closeTimeEl = document.getElementById('closeTime');
const statusEl = document.getElementById('status');
const toastEl = document.getElementById('toast');

// ボタン
const copyBtn = document.getElementById('copyBtn');
const reviewBtn = document.getElementById('reviewBtn');
const closeAllBtn = document.getElementById('closeAllBtn');
const exportBtn = document.getElementById('exportBtn');

// Toast表示
function showToast(message, duration = 2000) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), duration);
}

// タブ数を更新
async function updateTabCount() {
  const tabs = await chrome.tabs.query({});
  tabCountEl.textContent = tabs.length;
}

// 設定を読み込み
async function loadSettings() {
  const settings = await chrome.storage.sync.get({
    warnTime: '18:00',
    closeTime: '21:00'
  });
  warnTimeEl.textContent = settings.warnTime;
  closeTimeEl.textContent = settings.closeTime;
}

// タブ一覧を取得
async function getAllTabs() {
  const tabs = await chrome.tabs.query({});
  return tabs.map(tab => ({
    title: tab.title,
    url: tab.url,
    favIconUrl: tab.favIconUrl
  }));
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

// コピーボタン
copyBtn.addEventListener('click', async () => {
  const tabs = await getAllTabs();
  const text = tabsToText(tabs);
  
  await navigator.clipboard.writeText(text);
  showToast(`✅ ${tabs.length}タブをコピーしました！`);
});

// 確認ボタン（新しいタブでリスト表示）
reviewBtn.addEventListener('click', async () => {
  const tabs = await getAllTabs();
  // background.jsにメッセージを送信してレビューモードを開始
  chrome.runtime.sendMessage({ action: 'startReview', tabs });
  showToast('👀 各タブに確認バッジを表示中...');
});

// 全て閉じるボタン
closeAllBtn.addEventListener('click', async () => {
  if (!confirm('本当に全てのタブを閉じて記録しますか？\n\n※このタブ以外全て閉じます')) {
    return;
  }
  
  const tabs = await getAllTabs();
  
  // ストレージに保存
  const history = await chrome.storage.local.get({ tabHistory: [] });
  history.tabHistory.push({
    date: new Date().toISOString(),
    tabs: tabs
  });
  await chrome.storage.local.set({ tabHistory: history.tabHistory });
  
  // 現在のタブ以外を閉じる
  const currentTab = await chrome.tabs.getCurrent();
  const allTabs = await chrome.tabs.query({});
  
  for (const tab of allTabs) {
    if (tab.id !== currentTab?.id) {
      try {
        await chrome.tabs.remove(tab.id);
      } catch (e) {
        console.log('タブを閉じられませんでした:', tab.url);
      }
    }
  }
  
  showToast(`🧹 ${tabs.length - 1}タブを閉じて記録しました！`);
  updateTabCount();
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
  loadSettings();
});
