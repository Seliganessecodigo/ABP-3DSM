import { t as _plugin_vue_export_helper_default } from "./plugin-vue_export-helper.BOaGB7Aw.js";
import { useSSRContext } from "vue";
import { ssrRenderAttrs } from "vue/server-renderer";
//#region roadmap.md
var __pageData = JSON.parse("{\"title\":\"Épicos do produto\",\"description\":\"\",\"frontmatter\":{},\"headers\":[],\"relativePath\":\"roadmap.md\",\"filePath\":\"roadmap.md\",\"lastUpdated\":0}");
var _sfc_main = { name: "roadmap.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
	_push(`<div${ssrRenderAttrs(_attrs)}><h1 id="epicos-do-produto" tabindex="-1">Épicos do produto <a class="header-anchor" href="#epicos-do-produto" aria-label="Permalink to “Épicos do produto”">​</a></h1><p>O backlog do GreenER agrupa histórias de usuário em seis épicos. Os critérios de aceite e as tarefas ficam nas issues relacionadas; o status atualizado deve ser consultado diretamente no GitHub.</p><table tabindex="0"><thead><tr><th>Épico</th><th>Escopo</th></tr></thead><tbody><tr><td><a href="https://github.com/Seliganessecodigo/ABP-3DSM/issues/1" target="_blank" rel="noreferrer">EP01 — Catálogo de Aplicações</a></td><td>Consultar e navegar pelas aplicações monitoradas.</td></tr><tr><td><a href="https://github.com/Seliganessecodigo/ABP-3DSM/issues/2" target="_blank" rel="noreferrer">EP02 — Monitoramento de Aplicações</a></td><td>Descoberta, ciclo de vida, estados e coleta de aplicações.</td></tr><tr><td><a href="https://github.com/Seliganessecodigo/ABP-3DSM/issues/3" target="_blank" rel="noreferrer">EP03 — Cálculo de Impacto Ambiental</a></td><td>Estimar energia e CO₂e com método e limitações rastreáveis.</td></tr><tr><td><a href="https://github.com/Seliganessecodigo/ABP-3DSM/issues/4" target="_blank" rel="noreferrer">EP04 — Dashboard Ambiental</a></td><td>Resumos e indicadores agregados por período.</td></tr><tr><td><a href="https://github.com/Seliganessecodigo/ABP-3DSM/issues/5" target="_blank" rel="noreferrer">EP05 — Análise e Simulação</a></td><td>Comparar aplicações e simular cenários regionais.</td></tr><tr><td><a href="https://github.com/Seliganessecodigo/ABP-3DSM/issues/6" target="_blank" rel="noreferrer">EP06 — Configuração e Administração</a></td><td>Configurar e administrar o monitoramento com autorização.</td></tr></tbody></table><h2 id="principios-do-produto" tabindex="-1">Princípios do produto <a class="header-anchor" href="#principios-do-produto" aria-label="Permalink to “Princípios do produto”">​</a></h2><ul><li>Falhas ou falta de observações não se transformam em consumo zero.</li><li>Energia e CO₂e devem manter unidade, período, cobertura e contexto.</li><li>Alterações de configuração e método não devem reescrever resultados históricos.</li><li>O dashboard público não exige login; alterações administrativas são autorizadas no backend.</li></ul></div>`);
}
var _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("roadmap.md");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var roadmap_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
//#endregion
export { __pageData, roadmap_default as default };
