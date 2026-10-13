import { t as _plugin_vue_export_helper_default } from "./plugin-vue_export-helper.BOaGB7Aw.js";
import { useSSRContext } from "vue";
import { ssrRenderAttrs } from "vue/server-renderer";
//#region it-IT/index.md
var __pageData = JSON.parse("{\"title\":\"\",\"description\":\"\",\"frontmatter\":{\"layout\":\"home\",\"hero\":{\"name\":\"GreenER\",\"text\":\"Energia e impatto ambientale, nel loro contesto\",\"tagline\":\"Monitora le applicazioni e comprendi le stime di energia e CO₂e.\",\"actions\":[{\"theme\":\"brand\",\"text\":\"Per iniziare\",\"link\":\"/getting-started\"},{\"theme\":\"alt\",\"text\":\"Esplora gli epic\",\"link\":\"/roadmap\"}]},\"features\":[{\"title\":\"Monitoraggio\",\"details\":\"Individuazione e monitoraggio delle applicazioni con stati chiari.\"},{\"title\":\"Tracciabilità\",\"details\":\"Metriche, periodi e limiti forniscono il contesto degli indicatori.\"},{\"title\":\"Accesso multilingue\",\"details\":\"Documentazione e interfaccia sono disponibili in otto lingue.\"}]},\"headers\":[],\"relativePath\":\"it-IT/index.md\",\"filePath\":\"it-IT/index.md\",\"lastUpdated\":0}");
var _sfc_main = { name: "it-IT/index.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
	_push(`<div${ssrRenderAttrs(_attrs)}><h2 id="informazioni-sul-progetto" tabindex="-1">Informazioni sul progetto <a class="header-anchor" href="#informazioni-sul-progetto" aria-label="Permalink to “Informazioni sul progetto”">​</a></h2><p>GreenER è un progetto accademico del corso di sviluppo software multipiattaforma di Fatec Jacareí, in Brasile. Il suo obiettivo è monitorare le applicazioni, stimare il consumo energetico e mostrare le emissioni equivalenti di CO₂ (CO₂e).</p><h2 id="stato-attuale" tabindex="-1">Stato attuale <a class="header-anchor" href="#stato-attuale" aria-label="Permalink to “Stato attuale”">​</a></h2><p>Il frontend offre attualmente un catalogo delle applicazioni e una pagina di dettaglio. Il backend fornisce l’API del catalogo e svolge l’individuazione iniziale delle applicazioni. Dashboard, calcoli ambientali, analisi e amministrazione fanno parte dell’ambito del prodotto e sono organizzati nel <a href="./roadmap.html">backlog degli epic</a>.</p><p>Le stime dipendono dai dati di origine e dai contratti documentati. Dati mancanti, errori o dati obsoleti non significano consumo o emissioni pari a zero.</p></div>`);
}
var _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("it-IT/index.md");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var it_IT_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
//#endregion
export { __pageData, it_IT_default as default };
