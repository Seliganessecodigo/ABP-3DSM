import { t as _plugin_vue_export_helper_default } from "./plugin-vue_export-helper.BOaGB7Aw.js";
import { useSSRContext } from "vue";
import { ssrRenderAttrs } from "vue/server-renderer";
//#region zh-CN/architecture.md
var __pageData = JSON.parse("{\"title\":\"架构\",\"description\":\"\",\"frontmatter\":{},\"headers\":[],\"relativePath\":\"zh-CN/architecture.md\",\"filePath\":\"zh-CN/architecture.md\",\"lastUpdated\":0}");
var _sfc_main = { name: "zh-CN/architecture.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
	_push(`<div${ssrRenderAttrs(_attrs)}><h1 id="架构" tabindex="-1">架构 <a class="header-anchor" href="#架构" aria-label="Permalink to “架构”">​</a></h1><h2 id="组件" tabindex="-1">组件 <a class="header-anchor" href="#组件" aria-label="Permalink to “组件”">​</a></h2><p>本地环境通过 Docker Compose 启动三个服务：前端、API 和 PostgreSQL。</p><table tabindex="0"><thead><tr><th>区域</th><th>职责</th><th>技术</th></tr></thead><tbody><tr><td><code>frontend/</code></td><td>界面、导航和展示</td><td>React 19、TypeScript、Vite、i18next</td></tr><tr><td><code>backend/</code></td><td>API、用例和外部集成</td><td>NestJS、TypeScript、TypeORM</td></tr><tr><td>PostgreSQL</td><td>应用及领域数据的持久化</td><td>PostgreSQL 18</td></tr></tbody></table><p>前端只调用 GreenER API。只有后端会连接指标聚合器和碳强度服务。</p><h2 id="代码组织" tabindex="-1">代码组织 <a class="header-anchor" href="#代码组织" aria-label="Permalink to “代码组织”">​</a></h2><ul><li><code>frontend/src/pages/</code> 将每个页面与其 hooks、翻译和 CSS Modules 放在一起。</li><li><code>frontend/src/features/</code> 负责领域契约、校验、HTTP 访问、缓存和纯业务规则。</li><li><code>backend/src/modules/</code> 按领域组织端点和用例。</li><li><code>backend/src/integrations/</code> 负责转换并校验辅助 API 的响应。</li><li><code>backend/src/database/</code> 包含实体、迁移和 repositories。</li></ul><h2 id="数据与可靠性" tabindex="-1">数据与可靠性 <a class="header-anchor" href="#数据与可靠性" aria-label="Permalink to “数据与可靠性”">​</a></h2><p>后端负责集成数据源并持久化数据，同时遵循文档中定义的契约、schema 和单位。错误、缺失值、无效响应、过期数据和有效的零值是不同状态；界面必须保留这种区分。</p><p>实现细节请参阅仓库中的<a href="https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md" target="_blank" rel="noreferrer">外部 API 契约</a>和<a href="https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/frontend/src/README.md" target="_blank" rel="noreferrer">前端组织指南</a>。</p></div>`);
}
var _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("zh-CN/architecture.md");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var architecture_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
//#endregion
export { __pageData, architecture_default as default };
