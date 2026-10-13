import { t as _plugin_vue_export_helper_default } from "./plugin-vue_export-helper.BOaGB7Aw.js";
import { useSSRContext } from "vue";
import { ssrRenderAttrs } from "vue/server-renderer";
//#region en-US/roadmap.md
var __pageData = JSON.parse("{\"title\":\"Product epics\",\"description\":\"\",\"frontmatter\":{},\"headers\":[],\"relativePath\":\"en-US/roadmap.md\",\"filePath\":\"en-US/roadmap.md\",\"lastUpdated\":0}");
var _sfc_main = { name: "en-US/roadmap.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
	_push(`<div${ssrRenderAttrs(_attrs)}><h1 id="product-epics" tabindex="-1">Product epics <a class="header-anchor" href="#product-epics" aria-label="Permalink to “Product epics”">​</a></h1><p>The GreenER backlog groups user stories into six epics. Acceptance criteria and tasks remain in the linked issues; check GitHub for current status.</p><table tabindex="0"><thead><tr><th>Epic</th><th>Scope</th></tr></thead><tbody><tr><td><a href="https://github.com/Seliganessecodigo/ABP-3DSM/issues/1" target="_blank" rel="noreferrer">EP01 — Application Catalog</a></td><td>Browse and navigate monitored applications.</td></tr><tr><td><a href="https://github.com/Seliganessecodigo/ABP-3DSM/issues/2" target="_blank" rel="noreferrer">EP02 — Application Monitoring</a></td><td>Application discovery, lifecycle, states, and collection.</td></tr><tr><td><a href="https://github.com/Seliganessecodigo/ABP-3DSM/issues/3" target="_blank" rel="noreferrer">EP03 — Environmental Impact Calculation</a></td><td>Estimate energy and CO₂e with traceable methods and limitations.</td></tr><tr><td><a href="https://github.com/Seliganessecodigo/ABP-3DSM/issues/4" target="_blank" rel="noreferrer">EP04 — Environmental Dashboard</a></td><td>Summaries and aggregated indicators by period.</td></tr><tr><td><a href="https://github.com/Seliganessecodigo/ABP-3DSM/issues/5" target="_blank" rel="noreferrer">EP05 — Analysis and Simulation</a></td><td>Compare applications and simulate regional scenarios.</td></tr><tr><td><a href="https://github.com/Seliganessecodigo/ABP-3DSM/issues/6" target="_blank" rel="noreferrer">EP06 — Configuration and Administration</a></td><td>Configure and administer monitoring with authorization.</td></tr></tbody></table><h2 id="product-principles" tabindex="-1">Product principles <a class="header-anchor" href="#product-principles" aria-label="Permalink to “Product principles”">​</a></h2><ul><li>Failed or missing observations are never converted into zero consumption.</li><li>Energy and CO₂e retain their units, period, coverage, and context.</li><li>Configuration or methodology changes must not rewrite historical results.</li><li>The public dashboard does not require login; administrative changes are authorized by the backend.</li></ul></div>`);
}
var _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("en-US/roadmap.md");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var roadmap_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
//#endregion
export { __pageData, roadmap_default as default };
