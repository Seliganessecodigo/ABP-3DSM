import { t as _plugin_vue_export_helper_default } from "./plugin-vue_export-helper.BOaGB7Aw.js";
import { useSSRContext } from "vue";
import { ssrRenderAttrs } from "vue/server-renderer";
//#region index.md
var __pageData = JSON.parse("{\"title\":\"\",\"description\":\"\",\"frontmatter\":{\"layout\":\"home\",\"hero\":{\"name\":\"GreenER\",\"text\":\"Energia e impacto ambiental, com contexto\",\"tagline\":\"Acompanhe aplicações e entenda as estimativas de energia e CO₂e.\",\"actions\":[{\"theme\":\"brand\",\"text\":\"Primeiros passos\",\"link\":\"/getting-started\"},{\"theme\":\"alt\",\"text\":\"Explorar os épicos\",\"link\":\"/roadmap\"}]},\"features\":[{\"title\":\"Acompanhamento\",\"details\":\"Descoberta e monitoramento de aplicações com estados claros.\"},{\"title\":\"Rastreabilidade\",\"details\":\"Métricas, períodos e limitações fazem parte da leitura dos indicadores.\"},{\"title\":\"Acesso multilíngue\",\"details\":\"Documentação e interface disponíveis em oito idiomas.\"}]},\"headers\":[],\"relativePath\":\"index.md\",\"filePath\":\"index.md\",\"lastUpdated\":0}");
var _sfc_main = { name: "index.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
	_push(`<div${ssrRenderAttrs(_attrs)}><h2 id="sobre-o-projeto" tabindex="-1">Sobre o projeto <a class="header-anchor" href="#sobre-o-projeto" aria-label="Permalink to “Sobre o projeto”">​</a></h2><p>GreenER é um projeto acadêmico de Desenvolvimento de Software Multiplataforma da Fatec Jacareí. Seu objetivo é ajudar a acompanhar aplicações, estimar o consumo de energia e apresentar emissões equivalentes de CO₂ (CO₂e).</p><h2 id="estado-atual" tabindex="-1">Estado atual <a class="header-anchor" href="#estado-atual" aria-label="Permalink to “Estado atual”">​</a></h2><p>O frontend já oferece um catálogo de aplicações e uma página de detalhe. O backend fornece a API do catálogo e realiza a descoberta inicial das aplicações. Dashboard, cálculos ambientais, análises e administração fazem parte do escopo do produto e estão organizados no <a href="./roadmap.html">backlog de épicos</a>.</p><p>As estimativas dependem dos dados e contratos das fontes. Ausência, erro ou dado desatualizado não significa consumo ou emissão zero.</p></div>`);
}
var _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("index.md");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var docs_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
//#endregion
export { __pageData, docs_default as default };
