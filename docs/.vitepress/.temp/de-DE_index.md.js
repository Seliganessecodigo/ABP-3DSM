import { t as _plugin_vue_export_helper_default } from "./plugin-vue_export-helper.BOaGB7Aw.js";
import { useSSRContext } from "vue";
import { ssrRenderAttrs } from "vue/server-renderer";
//#region de-DE/index.md
var __pageData = JSON.parse("{\"title\":\"\",\"description\":\"\",\"frontmatter\":{\"layout\":\"home\",\"hero\":{\"name\":\"GreenER\",\"text\":\"Energie und Umweltauswirkungen im Kontext\",\"tagline\":\"Anwendungen überwachen und Energie- sowie CO₂e-Schätzungen verstehen.\",\"actions\":[{\"theme\":\"brand\",\"text\":\"Erste Schritte\",\"link\":\"/getting-started\"},{\"theme\":\"alt\",\"text\":\"Epics entdecken\",\"link\":\"/roadmap\"}]},\"features\":[{\"title\":\"Überwachung\",\"details\":\"Anwendungen entdecken und mit klaren Statusangaben überwachen.\"},{\"title\":\"Nachvollziehbarkeit\",\"details\":\"Messwerte, Zeiträume und Einschränkungen geben Indikatoren den nötigen Kontext.\"},{\"title\":\"Mehrsprachiger Zugang\",\"details\":\"Dokumentation und Benutzeroberfläche sind in acht Sprachen verfügbar.\"}]},\"headers\":[],\"relativePath\":\"de-DE/index.md\",\"filePath\":\"de-DE/index.md\",\"lastUpdated\":0}");
var _sfc_main = { name: "de-DE/index.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
	_push(`<div${ssrRenderAttrs(_attrs)}><h2 id="uber-das-projekt" tabindex="-1">Über das Projekt <a class="header-anchor" href="#uber-das-projekt" aria-label="Permalink to “Über das Projekt”">​</a></h2><p>GreenER ist ein akademisches Projekt im Studiengang Multiplatform Software Development an der Fatec Jacareí in Brasilien. Ziel ist es, Anwendungen zu überwachen, ihren Energieverbrauch zu schätzen und CO₂-Äquivalent-Emissionen (CO₂e) darzustellen.</p><h2 id="aktueller-stand" tabindex="-1">Aktueller Stand <a class="header-anchor" href="#aktueller-stand" aria-label="Permalink to “Aktueller Stand”">​</a></h2><p>Das Frontend bietet derzeit einen Anwendungskatalog und eine Detailseite. Das Backend stellt die Katalog-API bereit und führt die erste Anwendungserkennung aus. Dashboards, Umweltberechnungen, Analysen und Administration gehören zum Produktumfang und sind im <a href="./roadmap.html">Epic-Backlog</a> organisiert.</p><p>Schätzungen hängen von Quelldaten und dokumentierten Verträgen ab. Fehlende oder fehlerhafte Daten sowie veraltete Werte bedeuten keinen Verbrauch und keine Emissionen von null.</p></div>`);
}
var _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("de-DE/index.md");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var de_DE_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
//#endregion
export { __pageData, de_DE_default as default };
