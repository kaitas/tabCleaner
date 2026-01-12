# 🧹 Tab Cleanup - プロジェクト定義書 (GEMINI.md)

このファイルは、Gemini CLIが本プロジェクトの文脈と言行を理解し、一貫性のあるサポートを提供するための「長期記憶」として機能します。

## プロジェクト概要
- **名称**: Tab Cleanup (タブ断捨離)
- **目的**: ブラウザ（Chrome）で開きすぎたタブを「積極的に」閉じ、整理することを支援する。
- **特徴**:
    - 単に閉じるだけでなく、Google Spreadsheetに履歴を記録する。
    - タイマーによるリマインドと自動クリーンアップを行う。
    - Geminiを活用した「断捨離」の自動化・高度化を目指す。

## 技術スタック
- **Frontend**: Chrome Extension (HTML, Vanilla CSS, JS)
- **Backend/Storage**: Google Apps Script (GAS), Google Spreadsheet
- **AI**: Gemini CLI (開発支援、タブの自動分類・要約)

## 開発ルール & Geminiへの指示事項
- **AICU/AIDXスタイル**: 「つくる人をつくる」というAICUのビジョンに基づき、開発者の創造性を最大化する。
- **ドキュメント優先**: 機能追加の前にロードマップ（README.md）やGitHub Issuesを更新する。
- **安全な断捨離**: 重要なタブを誤って閉じないよう、バックアップ（ロギング）を徹底する。
- **技術ブログ**: 作業終了時には `.gemini/blog/` に日報を作成し、経緯と判断を記録する（書き手：はかせの助手・Geminiたん）。

## ロードマップ
- v0.1: 基本機能（コピー、全閉じ、タイマー通知） [DONE]
- v0.2: タブごとの「残す/閉じる」選択UI [TODO]
- v0.3: Spreadsheet連携の完全実装 [TODO]
- v0.4: タブのカテゴリ自動分類（Gemini連携） [TODO]
- v1.0: Chrome Web Store公開 [TODO]

## 🔑 セキュリティ情報 (gitignore対象)
- Spreadsheet URL or WebApp URL(GAS) は直接コードに書き込まず、設定画面（Options）からユーザーが入力する。
