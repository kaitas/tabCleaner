/**
 * Tab Cleanup - Google Apps Script
 * Spreadsheet連携用のWeb App
 * 
 * 設定方法:
 * 1. Google Spreadsheetを新規作成
 * 2. 拡張機能 → Apps Script
 * 3. このコードを貼り付け
 * 4. デプロイ → 新しいデプロイ → ウェブアプリ
 * 5. アクセス権限を「全員」に設定
 * 6. デプロイしてURLを取得
 * 7. 拡張機能の設定画面にURLを入力
 */

// POSTリクエストを処理
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const result = saveTabHistory(data);
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, result: result }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// GETリクエスト（テスト用）
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ 
      status: 'ok', 
      message: 'Tab Cleanup GAS is running',
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// タブ履歴を保存
function saveTabHistory(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(data.sheetName || 'タブ記録');
  
  // シートがなければ作成
  if (!sheet) {
    sheet = ss.insertSheet(data.sheetName || 'タブ記録');
    // ヘッダー行を追加
    sheet.appendRow(['記録日時', 'タブ数', 'タイトル', 'URL']);
    sheet.getRange(1, 1, 1, 4).setFontWeight('bold');
  }
  
  const timestamp = new Date(data.date);
  const dateStr = Utilities.formatDate(timestamp, 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss');
  
  // 各タブを行として追加
  const rows = data.tabs.map((tab, index) => {
    return [
      index === 0 ? dateStr : '',  // 日時は最初の行のみ
      index === 0 ? data.tabs.length : '',  // タブ数も最初の行のみ
      tab.title,
      tab.url
    ];
  });
  
  if (rows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 4).setValues(rows);
  }
  
  // 空行を追加（記録の区切り）
  sheet.appendRow(['', '', '', '']);
  
  return {
    savedCount: data.tabs.length,
    timestamp: dateStr
  };
}

// 履歴を取得（オプション）
function getTabHistory(days = 7) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('タブ記録');
  
  if (!sheet) {
    return [];
  }
  
  const data = sheet.getDataRange().getValues();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const history = [];
  let currentRecord = null;
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    
    if (row[0]) {
      // 新しい記録の開始
      if (currentRecord) {
        history.push(currentRecord);
      }
      currentRecord = {
        date: row[0],
        tabCount: row[1],
        tabs: []
      };
    }
    
    if (currentRecord && row[2]) {
      currentRecord.tabs.push({
        title: row[2],
        url: row[3]
      });
    }
  }
  
  if (currentRecord) {
    history.push(currentRecord);
  }
  
  return history;
}

// 週次レポートを生成
function generateWeeklyReport() {
  const history = getTabHistory(7);
  
  if (history.length === 0) {
    return 'この1週間の記録はありません。';
  }
  
  let totalTabs = 0;
  const domainCount = {};
  
  history.forEach(record => {
    totalTabs += record.tabs.length;
    record.tabs.forEach(tab => {
      try {
        const url = new URL(tab.url);
        const domain = url.hostname;
        domainCount[domain] = (domainCount[domain] || 0) + 1;
      } catch (e) {
        // 無効なURL
      }
    });
  });
  
  const topDomains = Object.entries(domainCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  let report = `# 週次タブレポート\n\n`;
  report += `期間: ${history[history.length - 1].date} 〜 ${history[0].date}\n`;
  report += `記録回数: ${history.length}回\n`;
  report += `合計タブ数: ${totalTabs}\n\n`;
  report += `## よく開いていたサイト TOP10\n\n`;
  
  topDomains.forEach(([domain, count], index) => {
    report += `${index + 1}. ${domain}: ${count}回\n`;
  });
  
  return report;
}

// テスト用関数
function testSaveTabHistory() {
  const testData = {
    date: new Date().toISOString(),
    sheetName: 'タブ記録',
    tabs: [
      { title: 'Google', url: 'https://www.google.com' },
      { title: 'GitHub', url: 'https://github.com' },
      { title: 'Example', url: 'https://example.com' }
    ]
  };
  
  const result = saveTabHistory(testData);
  Logger.log(result);
}
