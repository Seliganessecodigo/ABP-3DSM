import { t as _plugin_vue_export_helper_default } from "./plugin-vue_export-helper.BOaGB7Aw.js";
import { useSSRContext } from "vue";
import { ssrRenderAttrs } from "vue/server-renderer";
//#region it-IT/roadmap.md
var __pageData = JSON.parse("{\"title\":\"Epic del prodotto\",\"description\":\"\",\"frontmatter\":{},\"headers\":[],\"relativePath\":\"it-IT/roadmap.md\",\"filePath\":\"it-IT/roadmap.md\",\"lastUpdated\":0}");
var _sfc_main = { name: "it-IT/roadmap.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
	_push(`<div${ssrRenderAttrs(_attrs)}><h1 id="epic-del-prodotto" tabindex="-1">Epic del prodotto <a class="header-anchor" href="#epic-del-prodotto" aria-label="Permalink to “Epic del prodotto”">​</a></h1><p>Il backlog GreenER raggruppa le user story in sei epic. Criteri di accettazione e attività restano nelle issue collegate; consulta GitHub per lo stato aggiornato.</p><table tabindex="0"><thead><tr><th>Epic</th><th>Ambito</th></tr></thead><tbody><tr><td><a href="https://github.com/Seliganessecodigo/ABP-3DSM/issues/1" target="_blank" rel="noreferrer">EP01 — Catalogo delle applicazioni</a></td><td>Consultare e navigare le applicazioni monitorate.</td></tr><tr><td><a href="https://github.com/Seliganessecodigo/ABP-3DSM/issues/2" target="_blank" rel="noreferrer">EP02 — Monitoraggio delle applicazioni</a></td><td>Individuazione, ciclo di vita, stati e raccolta delle applicazioni.</td></tr><tr><td><a href="https://github.com/Seliganessecodigo/ABP-3DSM/issues/3" target="_blank" rel="noreferrer">EP03 — Calcolo dell&#39;impatto ambientale</a></td><td>Stimare energia e CO₂e con metodi e limiti tracciabili.</td></tr><tr><td><a href="https://github.com/Seliganessecodigo/ABP-3DSM/issues/4" target="_blank" rel="noreferrer">EP04 — Dashboard ambientale</a></td><td>Riepiloghi e indicatori aggregati per periodo.</td></tr><tr><td><a href="https://github.com/Seliganessecodigo/ABP-3DSM/issues/5" target="_blank" rel="noreferrer">EP05 — Analisi e simulazione</a></td><td>Confrontare applicazioni e simulare scenari regionali.</td></tr><tr><td><a href="https://github.com/Seliganessecodigo/ABP-3DSM/issues/6" target="_blank" rel="noreferrer">EP06 — Configurazione e amministrazione</a></td><td>Configurare e amministrare il monitoraggio con autorizzazione.</td></tr></tbody></table><h2 id="principi-del-prodotto" tabindex="-1">Principi del prodotto <a class="header-anchor" href="#principi-del-prodotto" aria-label="Permalink to “Principi del prodotto”">​</a></h2><ul><li>Errori o osservazioni mancanti non vengono mai convertiti in consumo zero.</li><li>Energia e CO₂e mantengono unità, periodo, copertura e contesto.</li><li>Le modifiche alla configurazione o alla metodologia non devono riscrivere i risultati storici.</li><li>La dashboard pubblica non richiede accesso; il backend autorizza le modifiche amministrative.</li></ul></div>`);
}
var _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("it-IT/roadmap.md");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var roadmap_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
//#endregion
export { __pageData, roadmap_default as default };
