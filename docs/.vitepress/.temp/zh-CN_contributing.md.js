import { t as _plugin_vue_export_helper_default } from "./plugin-vue_export-helper.BOaGB7Aw.js";
import { useSSRContext } from "vue";
import { ssrRenderAttrs } from "vue/server-renderer";
//#region zh-CN/contributing.md
var __pageData = JSON.parse("{\"title\":\"参与贡献\",\"description\":\"\",\"frontmatter\":{},\"headers\":[],\"relativePath\":\"zh-CN/contributing.md\",\"filePath\":\"zh-CN/contributing.md\",\"lastUpdated\":0}");
var _sfc_main = { name: "zh-CN/contributing.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
	_push(`<div${ssrRenderAttrs(_attrs)}><h1 id="参与贡献" tabindex="-1">参与贡献 <a class="header-anchor" href="#参与贡献" aria-label="Permalink to “参与贡献”">​</a></h1><h2 id="工作流程" tabindex="-1">工作流程 <a class="header-anchor" href="#工作流程" aria-label="Permalink to “工作流程”">​</a></h2><ol><li>修改代码前先查看 issue 和验收标准。</li><li>从 <code>develop</code> 创建分支，并将变更限制在任务范围内。</li><li>向 <code>develop</code> 提交 pull request，使用 Conventional Commit 标题并引用相关 issue。</li><li>说明设计决策、限制、实际执行的检查；界面变更应附上视觉证据。</li></ol><h2 id="检查" tabindex="-1">检查 <a class="header-anchor" href="#检查" aria-label="Permalink to “检查”">​</a></h2><p>CI 会运行前端和后端的 lint、测试与构建，并执行 SonarQube Cloud 质量门禁。完成 PR 前修复新增问题。注明本地未执行的检查；不要声称通过了未实际观察的检查。</p><h2 id="界面变更" tabindex="-1">界面变更 <a class="header-anchor" href="#界面变更" aria-label="Permalink to “界面变更”">​</a></h2><p>每个页面应与自己的样式、hooks 和翻译放在一起。前端支持 <code>pt-BR</code>、<code>en-US</code>、<code>es-ES</code>、<code>fr-FR</code>、<code>de-DE</code>、<code>it-IT</code>、<code>ja-JP</code> 和 <code>zh-CN</code>。新增的用户可见文本必须提供完整的八种语言版本，英语为回退语言。</p><h2 id="集成或领域变更" tabindex="-1">集成或领域变更 <a class="header-anchor" href="#集成或领域变更" aria-label="Permalink to “集成或领域变更”">​</a></h2><p>请在 issue 和技术文档中确认契约与决策。不要自行编造端点、schema、单位、环境因子或重试策略。持久化 schema 变更需要迁移；契约变更需要同步更新 OpenAPI 和文档。</p><h2 id="文档网站" tabindex="-1">文档网站 <a class="header-anchor" href="#文档网站" aria-label="Permalink to “文档网站”">​</a></h2><p>发布内容以 Markdown 形式保存在 <code>docs/</code>。请同步更新全部八种语言的对应页面，并运行 <code>npm run docs:build</code> 验证网站。</p></div>`);
}
var _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("zh-CN/contributing.md");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var contributing_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
//#endregion
export { __pageData, contributing_default as default };
