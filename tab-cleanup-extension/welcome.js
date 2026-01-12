// GAS Code for clipboard
const GAS_CODE = `/**
 * Tab Cleanup - Google Apps Script
 * Spreadsheet連携用のWeb App
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('History');
    
    if (!sheet) {
      sheet = ss.insertSheet('History');
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

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const step1Div = document.getElementById('step1');
  const step2Div = document.getElementById('step2');

  const angelNameInput = document.getElementById('angelName');
  const consentStatsCheckbox = document.getElementById('consentStats');
  const nextBtn = document.getElementById('nextBtn');

  const toggleSetupBtn = document.getElementById('toggleSetup');
  const setupStepsMsg = document.getElementById('setupSteps');
  const copyCodeBtn = document.getElementById('copyCodeBtn');
  const scriptUrlInput = document.getElementById('scriptUrl');
  const finishBtn = document.getElementById('finishBtn');
  const skipBtn = document.getElementById('skipBtn');

  // State
  let angelName = '';
  let consentStats = false;

  // --- Step 1 Logic ---

  angelNameInput.addEventListener('input', (e) => {
    angelName = e.target.value.trim();
    validateStep1();
  });

  consentStatsCheckbox.addEventListener('change', (e) => {
    consentStats = e.target.checked;
    // Consent is optional/opt-in, so it doesn't block the next button
  });

  function validateStep1() {
    nextBtn.disabled = angelName.length === 0;
  }

  nextBtn.addEventListener('click', async () => {
    // Save initial settings
    await chrome.storage.sync.set({
      angelName: angelName,
      consentStats: consentStats
    });

    // Move to Step 2
    step1Div.style.display = 'none';
    step2Div.style.display = 'block';
    lucide.createIcons(); // Re-render icons for new visible elements if needed
  });

  // --- Step 2 Logic ---

  toggleSetupBtn.addEventListener('click', () => {
    setupStepsMsg.classList.toggle('open');
  });

  copyCodeBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(GAS_CODE);
      showToast('📋 コードをコピーしました！');
    } catch (err) {
      console.error('Failed to copy:', err);
      showToast('❌ コピーに失敗しました');
    }
  });

  finishBtn.addEventListener('click', async () => {
    const url = scriptUrlInput.value.trim();
    if (url && url.startsWith('https://script.google.com/')) {
      await chrome.storage.sync.set({
        enableSpreadsheet: true,
        spreadsheetUrl: url
      });
      showToast('💾 設定を保存しました！完了です');
      setTimeout(() => {
        window.close();
      }, 1500);
    } else if (url) {
      showToast('❌ 正しいGASのURLを入力してください');
    } else {
      // URL is empty but clicked finish -> treat as skip or just close
      await chrome.storage.sync.set({ enableSpreadsheet: false });
      window.close();
    }
  });

  skipBtn.addEventListener('click', async () => {
    // Explicitly disable spreadsheet if skipped
    await chrome.storage.sync.set({ enableSpreadsheet: false });
    window.close();
  });

  // Utilities
  function showToast(msg) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    toastMsg.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
});
