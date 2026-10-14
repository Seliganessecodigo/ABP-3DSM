# プロダクトエピック

GreenERのバックログではユーザーストーリーを6つのエピックにまとめています。受け入れ条件とタスクは関連するissueに記載されています。最新の状態はGitHubで確認してください。

| エピック | 範囲 |
| --- | --- |
| [EP01 — アプリケーションカタログ](https://github.com/Seliganessecodigo/ABP-3DSM/issues/1) | 監視対象アプリケーションの確認と閲覧。 |
| [EP02 — アプリケーション監視](https://github.com/Seliganessecodigo/ABP-3DSM/issues/2) | 検出、ライフサイクル、状態、データ収集。 |
| [EP03 — 環境影響の計算](https://github.com/Seliganessecodigo/ABP-3DSM/issues/3) | 追跡可能な方法と制約に基づくエネルギーとCO₂eの推定。 |
| [EP04 — 環境ダッシュボード](https://github.com/Seliganessecodigo/ABP-3DSM/issues/4) | 期間別の概要と集計指標。 |
| [EP05 — 分析とシミュレーション](https://github.com/Seliganessecodigo/ABP-3DSM/issues/5) | アプリケーションの比較と地域シナリオのシミュレーション。 |
| [EP06 — 設定と管理](https://github.com/Seliganessecodigo/ABP-3DSM/issues/6) | 認可に基づく監視の設定と管理。 |

## プロダクトの原則

- 失敗または欠落した観測値を、消費量ゼロに置き換えません。
- エネルギーとCO₂eでは、単位、期間、カバレッジ、コンテキストを保持します。
- 設定や手法の変更によって過去の結果を書き換えません。
- 公開ダッシュボードにログインは不要です。管理操作はバックエンドで認可します。
