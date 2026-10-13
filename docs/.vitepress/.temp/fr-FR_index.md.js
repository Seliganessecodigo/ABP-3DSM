import { t as _plugin_vue_export_helper_default } from "./plugin-vue_export-helper.BOaGB7Aw.js";
import { useSSRContext } from "vue";
import { ssrRenderAttrs } from "vue/server-renderer";
//#region fr-FR/index.md
var __pageData = JSON.parse("{\"title\":\"\",\"description\":\"\",\"frontmatter\":{\"layout\":\"home\",\"hero\":{\"name\":\"GreenER\",\"text\":\"Énergie et impact environnemental, avec leur contexte\",\"tagline\":\"Suivez les applications et comprenez les estimations d’énergie et de CO₂e.\",\"actions\":[{\"theme\":\"brand\",\"text\":\"Bien démarrer\",\"link\":\"/getting-started\"},{\"theme\":\"alt\",\"text\":\"Découvrir les épopées\",\"link\":\"/roadmap\"}]},\"features\":[{\"title\":\"Suivi\",\"details\":\"Découverte et surveillance des applications avec des états explicites.\"},{\"title\":\"Traçabilité\",\"details\":\"Les mesures, les périodes et les limites donnent leur contexte aux indicateurs.\"},{\"title\":\"Accès multilingue\",\"details\":\"La documentation et l’interface sont disponibles en huit langues.\"}]},\"headers\":[],\"relativePath\":\"fr-FR/index.md\",\"filePath\":\"fr-FR/index.md\",\"lastUpdated\":0}");
var _sfc_main = { name: "fr-FR/index.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
	_push(`<div${ssrRenderAttrs(_attrs)}><h2 id="a-propos-du-projet" tabindex="-1">À propos du projet <a class="header-anchor" href="#a-propos-du-projet" aria-label="Permalink to “À propos du projet”">​</a></h2><p>GreenER est un projet académique du cursus de développement logiciel multiplateforme de Fatec Jacareí, au Brésil. Son objectif est de suivre les applications, d’estimer leur consommation énergétique et de présenter les émissions équivalentes de CO₂ (CO₂e).</p><h2 id="etat-actuel" tabindex="-1">État actuel <a class="header-anchor" href="#etat-actuel" aria-label="Permalink to “État actuel”">​</a></h2><p>Le frontend propose actuellement un catalogue d’applications et une page de détail. Le backend fournit l’API du catalogue et effectue la découverte initiale des applications. Les tableaux de bord, les calculs environnementaux, les analyses et l’administration font partie du périmètre produit et sont organisés dans le <a href="./roadmap.html">backlog des épopées</a>.</p><p>Les estimations dépendent des données sources et des contrats documentés. L’absence de données, une erreur ou des données périmées ne signifient pas une consommation ou des émissions nulles.</p></div>`);
}
var _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("fr-FR/index.md");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var fr_FR_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
//#endregion
export { __pageData, fr_FR_default as default };
