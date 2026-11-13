# コントリビューション

ここからは開発・運用向けの文書です。ローカル環境、契約、検証を説明します。製品の使い方は利用ガイドを参照してください。

## 検証基準 {#workflow}

範囲や利用ルールを変える際は、問題、期待結果、受け入れ基準を対象ストーリーに記録します。レビューと使いやすさ評価では困難、意見、改善を記録します。保存期間、バックアップ・復元、運用目標、外部サービスの割当量は決定が必要です。

```text
develop → tipo/numero-descricao / tipo/descricao → PR develop
Conventional Commits: tipo(escopo): descrição
Refs #N
```

## 検証 {#quality}

CIは文書build、frontendのlint/test/build、backendのlint/typecheck/PostgreSQLテスト/カバレッジ/build/migration、実backend利用のブラウザー統合フローを検証。`TEST_DATABASE_URL`は隔離DBを指定し、未設定時JestのDBスイートはスキップ、ブラウザー統合は失敗。`develop`向けSonarQubeは新規網羅率80%以上、重複3%以下、評価A、hotspot全件レビューが必須。自動テストは使いやすさ評価や製品受け入れを代替しません。

```sh
npm ci --prefix docs
npm run docs:build
npm ci --prefix frontend
npm run lint --prefix frontend
npm test --prefix frontend
npm run build --prefix frontend
npm ci --prefix backend
npm run lint --prefix backend
npm run typecheck --prefix backend
npm test --prefix backend -- --runInBand
npm run test:cov --prefix backend -- --runInBand
npm run build --prefix backend
npm run test:integration --prefix frontend
```

## 技術文書 {#documentation}

アプリを見つけ、ゼロと欠損を区別し、指標から期間、単位、カバー率、方法論まで追跡できることが必要です。参照では移動時の条件を保持し、読み込み、空、失敗、古いデータを伝えます。評価にはキーボード、可視フォーカス、色以外の文字情報、モバイル、12言語を含めます。

```sh
npm ci --prefix docs
npm run docs:check
npm run docs:build
```

## 関連ページ {#related}

[品質と受け入れ](./product/quality) · [プロダクトバックログ](./roadmap)
