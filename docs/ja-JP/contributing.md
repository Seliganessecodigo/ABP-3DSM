# コントリビューション

ここからは開発・運用向けの文書です。ローカル環境、契約、検証を説明します。製品の使い方は利用ガイドを参照してください。

## 検証基準 {#workflow}

エピック、ユーザーストーリー、タスクを検証可能な基準とコード参照で整理しています。Issue、プルリクエスト、コミットが要件・実装・テストを結び、バージョン管理された文書がアーキテクチャ、契約、運用、根拠をまとめています。

```text
develop → tipo/numero-descricao / tipo/descricao → PR develop
Conventional Commits: tipo(escopo): descrição
Refs #N
```

## 検証 {#quality}

CIは文書build、frontendのlint/test/build、backendのlint/typecheck/PostgreSQLテスト/カバレッジ/build/migration、実backend利用のブラウザー統合フローを検証。`TEST_DATABASE_URL`は隔離DBを指定し、未設定時JestのDBスイートはスキップ、ブラウザー統合は失敗。`develop`向けSonarQubeは新規網羅率80%以上、重複3%以下、評価A、hotspot全件レビューが必須。

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

画面は指標を期間、単位、カバレッジ、方法論に結び付け、フィルターとナビゲーションの文脈を保持します。読み込み、空、障害、古いデータの状態を明示し、キーボード、見えるフォーカス、色に加えたテキスト、モバイル、テーマ、12言語に対応しています。

```sh
npm ci --prefix docs
npm run docs:check
npm run docs:build
```

## 関連ページ {#related}

[品質と受け入れ](./product/quality) · [プロダクトバックログ](./roadmap)

[提供計画と根拠](./plano-de-entregas)
