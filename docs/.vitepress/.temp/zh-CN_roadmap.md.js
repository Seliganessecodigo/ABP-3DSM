import { t as _plugin_vue_export_helper_default } from "./plugin-vue_export-helper.BOaGB7Aw.js";
import { useSSRContext } from "vue";
import { ssrRenderAttrs } from "vue/server-renderer";
//#region zh-CN/roadmap.md
var __pageData = JSON.parse("{\"title\":\"产品史诗任务\",\"description\":\"\",\"frontmatter\":{},\"headers\":[],\"relativePath\":\"zh-CN/roadmap.md\",\"filePath\":\"zh-CN/roadmap.md\",\"lastUpdated\":0}");
var _sfc_main = { name: "zh-CN/roadmap.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
	_push(`<div${ssrRenderAttrs(_attrs)}><h1 id="产品史诗任务" tabindex="-1">产品史诗任务 <a class="header-anchor" href="#产品史诗任务" aria-label="Permalink to “产品史诗任务”">​</a></h1><p>GreenER 待办列表将用户故事归入六个史诗任务。验收标准和具体任务保留在关联的 issue 中；最新状态请查看 GitHub。</p><table tabindex="0"><thead><tr><th>史诗任务</th><th>范围</th></tr></thead><tbody><tr><td><a href="https://github.com/Seliganessecodigo/ABP-3DSM/issues/1" target="_blank" rel="noreferrer">EP01 — 应用目录</a></td><td>查看和浏览受监控的应用。</td></tr><tr><td><a href="https://github.com/Seliganessecodigo/ABP-3DSM/issues/2" target="_blank" rel="noreferrer">EP02 — 应用监控</a></td><td>应用发现、生命周期、状态和数据采集。</td></tr><tr><td><a href="https://github.com/Seliganessecodigo/ABP-3DSM/issues/3" target="_blank" rel="noreferrer">EP03 — 环境影响计算</a></td><td>使用可追溯的方法和限制估算能源与 CO₂e。</td></tr><tr><td><a href="https://github.com/Seliganessecodigo/ABP-3DSM/issues/4" target="_blank" rel="noreferrer">EP04 — 环境仪表板</a></td><td>按时间范围汇总数据和指标。</td></tr><tr><td><a href="https://github.com/Seliganessecodigo/ABP-3DSM/issues/5" target="_blank" rel="noreferrer">EP05 — 分析与模拟</a></td><td>比较应用并模拟区域场景。</td></tr><tr><td><a href="https://github.com/Seliganessecodigo/ABP-3DSM/issues/6" target="_blank" rel="noreferrer">EP06 — 配置与管理</a></td><td>在授权控制下配置和管理监控。</td></tr></tbody></table><h2 id="产品原则" tabindex="-1">产品原则 <a class="header-anchor" href="#产品原则" aria-label="Permalink to “产品原则”">​</a></h2><ul><li>失败或缺失的观测数据不会被转换为零能耗。</li><li>能源和 CO₂e 数据保留单位、时间范围、覆盖情况和背景信息。</li><li>配置或方法变更不得改写历史结果。</li><li>公共仪表板无需登录；管理操作由后端授权。</li></ul></div>`);
}
var _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("zh-CN/roadmap.md");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var roadmap_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
//#endregion
export { __pageData, roadmap_default as default };
