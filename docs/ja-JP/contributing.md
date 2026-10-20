# コントリビューション

## 作業の流れ

1. コードを変更する前にissueと受け入れ条件を確認します。
2. `develop`からブランチを作成し、タスクの範囲内で変更します。
3. Conventional Commit形式のタイトルと関連issueへの参照を付けて、`develop`向けにプルリクエストを作成します。
4. 判断事項、制約、実際に実行した確認内容、UI変更の画面証拠を記載します。

## 確認項目

CIではフロントエンドとバックエンドのlint、テスト、ビルド、およびSonarQube Cloudの品質ゲートを実行します。PRの完了前に新しい指摘を修正します。ローカルで実行していない確認を明記し、結果を確認していないものを成功と記載しないでください。

## UIの変更

各画面のスタイル、hooks、翻訳は画面の近くに保ちます。フロントエンドは`pt-BR`、`en-US`、`es-ES`、`fr-FR`、`de-DE`、`it-IT`、`ja-JP`、`zh-CN`に対応します。新しい表示テキストは8言語すべてで用意し、英語をフォールバックにします。

## 連携・ドメインの変更

issueと技術文書で契約や決定を確認します。エンドポイント、スキーマ、単位、環境係数、リトライ方針を独自に追加しないでください。永続スキーマの変更にはマイグレーションが必要です。契約の変更時はOpenAPIとドキュメントも更新します。

## ドキュメントサイト

公開する内容は`docs/`のMarkdownで管理します。8言語すべてで該当ページを更新し、`npm run docs:build`でサイトを確認します。

## Git

Branchはissue付きなら`type/number-description`、なければ`type/description`。小文字、アクセントなしkebab-case。Commit・PR題名は`type(scope): description`で、説明はポルトガル語の動詞開始、末尾ピリオドなし。`Refs #N`、決定・制約、実際の検証を含めます。[AGENTS.md](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/AGENTS.md)が正式基準です。

[品質と受け入れ](./product/quality) · [決定と依存事項](./product/decisions)
