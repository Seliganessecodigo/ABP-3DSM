import { t as _plugin_vue_export_helper_default } from "./plugin-vue_export-helper.BOaGB7Aw.js";
import { useSSRContext } from "vue";
import { ssrRenderAttrs } from "vue/server-renderer";
//#region zh-CN/index.md
var __pageData = JSON.parse("{\"title\":\"\",\"description\":\"\",\"frontmatter\":{\"layout\":\"home\",\"hero\":{\"name\":\"GreenER\",\"text\":\"了解能源与环境影响及其背景\",\"tagline\":\"监控应用，并理解能源和 CO₂e 估算结果。\",\"actions\":[{\"theme\":\"brand\",\"text\":\"开始使用\",\"link\":\"/getting-started\"},{\"theme\":\"alt\",\"text\":\"查看史诗任务\",\"link\":\"/roadmap\"}]},\"features\":[{\"title\":\"监控\",\"details\":\"发现并监控应用，清楚呈现其状态。\"},{\"title\":\"可追溯性\",\"details\":\"通过指标、时间范围和限制条件了解数据背景。\"},{\"title\":\"多语言访问\",\"details\":\"文档和界面支持八种语言。\"}]},\"headers\":[],\"relativePath\":\"zh-CN/index.md\",\"filePath\":\"zh-CN/index.md\",\"lastUpdated\":0}");
var _sfc_main = { name: "zh-CN/index.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
	_push(`<div${ssrRenderAttrs(_attrs)}><h2 id="项目简介" tabindex="-1">项目简介 <a class="header-anchor" href="#项目简介" aria-label="Permalink to “项目简介”">​</a></h2><p>GreenER 是巴西 Fatec Jacareí 多平台软件开发课程的学术项目。项目旨在监控应用、估算能源消耗，并展示二氧化碳当量排放（CO₂e）。</p><h2 id="当前状态" tabindex="-1">当前状态 <a class="header-anchor" href="#当前状态" aria-label="Permalink to “当前状态”">​</a></h2><p>目前前端提供应用目录和详情页。后端提供目录 API，并执行应用的初始发现。仪表板、环境影响计算、分析和管理属于产品范围，并已整理在<a href="./roadmap.html">史诗任务待办列表</a>中。</p><p>估算结果取决于数据来源及其文档化契约。缺失、错误或过期数据不代表能耗或排放为零。</p></div>`);
}
var _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("zh-CN/index.md");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var zh_CN_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
//#endregion
export { __pageData, zh_CN_default as default };
