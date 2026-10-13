import { t as _plugin_vue_export_helper_default } from "./plugin-vue_export-helper.BOaGB7Aw.js";
import { useSSRContext } from "vue";
import { ssrRenderAttrs } from "vue/server-renderer";
//#region en-US/index.md
var __pageData = JSON.parse("{\"title\":\"\",\"description\":\"\",\"frontmatter\":{\"layout\":\"home\",\"hero\":{\"name\":\"GreenER\",\"text\":\"Energy and environmental impact, with context\",\"tagline\":\"Monitor applications and understand energy and CO₂e estimates.\",\"actions\":[{\"theme\":\"brand\",\"text\":\"Get started\",\"link\":\"/getting-started\"},{\"theme\":\"alt\",\"text\":\"Explore the epics\",\"link\":\"/roadmap\"}]},\"features\":[{\"title\":\"Monitoring\",\"details\":\"Application discovery and monitoring with clear states.\"},{\"title\":\"Traceability\",\"details\":\"Metrics, periods, and limitations provide context for indicators.\"},{\"title\":\"Multilingual access\",\"details\":\"Documentation and interface are available in eight languages.\"}]},\"headers\":[],\"relativePath\":\"en-US/index.md\",\"filePath\":\"en-US/index.md\",\"lastUpdated\":0}");
var _sfc_main = { name: "en-US/index.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
	_push(`<div${ssrRenderAttrs(_attrs)}><h2 id="about-the-project" tabindex="-1">About the project <a class="header-anchor" href="#about-the-project" aria-label="Permalink to “About the project”">​</a></h2><p>GreenER is an academic project in the Multiplatform Software Development program at Fatec Jacareí, Brazil. Its goal is to monitor applications, estimate energy consumption, and report equivalent carbon emissions (CO₂e).</p><h2 id="current-status" tabindex="-1">Current status <a class="header-anchor" href="#current-status" aria-label="Permalink to “Current status”">​</a></h2><p>The frontend currently provides an application catalog and detail page. The backend provides the catalog API and performs initial application discovery. Dashboards, environmental calculations, analysis, and administration remain part of the product scope and are organized in the <a href="./roadmap.html">epic backlog</a>.</p><p>Estimates depend on source data and documented contracts. Missing, failed, or stale data does not mean zero consumption or emissions.</p></div>`);
}
var _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("en-US/index.md");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var en_US_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
//#endregion
export { __pageData, en_US_default as default };
