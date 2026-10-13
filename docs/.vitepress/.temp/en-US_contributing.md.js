import { t as _plugin_vue_export_helper_default } from "./plugin-vue_export-helper.BOaGB7Aw.js";
import { useSSRContext } from "vue";
import { ssrRenderAttrs } from "vue/server-renderer";
//#region en-US/contributing.md
var __pageData = JSON.parse("{\"title\":\"Contributing\",\"description\":\"\",\"frontmatter\":{},\"headers\":[],\"relativePath\":\"en-US/contributing.md\",\"filePath\":\"en-US/contributing.md\",\"lastUpdated\":0}");
var _sfc_main = { name: "en-US/contributing.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
	_push(`<div${ssrRenderAttrs(_attrs)}><h1 id="contributing" tabindex="-1">Contributing <a class="header-anchor" href="#contributing" aria-label="Permalink to “Contributing”">​</a></h1><h2 id="workflow" tabindex="-1">Workflow <a class="header-anchor" href="#workflow" aria-label="Permalink to “Workflow”">​</a></h2><ol><li>Read the issue and acceptance criteria before changing code.</li><li>Create a branch from <code>develop</code> and keep the change within the task scope.</li><li>Open a pull request targeting <code>develop</code>, using a Conventional Commit title and references to related issues.</li><li>Describe decisions, limitations, checks actually run, and visual evidence for interface changes.</li></ol><h2 id="checks" tabindex="-1">Checks <a class="header-anchor" href="#checks" aria-label="Permalink to “Checks”">​</a></h2><p>CI runs frontend and backend linting, tests, and builds, followed by the SonarQube Cloud quality gate. Fix new findings before completing a pull request. Report checks that were not run locally; never claim a check without an observed result.</p><h2 id="interface-changes" tabindex="-1">Interface changes <a class="header-anchor" href="#interface-changes" aria-label="Permalink to “Interface changes”">​</a></h2><p>Keep each screen and its styles, hooks, and translations together. The frontend supports <code>pt-BR</code>, <code>en-US</code>, <code>es-ES</code>, <code>fr-FR</code>, <code>de-DE</code>, <code>it-IT</code>, <code>ja-JP</code>, and <code>zh-CN</code>. New user-facing text must be complete in all eight languages; English is the fallback.</p><h2 id="integration-or-domain-changes" tabindex="-1">Integration or domain changes <a class="header-anchor" href="#integration-or-domain-changes" aria-label="Permalink to “Integration or domain changes”">​</a></h2><p>Confirm contracts and decisions in issues and technical documents. Do not invent endpoints, schemas, units, environmental factors, or retry policies. Persistent schema changes require a migration; contract changes must update OpenAPI and documentation.</p><h2 id="documentation-site" tabindex="-1">Documentation site <a class="header-anchor" href="#documentation-site" aria-label="Permalink to “Documentation site”">​</a></h2><p>Published content is maintained as Markdown in <code>docs/</code>. Update the equivalent page in all eight locales and validate the site with <code>npm run docs:build</code>.</p></div>`);
}
var _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("en-US/contributing.md");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var contributing_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
//#endregion
export { __pageData, contributing_default as default };
