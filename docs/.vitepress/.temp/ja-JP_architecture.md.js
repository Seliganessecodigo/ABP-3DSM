import { t as _plugin_vue_export_helper_default } from "./plugin-vue_export-helper.BOaGB7Aw.js";
import { useSSRContext } from "vue";
import { ssrRenderAttrs } from "vue/server-renderer";
//#region ja-JP/architecture.md
var __pageData = JSON.parse("{\"title\":\"アーキテクチャ\",\"description\":\"\",\"frontmatter\":{},\"headers\":[],\"relativePath\":\"ja-JP/architecture.md\",\"filePath\":\"ja-JP/architecture.md\",\"lastUpdated\":0}");
var _sfc_main = { name: "ja-JP/architecture.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
	_push(`<div${ssrRenderAttrs(_attrs)}><h1 id="アーキテクチャ" tabindex="-1">アーキテクチャ <a class="header-anchor" href="#アーキテクチャ" aria-label="Permalink to “アーキテクチャ”">​</a></h1><h2 id="コンポーネント" tabindex="-1">コンポーネント <a class="header-anchor" href="#コンポーネント" aria-label="Permalink to “コンポーネント”">​</a></h2><p>ローカル環境ではDocker Composeを使って、フロントエンド、API、PostgreSQLの3つのサービスを起動します。</p><table tabindex="0"><thead><tr><th>領域</th><th>責務</th><th>技術</th></tr></thead><tbody><tr><td><code>frontend/</code></td><td>UI、ナビゲーション、表示</td><td>React 19、TypeScript、Vite、i18next</td></tr><tr><td><code>backend/</code></td><td>API、ユースケース、外部連携</td><td>NestJS、TypeScript、TypeORM</td></tr><tr><td>PostgreSQL</td><td>アプリケーションとドメインデータの永続化</td><td>PostgreSQL 18</td></tr></tbody></table><p>フロントエンドが呼び出すのはGreenER APIのみです。メトリクス集約サービスと炭素強度サービスに接続するのはバックエンドだけです。</p><h2 id="コード構成" tabindex="-1">コード構成 <a class="header-anchor" href="#コード構成" aria-label="Permalink to “コード構成”">​</a></h2><ul><li><code>frontend/src/pages/</code>には、各画面と専用のhooks、翻訳、CSS Modulesを配置します。</li><li><code>frontend/src/features/</code>は、ドメイン契約、検証、HTTPアクセス、キャッシュ、純粋なルールを担当します。</li><li><code>backend/src/modules/</code>はドメインごとにエンドポイントとユースケースをまとめます。</li><li><code>backend/src/integrations/</code>は補助APIの応答を変換・検証します。</li><li><code>backend/src/database/</code>にはエンティティ、マイグレーション、リポジトリを配置します。</li></ul><h2 id="データと信頼性" tabindex="-1">データと信頼性 <a class="header-anchor" href="#データと信頼性" aria-label="Permalink to “データと信頼性”">​</a></h2><p>バックエンドがデータソースと連携し、データを永続化します。文書化された契約、スキーマ、単位に従います。エラー、欠損値、不正な応答、古いデータ、有効なゼロ値はそれぞれ異なる状態であり、画面でも区別を保ちます。</p><p>実装の詳細は、<a href="https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md" target="_blank" rel="noreferrer">リポジトリ内の外部API契約</a>と<a href="https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/frontend/src/README.md" target="_blank" rel="noreferrer">フロントエンド構成ガイド</a>を参照してください。</p></div>`);
}
var _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("ja-JP/architecture.md");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var architecture_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
//#endregion
export { __pageData, architecture_default as default };
