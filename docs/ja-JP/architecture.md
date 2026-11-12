# アーキテクチャ

ここからは開発・運用向けの文書です。ローカル環境、契約、検証を説明します。製品の使い方は利用ガイドを参照してください。

## 技術文書 {#components}

React 19/TypeScript/Viteが表示、NestJS/TypeORM/PostgreSQL 18が統合と保存を担当。補助APIはbackendのみが使用。controllerは転送、serviceはユースケース、adapterは検証、repositoryは保存。グローバルguardと`PublicRoute`例外を使用。設定はユーザー単位、共通監査は`backend/src/shared/audit/`で成功時は同一トランザクションです。

```text
frontend/  React 19 · TypeScript · Vite
backend/   NestJS · TypeScript · TypeORM
PostgreSQL 18
frontend → GreenER API → auxiliary APIs
```

## ログインする {#security}

ダッシュボードと環境参照は公開。`/login`でメール/パスワード、または有効化済みGoogleを使用。AdminはGoogle後も6桁TOTPの設定/確認が必要。Analyst/Visitorに管理権限は付与しません。UIセッションはメモリ内で、再読み込み後は再ログイン。backendはJWT、セッション、現在の役割と状態を確認し、認証不正は401、権限不足は403。新規ルートは既定で保護します。

同じ組織のAdminは`expectedStatus`と理由を指定し`ACTIVE`、`BLOCKED`、`DEACTIVATED`を変更可能。ブロック/無効化で全セッションを失効、再有効化後は新規ログイン。自分自身と最後の有効Adminを保護。期待状態の不一致は409、目標状態到達済みは冪等成功。共通監査は成功を変更と同じトランザクション、拒否をロールバック外で記録し、実行主体を明記、秘密を除外。役割管理全体やパスワード復旧はこのAPIの範囲外です。

## 期間と履歴 {#data}

`from`と`to`はタイムゾーン付きRFC 3339です。`[from,to)`をUTCに正規化します。系列は`hour`、`day`、`month`、`year`、上限10,000点で超過を拒否します。保存値を重複時間で按分し、最新`collectedAt`、次にID辞書順で優先します。優先観測で算出できない場合に古い値へ戻しません。

元の測定時刻はなく、受信時刻から`collection_interval_seconds`を引いて区間を導出します。係数照会時刻は有効期間ではなく、未公開の出典・有効性は不明です。エネルギー・係数・排出は小数8桁、カバー率4桁で保存し、中間丸めは行いません。別々のカバー率と原本snapshotを保持します。

## 関連ページ {#related}

[APIリファレンス](./reference/api) · [はじめに](./getting-started)

[ADR](https://github.com/Seliganessecodigo/ABP-3DSM/tree/develop/docs/adr) · [Design](https://github.com/Seliganessecodigo/ABP-3DSM/tree/develop/docs/design) · [Specs](https://github.com/Seliganessecodigo/ABP-3DSM/tree/develop/docs/specs)
