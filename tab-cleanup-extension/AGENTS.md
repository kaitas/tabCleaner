# AGENTS.md - AI/エージェント向け開発ガイド

このドキュメントは、AIコーディングアシスタントやエージェントがこのプロジェクトを理解し、効果的に貢献するためのガイドです。

## 🎯 プロジェクト概要

**Tab Cleanup** は、Chromeブラウザのタブ管理を支援する拡張機能です。

### コア機能
1. タブ一覧の取得とエクスポート
2. 時刻トリガーによる通知と自動クローズ
3. 履歴の保存と管理
4. （予定）Spreadsheet連携

### 技術スタック
- Chrome Extension Manifest V3
- Vanilla JavaScript（フレームワークなし）
- Chrome Storage API（sync/local）
- Chrome Alarms API
- Chrome Notifications API

## 📐 アーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│                      Chrome Browser                      │
├─────────────────────────────────────────────────────────┤
│  popup.html/js     │  options.html/js  │  background.js │
│  (ユーザー操作)     │  (設定管理)        │  (常駐処理)    │
├─────────────────────────────────────────────────────────┤
│                    Chrome APIs                           │
│  - tabs.*          - storage.sync/local  - alarms.*     │
│  - notifications.* - runtime.*                          │
└─────────────────────────────────────────────────────────┘
```

## 🔧 開発ルール

### コーディング規約
- ES6+を使用（async/await推奨）
- セミコロン必須
- シングルクォート使用
- インデント: 2スペース

### ファイル変更時の注意
- `manifest.json`: 権限追加時は最小限に
- `background.js`: Service Workerの制約を考慮（長時間処理不可）
- `popup.js/options.js`: DOM操作はDOMContentLoaded後に

### ストレージ設計
```javascript
// chrome.storage.sync - 設定（デバイス間同期）
{
  warnTime: '18:00',
  closeTime: '21:00',
  enableTimer: true,
  enableNotification: true,
  enableSound: false,
  enableSpreadsheet: false,
  spreadsheetUrl: '',
  sheetName: 'タブ記録'
}

// chrome.storage.local - 履歴（ローカルのみ）
{
  tabHistory: [
    {
      date: '2024-01-15T21:00:00.000Z',
      tabs: [
        { title: 'Example', url: 'https://example.com' },
        // ...
      ]
    }
  ]
}
```

## 🧪 テスト方法

### 手動テスト
1. `chrome://extensions` で拡張機能を読み込み
2. ポップアップの各ボタンをテスト
3. 設定画面の保存/読み込みをテスト
4. アラームのテスト（時刻を現在時刻+1分に設定）

### デバッグ
- ポップアップ: 右クリック → 検証
- バックグラウンド: `chrome://extensions` → 「Service Worker」リンク
- ストレージ確認: DevTools → Application → Storage

## 📝 タスク管理

### 現在のステータス: v0.1 MVP

### 未実装機能（優先度順）

1. **アイコン作成** - icons/フォルダが空
2. **GAS連携実装** - `gas/Code.gs`の作成
3. **レビューモード** - タブごとの残す/閉じる選択
4. **エラーハンドリング強化**

### 既知の問題
- Service Workerはアイドル時に停止するため、正確なタイミングが保証されない
- `chrome://` や `chrome-extension://` のタブは閉じられない場合がある

## 🚀 デプロイ

### Chrome Web Store公開時のチェックリスト
- [ ] プライバシーポリシーの作成
- [ ] スクリーンショットの準備
- [ ] アイコンの最終確認
- [ ] 権限の説明文作成

## 💡 AI/エージェントへの推奨事項

### やること
- 変更前に影響範囲を確認
- Chrome Extension APIのドキュメントを参照
- 既存のコードスタイルに従う
- 日本語でコメントを書く

### やらないこと
- 不要な外部ライブラリの追加
- manifest.jsonの権限を不必要に増やす
- 非同期処理を同期的に書く

### 質問する場合
- 「この機能を追加したい場合、どのファイルを変更すべきか」
- 「Chrome APIの○○を使いたいが、Manifest V3で可能か」
- 「既存の設計と整合性を保つにはどうすべきか」

---

最終更新: 2024年
