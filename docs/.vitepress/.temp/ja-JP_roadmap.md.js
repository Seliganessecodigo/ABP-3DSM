import { t as _plugin_vue_export_helper_default } from "./plugin-vue_export-helper.BOaGB7Aw.js";
import { useSSRContext } from "vue";
import { ssrRenderAttrs } from "vue/server-renderer";
//#region ja-JP/roadmap.md
var __pageData = JSON.parse("{\"title\":\"プロダクトエピック\",\"description\":\"\",\"frontmatter\":{},\"headers\":[],\"relativePath\":\"ja-JP/roadmap.md\",\"filePath\":\"ja-JP/roadmap.md\",\"lastUpdated\":0}");
var _sfc_main = { name: "ja-JP/roadmap.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
	_push(`<div${ssrRenderAttrs(_attrs)}><h1 id="プロダクトエピック" tabindex="-1">プロダクトエピック <a class="header-anchor" href="#プロダクトエピック" aria-label="Permalink to “プロダクトエピック”">​</a></h1><p>GreenERのバックログではユーザーストーリーを6つのエピックにまとめています。受け入れ条件とタスクは関連するissueに記載されています。最新の状態はGitHubで確認してください。</p><table tabindex="0"><thead><tr><th>エピック</th><th>範囲</th></tr></thead><tbody><tr><td><a href="https://github.com/Seliganessecodigo/ABP-3DSM/issues/1" target="_blank" rel="noreferrer">EP01 — アプリケーションカタログ</a></td><td>監視対象アプリケーションの確認と閲覧。</td></tr><tr><td><a href="https://github.com/Seliganessecodigo/ABP-3DSM/issues/2" target="_blank" rel="noreferrer">EP02 — アプリケーション監視</a></td><td>検出、ライフサイクル、状態、データ収集。</td></tr><tr><td><a href="https://github.com/Seliganessecodigo/ABP-3DSM/issues/3" target="_blank" rel="noreferrer">EP03 — 環境影響の計算</a></td><td>追跡可能な方法と制約に基づくエネルギーとCO₂eの推定。</td></tr><tr><td><a href="https://github.com/Seliganessecodigo/ABP-3DSM/issues/4" target="_blank" rel="noreferrer">EP04 — 環境ダッシュボード</a></td><td>期間別の概要と集計指標。</td></tr><tr><td><a href="https://github.com/Seliganessecodigo/ABP-3DSM/issues/5" target="_blank" rel="noreferrer">EP05 — 分析とシミュレーション</a></td><td>アプリケーションの比較と地域シナリオのシミュレーション。</td></tr><tr><td><a href="https://github.com/Seliganessecodigo/ABP-3DSM/issues/6" target="_blank" rel="noreferrer">EP06 — 設定と管理</a></td><td>認可に基づく監視の設定と管理。</td></tr></tbody></table><h2 id="プロダクトの原則" tabindex="-1">プロダクトの原則 <a class="header-anchor" href="#プロダクトの原則" aria-label="Permalink to “プロダクトの原則”">​</a></h2><ul><li>失敗または欠落した観測値を、消費量ゼロに置き換えません。</li><li>エネルギーとCO₂eでは、単位、期間、カバレッジ、コンテキストを保持します。</li><li>設定や手法の変更によって過去の結果を書き換えません。</li><li>公開ダッシュボードにログインは不要です。管理操作はバックエンドで認可します。</li></ul></div>`);
}
var _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("ja-JP/roadmap.md");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var roadmap_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
//#endregion
export { __pageData, roadmap_default as default };
