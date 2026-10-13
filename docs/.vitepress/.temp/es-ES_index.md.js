import { t as _plugin_vue_export_helper_default } from "./plugin-vue_export-helper.BOaGB7Aw.js";
import { useSSRContext } from "vue";
import { ssrRenderAttrs } from "vue/server-renderer";
//#region es-ES/index.md
var __pageData = JSON.parse("{\"title\":\"\",\"description\":\"\",\"frontmatter\":{\"layout\":\"home\",\"hero\":{\"name\":\"GreenER\",\"text\":\"Energía e impacto ambiental, con contexto\",\"tagline\":\"Supervisa aplicaciones y comprende las estimaciones de energía y CO₂e.\",\"actions\":[{\"theme\":\"brand\",\"text\":\"Primeros pasos\",\"link\":\"/getting-started\"},{\"theme\":\"alt\",\"text\":\"Explorar las épicas\",\"link\":\"/roadmap\"}]},\"features\":[{\"title\":\"Supervisión\",\"details\":\"Descubrimiento y seguimiento de aplicaciones con estados claros.\"},{\"title\":\"Trazabilidad\",\"details\":\"Las métricas, los periodos y las limitaciones aportan contexto a los indicadores.\"},{\"title\":\"Acceso multilingüe\",\"details\":\"La documentación y la interfaz están disponibles en ocho idiomas.\"}]},\"headers\":[],\"relativePath\":\"es-ES/index.md\",\"filePath\":\"es-ES/index.md\",\"lastUpdated\":0}");
var _sfc_main = { name: "es-ES/index.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
	_push(`<div${ssrRenderAttrs(_attrs)}><h2 id="sobre-el-proyecto" tabindex="-1">Sobre el proyecto <a class="header-anchor" href="#sobre-el-proyecto" aria-label="Permalink to “Sobre el proyecto”">​</a></h2><p>GreenER es un proyecto académico del programa de Desarrollo de Software Multiplataforma de Fatec Jacareí, Brasil. Su objetivo es supervisar aplicaciones, estimar el consumo de energía e informar las emisiones equivalentes de CO₂ (CO₂e).</p><h2 id="estado-actual" tabindex="-1">Estado actual <a class="header-anchor" href="#estado-actual" aria-label="Permalink to “Estado actual”">​</a></h2><p>El frontend ofrece actualmente un catálogo de aplicaciones y una página de detalle. El backend proporciona la API del catálogo y realiza el descubrimiento inicial de aplicaciones. Los paneles, los cálculos ambientales, los análisis y la administración forman parte del alcance del producto y están organizados en el <a href="./roadmap.html">backlog de épicas</a>.</p><p>Las estimaciones dependen de los datos de origen y de los contratos documentados. La falta de datos, los errores o los datos desactualizados no significan consumo ni emisiones iguales a cero.</p></div>`);
}
var _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("es-ES/index.md");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var es_ES_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
//#endregion
export { __pageData, es_ES_default as default };
