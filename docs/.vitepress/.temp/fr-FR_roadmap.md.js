import { t as _plugin_vue_export_helper_default } from "./plugin-vue_export-helper.BOaGB7Aw.js";
import { useSSRContext } from "vue";
import { ssrRenderAttrs } from "vue/server-renderer";
//#region fr-FR/roadmap.md
var __pageData = JSON.parse("{\"title\":\"Épopées du produit\",\"description\":\"\",\"frontmatter\":{},\"headers\":[],\"relativePath\":\"fr-FR/roadmap.md\",\"filePath\":\"fr-FR/roadmap.md\",\"lastUpdated\":0}");
var _sfc_main = { name: "fr-FR/roadmap.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
	_push(`<div${ssrRenderAttrs(_attrs)}><h1 id="epopees-du-produit" tabindex="-1">Épopées du produit <a class="header-anchor" href="#epopees-du-produit" aria-label="Permalink to “Épopées du produit”">​</a></h1><p>Le backlog GreenER regroupe les récits utilisateurs en six épopées. Les critères d’acceptation et les tâches restent dans les issues associées ; consultez GitHub pour connaître leur état actuel.</p><table tabindex="0"><thead><tr><th>Épopée</th><th>Périmètre</th></tr></thead><tbody><tr><td><a href="https://github.com/Seliganessecodigo/ABP-3DSM/issues/1" target="_blank" rel="noreferrer">EP01 — Catalogue des applications</a></td><td>Consulter et parcourir les applications surveillées.</td></tr><tr><td><a href="https://github.com/Seliganessecodigo/ABP-3DSM/issues/2" target="_blank" rel="noreferrer">EP02 — Surveillance des applications</a></td><td>Découverte, cycle de vie, états et collecte des applications.</td></tr><tr><td><a href="https://github.com/Seliganessecodigo/ABP-3DSM/issues/3" target="_blank" rel="noreferrer">EP03 — Calcul de l’impact environnemental</a></td><td>Estimer l’énergie et le CO₂e avec des méthodes et limites traçables.</td></tr><tr><td><a href="https://github.com/Seliganessecodigo/ABP-3DSM/issues/4" target="_blank" rel="noreferrer">EP04 — Tableau de bord environnemental</a></td><td>Synthèses et indicateurs agrégés par période.</td></tr><tr><td><a href="https://github.com/Seliganessecodigo/ABP-3DSM/issues/5" target="_blank" rel="noreferrer">EP05 — Analyse et simulation</a></td><td>Comparer des applications et simuler des scénarios régionaux.</td></tr><tr><td><a href="https://github.com/Seliganessecodigo/ABP-3DSM/issues/6" target="_blank" rel="noreferrer">EP06 — Configuration et administration</a></td><td>Configurer et administrer la surveillance avec autorisation.</td></tr></tbody></table><h2 id="principes-du-produit" tabindex="-1">Principes du produit <a class="header-anchor" href="#principes-du-produit" aria-label="Permalink to “Principes du produit”">​</a></h2><ul><li>Les échecs ou l’absence d’observations ne sont jamais convertis en consommation nulle.</li><li>L’énergie et le CO₂e conservent leurs unités, période, couverture et contexte.</li><li>Les changements de configuration ou de méthode ne doivent pas réécrire les résultats historiques.</li><li>Le tableau de bord public ne nécessite pas de connexion ; le backend autorise les changements administratifs.</li></ul></div>`);
}
var _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("fr-FR/roadmap.md");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var roadmap_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
//#endregion
export { __pageData, roadmap_default as default };
