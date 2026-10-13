import { t as _plugin_vue_export_helper_default } from "./plugin-vue_export-helper.BOaGB7Aw.js";
import { useSSRContext } from "vue";
import { ssrRenderAttrs } from "vue/server-renderer";
//#region architecture.md
var __pageData = JSON.parse("{\"title\":\"Arquitetura\",\"description\":\"\",\"frontmatter\":{},\"headers\":[],\"relativePath\":\"architecture.md\",\"filePath\":\"architecture.md\",\"lastUpdated\":0}");
var _sfc_main = { name: "architecture.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
	_push(`<div${ssrRenderAttrs(_attrs)}><h1 id="arquitetura" tabindex="-1">Arquitetura <a class="header-anchor" href="#arquitetura" aria-label="Permalink to “Arquitetura”">​</a></h1><h2 id="componentes" tabindex="-1">Componentes <a class="header-anchor" href="#componentes" aria-label="Permalink to “Componentes”">​</a></h2><p>O ambiente local usa Docker Compose e três serviços: frontend, API e PostgreSQL.</p><table tabindex="0"><thead><tr><th>Área</th><th>Responsabilidade</th><th>Tecnologias</th></tr></thead><tbody><tr><td><code>frontend/</code></td><td>Interface, navegação e apresentação</td><td>React 19, TypeScript, Vite, i18next</td></tr><tr><td><code>backend/</code></td><td>API, casos de uso e integrações externas</td><td>NestJS, TypeScript, TypeORM</td></tr><tr><td>PostgreSQL</td><td>Persistência de aplicações e dados do domínio</td><td>PostgreSQL 18</td></tr></tbody></table><p>O frontend chama apenas a API GreenER. Somente o backend acessa o Agregador de Métricas e o Serviço de Intensidade de Carbono.</p><h2 id="organizacao-do-codigo" tabindex="-1">Organização do código <a class="header-anchor" href="#organizacao-do-codigo" aria-label="Permalink to “Organização do código”">​</a></h2><ul><li><code>frontend/src/pages/</code> mantém cada tela com seus hooks, traduções e CSS Modules.</li><li><code>frontend/src/features/</code> mantém contratos, validação, acesso HTTP, cache e regras puras do domínio.</li><li><code>backend/src/modules/</code> contém casos de uso e endpoints agrupados por domínio.</li><li><code>backend/src/integrations/</code> adapta e valida as respostas das APIs auxiliares.</li><li><code>backend/src/database/</code> mantém entidades, migrations e repositories.</li></ul><h2 id="dados-e-confiabilidade" tabindex="-1">Dados e confiabilidade <a class="header-anchor" href="#dados-e-confiabilidade" aria-label="Permalink to “Dados e confiabilidade”">​</a></h2><p>O backend é responsável por integrar fontes e persistir dados. Contratos, schemas e unidades documentados devem ser respeitados. Erro, ausência, resposta inválida e dado desatualizado são estados diferentes de zero válido; as telas devem preservar essa distinção.</p><p>Consulte os <a href="https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md" target="_blank" rel="noreferrer">contratos das APIs externas no repositório</a> e a <a href="https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/frontend/src/README.md" target="_blank" rel="noreferrer">organização do frontend</a> para detalhes de implementação.</p></div>`);
}
var _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("architecture.md");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var architecture_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
//#endregion
export { __pageData, architecture_default as default };
