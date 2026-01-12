# 🧹 Tab Cleanup - タブ断捨離

開きすぎのChromeタブを整理し、記録してから気持ちよく1日を終えるためのChrome拡張機能です。

## ✨ 機能

### 基本機能
- **📋 タブ一覧コピー**: 現在開いているタブをテキスト形式でクリップボードにコピー
- **📝 ブログ用出力**: Markdown形式でドメイン別に整理した一覧を生成
- **🚪 全閉じ＆記録**: 全タブを記録してから閉じる

### タイマー機能
- **⏰ 警告時刻**: 設定した時刻に通知を表示し、タブの確認を促す
- **🌙 強制終了時刻**: 設定した時刻に全タブを自動で記録して閉じる

### 履歴管理
- ローカルに最新100件の記録を保持
- 日付・タブ数で履歴を確認可能

## 🚀 インストール

### 開発版（ローカル）

1. このリポジトリをクローン
```bash
git clone https://github.com/kaitas/tab-cleanup-extension.git
cd tab-cleanup-extension
```

2. Chromeで `chrome://extensions` を開く

3. 右上の「デベロッパーモード」をON

4. 「パッケージ化されていない拡張機能を読み込む」をクリック

5. クローンしたフォルダを選択

## ⚙️ 設定

拡張機能のアイコン → 「設定」または右クリック → 「オプション」から設定画面を開けます。

### タイマー設定
- **警告時刻**: デフォルト 18:00
- **強制終了時刻**: デフォルト 21:00

### Google Spreadsheet連携（オプション）
1. Google Spreadsheetを新規作成
2. Apps Script（GAS）をデプロイ（`gas/Code.gs`参照）
3. 設定画面でSpreadsheetのURLを入力

## 📁 ファイル構成

```
tab-cleanup-extension/
├── manifest.json      # 拡張機能の設定
├── popup.html         # ポップアップUI
├── popup.js           # ポップアップのロジック
├── options.html       # 設定画面UI
├── options.js         # 設定画面のロジック
├── background.js      # バックグラウンド処理（タイマー等）
├── icons/             # アイコン
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── gas/               # Google Apps Script
│   └── Code.gs
├── README.md
└── AGENTS.md
```

## 🎯 使い方

### 日常の流れ

1. **日中**: 普通にブラウジング
2. **18:00（警告時刻）**: 通知が届く → 不要なタブを閉じる
3. **21:00（終了時刻）**: 自動で全タブを記録して閉じる
4. **翌日**: 履歴から昨日のタブを確認可能

### 手動操作

- **今すぐコピーしたい**: ポップアップ → 「タブ一覧をコピー」
- **ブログ記事にしたい**: ポップアップ → 「ブログ用に出力」
- **今すぐ閉じたい**: ポップアップ → 「全て閉じて記録」

## 🔮 今後の予定

- [ ] v0.2: タブごとの「残す/閉じる」選択UI
- [ ] v0.3: Spreadsheet連携の完全実装
- [ ] v0.4: タブのカテゴリ自動分類
- [ ] v0.5: 週次/月次レポート生成
- [ ] v1.0: Chrome Web Store公開

## 🤝 コントリビュート

Issue、PRお待ちしています！

## 📄 ライセンス

MIT License

## 👤 作者

[@kaitas](https://github.com/kaitas)

---

Made with 🧹 for a cleaner browser life
