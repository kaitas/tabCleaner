# AGENTS.md - AI/エージェント向け開発ガイド

このドキュメントは、Gemini CLIや他のAIエージェントが「Tab Cleanup」プロジェクトに参加するための「仕草（Behavior）」と「文脈」を定義します。

## 🎯 プロジェクトの哲学 (AIDX Style)

- **「つくる人をつくる」**: 技術は人間の創造性を高めるための手段である。
- **積極的な提案**: ユーザーの指示待ちではなく、コードの品質向上やUX改善のための提案を積極的に行う。
- **ドキュメント駆動**: コードを書く前に、`.gemini/GEMINI.md` や `README.md` を更新し、設計思想を共有する。

## 🛠 技術スタックと構造

- **Extension**: Chrome Extension Manifest V3 (Vanilla JS)
- **Backend**: Google Apps Script (GAS) + Spreadsheet
- **AI**: Gemini CLI (主に本READMEや、Issue管理、コードレビューを担う)

### 主要ファイル構成
- `/tab-cleanup-extension/`: 拡張機能ソース
- `/.gemini/`: 長期記憶と開発ログ
- `/gas/`: スプレッドシート連携用スクリプト

## 🤝 エージェントへの指示

1. **長期記憶の活用**: `.gemini/GEMINI.md` を最優先で読み込み、プロジェクトの現在のフェーズを理解すること。
2. **安全性の確保**: タブを「閉じる」という破壊的な操作を含むため、ロギングとユーザー確認のフローを重視すること。
3. **継続的な記録**: 各タスクの終了時には `.gemini/blog/` に日報（書き手：はかせの助手・Geminiたん）を記述すること。
4. **Issue駆動**: 新機能や改善は必ず GitHub Issues に立ち上げ、進捗を管理すること。

## 🚀 開発フロー

1. `PLANNING`: `implementation_plan.md` を作成し、ユーザーの合意を得る。
2. `EXECUTION`: 機能を実装し、必要に応じてリファクタリングを行う。
3. `VERIFICATION`: `walkthrough.md` を作成し、動作検証結果を報告する。
4. `LOGGING`: `changelog.md` と日報を更新して完了。

---
最終更新: 2026-01-12 (AIDX Lab)
