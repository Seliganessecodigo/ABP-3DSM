import { t as _plugin_vue_export_helper_default } from "./plugin-vue_export-helper.BOaGB7Aw.js";
import { useSSRContext } from "vue";
import { ssrRenderAttrs } from "vue/server-renderer";
//#region contributing.md
var __pageData = JSON.parse("{\"title\":\"Contribuição\",\"description\":\"\",\"frontmatter\":{},\"headers\":[],\"relativePath\":\"contributing.md\",\"filePath\":\"contributing.md\",\"lastUpdated\":0}");
var _sfc_main = { name: "contributing.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
	_push(`<div${ssrRenderAttrs(_attrs)}><h1 id="contribuicao" tabindex="-1">Contribuição <a class="header-anchor" href="#contribuicao" aria-label="Permalink to “Contribuição”">​</a></h1><h2 id="fluxo-de-trabalho" tabindex="-1">Fluxo de trabalho <a class="header-anchor" href="#fluxo-de-trabalho" aria-label="Permalink to “Fluxo de trabalho”">​</a></h2><ol><li>Consulte a issue e os critérios de aceite antes de alterar o código.</li><li>Crie uma branch baseada em <code>develop</code> e mantenha a mudança no escopo da tarefa.</li><li>Abra uma pull request para <code>develop</code> com título Conventional Commit e referência às issues relacionadas.</li><li>Descreva decisões, limitações, verificações executadas e evidência visual para mudanças de interface.</li></ol><h2 id="verificacoes" tabindex="-1">Verificações <a class="header-anchor" href="#verificacoes" aria-label="Permalink to “Verificações”">​</a></h2><p>A CI executa lint, testes e build do frontend e backend, além do gate SonarQube Cloud. Corrija os apontamentos novos antes da conclusão da PR. Informe no texto da PR tudo o que não foi executado localmente; não declare verificações sem resultado observado.</p><h2 id="mudancas-de-interface" tabindex="-1">Mudanças de interface <a class="header-anchor" href="#mudancas-de-interface" aria-label="Permalink to “Mudanças de interface”">​</a></h2><p>Mantenha cada tela e seus estilos, hooks e traduções próximos. O frontend suporta <code>pt-BR</code>, <code>en-US</code>, <code>es-ES</code>, <code>fr-FR</code>, <code>de-DE</code>, <code>it-IT</code>, <code>ja-JP</code> e <code>zh-CN</code>. Textos novos precisam estar completos nos oito idiomas, com inglês como fallback.</p><h2 id="mudancas-de-integracao-ou-dominio" tabindex="-1">Mudanças de integração ou domínio <a class="header-anchor" href="#mudancas-de-integracao-ou-dominio" aria-label="Permalink to “Mudanças de integração ou domínio”">​</a></h2><p>Confirme contratos e decisões nas issues e nos documentos técnicos. Não invente endpoints, schemas, unidades, fatores ambientais ou políticas de retry. Mudanças de schema persistente precisam de migration; mudanças de contrato devem atualizar OpenAPI e documentação.</p><h2 id="documentacao-do-site" tabindex="-1">Documentação do site <a class="header-anchor" href="#documentacao-do-site" aria-label="Permalink to “Documentação do site”">​</a></h2><p>O conteúdo publicado é mantido em Markdown em <code>docs/</code>. Atualize a página equivalente nos oito locales e valide o site com <code>npm run docs:build</code>.</p></div>`);
}
var _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("contributing.md");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var contributing_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
//#endregion
export { __pageData, contributing_default as default };
