import { t as _plugin_vue_export_helper_default } from "./plugin-vue_export-helper.BOaGB7Aw.js";
import { useSSRContext } from "vue";
import { ssrRenderAttrs } from "vue/server-renderer";
//#region de-DE/roadmap.md
var __pageData = JSON.parse("{\"title\":\"Produkt-Epics\",\"description\":\"\",\"frontmatter\":{},\"headers\":[],\"relativePath\":\"de-DE/roadmap.md\",\"filePath\":\"de-DE/roadmap.md\",\"lastUpdated\":0}");
var _sfc_main = { name: "de-DE/roadmap.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
	_push(`<div${ssrRenderAttrs(_attrs)}><h1 id="produkt-epics" tabindex="-1">Produkt-Epics <a class="header-anchor" href="#produkt-epics" aria-label="Permalink to “Produkt-Epics”">​</a></h1><p>Das GreenER-Backlog gruppiert User Stories in sechs Epics. Akzeptanzkriterien und Aufgaben stehen in den verknüpften Issues; den aktuellen Status bitte direkt auf GitHub prüfen.</p><table tabindex="0"><thead><tr><th>Epic</th><th>Umfang</th></tr></thead><tbody><tr><td><a href="https://github.com/Seliganessecodigo/ABP-3DSM/issues/1" target="_blank" rel="noreferrer">EP01 — Anwendungskatalog</a></td><td>Überwachte Anwendungen anzeigen und durchsuchen.</td></tr><tr><td><a href="https://github.com/Seliganessecodigo/ABP-3DSM/issues/2" target="_blank" rel="noreferrer">EP02 — Anwendungsüberwachung</a></td><td>Erkennung, Lebenszyklus, Status und Datenerfassung.</td></tr><tr><td><a href="https://github.com/Seliganessecodigo/ABP-3DSM/issues/3" target="_blank" rel="noreferrer">EP03 — Berechnung der Umweltauswirkungen</a></td><td>Energie und CO₂e mit nachvollziehbaren Methoden und Einschränkungen schätzen.</td></tr><tr><td><a href="https://github.com/Seliganessecodigo/ABP-3DSM/issues/4" target="_blank" rel="noreferrer">EP04 — Umwelt-Dashboard</a></td><td>Zusammenfassungen und aggregierte Kennzahlen nach Zeitraum.</td></tr><tr><td><a href="https://github.com/Seliganessecodigo/ABP-3DSM/issues/5" target="_blank" rel="noreferrer">EP05 — Analyse und Simulation</a></td><td>Anwendungen vergleichen und regionale Szenarien simulieren.</td></tr><tr><td><a href="https://github.com/Seliganessecodigo/ABP-3DSM/issues/6" target="_blank" rel="noreferrer">EP06 — Konfiguration und Administration</a></td><td>Überwachung mit Berechtigungen konfigurieren und verwalten.</td></tr></tbody></table><h2 id="produktprinzipien" tabindex="-1">Produktprinzipien <a class="header-anchor" href="#produktprinzipien" aria-label="Permalink to “Produktprinzipien”">​</a></h2><ul><li>Fehlgeschlagene oder fehlende Beobachtungen werden niemals als Verbrauch von null interpretiert.</li><li>Energie und CO₂e behalten Einheit, Zeitraum, Abdeckung und Kontext.</li><li>Änderungen an Konfiguration oder Methodik dürfen historische Ergebnisse nicht überschreiben.</li><li>Das öffentliche Dashboard benötigt keine Anmeldung; administrative Änderungen werden vom Backend autorisiert.</li></ul></div>`);
}
var _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("de-DE/roadmap.md");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var roadmap_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
//#endregion
export { __pageData, roadmap_default as default };
