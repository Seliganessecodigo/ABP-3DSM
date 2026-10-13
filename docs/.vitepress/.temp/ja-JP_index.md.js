import { t as _plugin_vue_export_helper_default } from "./plugin-vue_export-helper.BOaGB7Aw.js";
import { useSSRContext } from "vue";
import { ssrRenderAttrs } from "vue/server-renderer";
//#region ja-JP/index.md
var __pageData = JSON.parse("{\"title\":\"\",\"description\":\"\",\"frontmatter\":{\"layout\":\"home\",\"hero\":{\"name\":\"GreenER\",\"text\":\"エネルギーと環境への影響を、背景情報とともに\",\"tagline\":\"アプリケーションを監視し、エネルギーとCO₂eの推定値を理解できます。\",\"actions\":[{\"theme\":\"brand\",\"text\":\"はじめに\",\"link\":\"/getting-started\"},{\"theme\":\"alt\",\"text\":\"エピックを見る\",\"link\":\"/roadmap\"}]},\"features\":[{\"title\":\"監視\",\"details\":\"状態を明確に示しながら、アプリケーションを検出・監視します。\"},{\"title\":\"トレーサビリティ\",\"details\":\"指標の背景として、メトリクス、期間、制約を確認できます。\"},{\"title\":\"多言語対応\",\"details\":\"ドキュメントとインターフェースを8言語で利用できます。\"}]},\"headers\":[],\"relativePath\":\"ja-JP/index.md\",\"filePath\":\"ja-JP/index.md\",\"lastUpdated\":0}");
var _sfc_main = { name: "ja-JP/index.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
	_push(`<div${ssrRenderAttrs(_attrs)}><h2 id="プロジェクトについて" tabindex="-1">プロジェクトについて <a class="header-anchor" href="#プロジェクトについて" aria-label="Permalink to “プロジェクトについて”">​</a></h2><p>GreenERは、ブラジルのFatec Jacareíにおけるマルチプラットフォームソフトウェア開発課程の学術プロジェクトです。アプリケーションを監視し、エネルギー消費量を推定し、CO₂換算排出量（CO₂e）を提示することを目指しています。</p><h2 id="現在の状況" tabindex="-1">現在の状況 <a class="header-anchor" href="#現在の状況" aria-label="Permalink to “現在の状況”">​</a></h2><p>現在、フロントエンドにはアプリケーション一覧と詳細ページがあります。バックエンドは一覧APIを提供し、初回のアプリケーション検出を行います。ダッシュボード、環境影響の計算、分析、管理機能は製品の対象範囲であり、<a href="./roadmap.html">エピックのバックログ</a>に整理されています。</p><p>推定値はデータソースと文書化された契約に依存します。データの欠落、エラー、古いデータは、消費量や排出量がゼロであることを意味しません。</p></div>`);
}
var _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("ja-JP/index.md");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var ja_JP_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
//#endregion
export { __pageData, ja_JP_default as default };
