import { t as _plugin_vue_export_helper_default } from "./plugin-vue_export-helper.BOaGB7Aw.js";
import { useSSRContext } from "vue";
import { ssrRenderAttrs } from "vue/server-renderer";
//#region ja-JP/contributing.md
var __pageData = JSON.parse("{\"title\":\"コントリビューション\",\"description\":\"\",\"frontmatter\":{},\"headers\":[],\"relativePath\":\"ja-JP/contributing.md\",\"filePath\":\"ja-JP/contributing.md\",\"lastUpdated\":0}");
var _sfc_main = { name: "ja-JP/contributing.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
	_push(`<div${ssrRenderAttrs(_attrs)}><h1 id="コントリビューション" tabindex="-1">コントリビューション <a class="header-anchor" href="#コントリビューション" aria-label="Permalink to “コントリビューション”">​</a></h1><h2 id="作業の流れ" tabindex="-1">作業の流れ <a class="header-anchor" href="#作業の流れ" aria-label="Permalink to “作業の流れ”">​</a></h2><ol><li>コードを変更する前にissueと受け入れ条件を確認します。</li><li><code>develop</code>からブランチを作成し、タスクの範囲内で変更します。</li><li>Conventional Commit形式のタイトルと関連issueへの参照を付けて、<code>develop</code>向けにプルリクエストを作成します。</li><li>判断事項、制約、実際に実行した確認内容、UI変更の画面証拠を記載します。</li></ol><h2 id="確認項目" tabindex="-1">確認項目 <a class="header-anchor" href="#確認項目" aria-label="Permalink to “確認項目”">​</a></h2><p>CIではフロントエンドとバックエンドのlint、テスト、ビルド、およびSonarQube Cloudの品質ゲートを実行します。PRの完了前に新しい指摘を修正します。ローカルで実行していない確認を明記し、結果を確認していないものを成功と記載しないでください。</p><h2 id="uiの変更" tabindex="-1">UIの変更 <a class="header-anchor" href="#uiの変更" aria-label="Permalink to “UIの変更”">​</a></h2><p>各画面のスタイル、hooks、翻訳は画面の近くに保ちます。フロントエンドは<code>pt-BR</code>、<code>en-US</code>、<code>es-ES</code>、<code>fr-FR</code>、<code>de-DE</code>、<code>it-IT</code>、<code>ja-JP</code>、<code>zh-CN</code>に対応します。新しい表示テキストは8言語すべてで用意し、英語をフォールバックにします。</p><h2 id="連携・ドメインの変更" tabindex="-1">連携・ドメインの変更 <a class="header-anchor" href="#連携・ドメインの変更" aria-label="Permalink to “連携・ドメインの変更”">​</a></h2><p>issueと技術文書で契約や決定を確認します。エンドポイント、スキーマ、単位、環境係数、リトライ方針を独自に追加しないでください。永続スキーマの変更にはマイグレーションが必要です。契約の変更時はOpenAPIとドキュメントも更新します。</p><h2 id="ドキュメントサイト" tabindex="-1">ドキュメントサイト <a class="header-anchor" href="#ドキュメントサイト" aria-label="Permalink to “ドキュメントサイト”">​</a></h2><p>公開する内容は<code>docs/</code>のMarkdownで管理します。8言語すべてで該当ページを更新し、<code>npm run docs:build</code>でサイトを確認します。</p></div>`);
}
var _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("ja-JP/contributing.md");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var contributing_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
//#endregion
export { __pageData, contributing_default as default };
